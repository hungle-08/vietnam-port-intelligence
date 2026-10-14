# Vietnam Port Intelligence

Source base cho ứng dụng theo dõi sản lượng và thị phần các cảng ở Việt Nam theo ngày, tháng và năm.

## Stack

- Next.js App Router, React, TypeScript.
- Tailwind CSS và shadcn/ui (Base UI, Lucide).
- Neon Postgres, truy vấn bằng `@neondatabase/serverless` qua HTTP.
- Một ứng dụng Next.js duy nhất: Server Components/Server Actions sẽ truy cập Neon, không cần backend riêng.

## Chạy local

Yêu cầu Node.js 22.13+ và npm. Dùng phiên bản Node.js 22 LTS hiện hành.

```bash
npm ci
npm run dev
```

Mở http://localhost:3000. `/` chuyển về `/vi`; `/en` là giao diện tiếng Anh. Home dùng branding xanh đại dương, bản đồ Việt Nam SVG nền trong suốt với phần đất đỏ và sao vàng theo cờ Việt Nam, danh mục cảng/doanh nghiệp và bộ lọc tên/mã/vùng. Bản đồ cố định, không zoom/kéo; luôn hiển thị toàn bộ cảng, độc lập với bộ lọc danh sách. Các điểm gần nhau được nhóm kèm số lượng cảng và danh sách lựa chọn. Dữ liệu đọc từ Neon ở server; lỗi kết nối được hiển thị rõ. Sản lượng, thị phần và bộ lọc thời gian chưa triển khai.

## Neon

Workspace đã liên kết với project `green-grass-45608723` (`vietnam-port-intelligence`), nhánh `production`. `.neon` và `.env.local` được bỏ qua bởi Git. Neon skills được cài trong `.agents/skills`; Neon MCP được cấu hình ở cấp máy.

Khi clone trên máy khác:

```bash
npm i -g neon@latest
neon login
neon link --project-id green-grass-45608723 --branch production -y
npm run db:check
```

`neon link` tải biến môi trường vào `.env.local`. Có thể dùng `neon env pull` để cập nhật lại. `.env.example` chỉ liệt kê tên biến, không chứa credentials.

`neon.ts` sử dụng đúng cấu hình ban đầu:

```ts
import { defineConfig } from "@neon/config/v1";
export default defineConfig({});
```

```bash
npm run neon:plan
npm run neon:deploy
```

Lệnh `neon deploy` áp dụng cấu hình Neon; không publish frontend Next.js. Schema và danh mục được quản lý bằng các script riêng:

```bash
npm run db:migrate
npm run db:seed
npm run db:verify
```

Neon production đã lưu 15 mã theo ảnh tham khảo người dùng trong `port_entities`. Mỗi bản ghi là cảng/doanh nghiệp cảng, chưa đi sâu vào bến. Bản đồ hiển thị 14 đơn vị với 16 điểm vị trí tương đối, gom nhóm điểm gần nhau; MVN chỉ có trong danh mục. Hoàng Sa và Trường Sa có nhãn và điểm đảo tham khảo. Tọa độ chính xác và hoạt động chưa được xác minh. Chi tiết nguồn và phạm vi: [data/README.md](data/README.md).

## Cấu trúc

```text
src/
  app/                 # Routes, root layout, CSS và trang tổng quan
  components/ui/       # Components shadcn
  lib/
    db.ts              # Kết nối Neon; chặn import từ client bằng server-only
    utils.ts           # Utility cho UI
scripts/check-db.ts    # Kiểm tra kết nối thật bằng SELECT 1
neon.ts                # Cấu hình Neon
.env.example           # Danh sách biến môi trường an toàn
```

Dùng `getDb()` trong Server Components, Server Actions hoặc Route Handlers:

```ts
import { getDb } from "@/lib/db";
const sql = getDb();
const rows = await sql`SELECT 1 AS connected`;
```

Giữ `DATABASE_URL` ở server; không sử dụng tiền tố `NEXT_PUBLIC_`. Dùng tagged template để truyền tham số truy vấn. Chỉ dùng `DATABASE_URL_UNPOOLED` cho migration và tác vụ cần kết nối trực tiếp. Tạo nhánh Neon riêng để phát triển schema trước khi áp dụng lên production.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
npm run db:check
```

`db:check` chỉ chạy truy vấn đọc `SELECT 1`, không thay đổi dữ liệu. Script chỉ thông báo thành công/thất bại, không in connection string.

## Phạm vi tiếp theo

Đối chiếu tọa độ chính xác và trạng thái hoạt động, sau đó bổ sung nguồn sản lượng, đơn vị TEU/tấn, tổng hợp theo kỳ và tính thị phần. Đã có tài khoản tùy chọn, cấu hình admin và crawler hãng tàu/PHP; chưa có báo cáo sản lượng hàng thực tế hay CRUD danh mục. Danh mục 15 mã là tập khởi đầu, chưa phải mọi cảng Việt Nam.

## Dependency audit tại thời điểm khởi tạo

`npm audit --omit=dev` không ghi nhận lỗ hổng ở dependencies production. Audit toàn bộ vẫn ghi nhận 9 cảnh báo mức high trong chuỗi dependencies công cụ shadcn/ESLint (`braces`, `micromatch`, `fast-glob`, ...). `braces@3.0.3` vẫn là bản mới nhất tại thời điểm kiểm tra; đề xuất `--force` của npm sẽ hạ phiên bản các công cụ chính, nên chưa áp dụng. Kiểm tra lại khi có bản vá upstream.

### Top 10 hãng tàu container

Home hiển thị bảng xếp hạng theo sức chở đội tàu đang khai thác (TEU), số tàu và tỷ trọng sức chở toàn cầu. Nguồn Alphaliner, dữ liệu chốt ngày 12/10/2026; số liệu hợp nhất theo hãng/tập đoàn, không phải thị phần ở cảng Việt Nam. Dữ liệu đọc từ Neon; nếu chưa lấy được bản DB, giao diện ghi rõ đang dùng bản dữ liệu đã lưu có ngày và nguồn, không giả lập số liệu.

```bash
npm run shipping:collect -- --input data/sources/alphaliner-2026-10-12.txt
npm run db:migrate
npm run shipping:seed
npm run shipping:verify
```

`shipping:collect` không có `--input` sẽ thử tải nguồn công khai trực tiếp với timeout. Import chỉ thành công khi có ngày chốt cùng bảng tỷ trọng và bảng đội tàu đầy đủ, nhất quán. Nguồn hiện tại được trích từ kết quả web index do HTTP trực tiếp lỗi DNS; xem provenance trong `data/shipping-lines.json` và `data/sources/alphaliner-2026-10-12.txt`. Lịch tự động được cấu hình trong phần Monthly shipping data cron bên dưới.

`shipping_carriers` giữ ID ổn định, `shipping_fleet_snapshots` và `shipping_fleet_rankings` giữ lịch sử theo ngày và hash nội dung. Import lại không nhân bản snapshot. `shipping_carrier_port_links` là bảng liên kết có nguồn/ngày hiệu lực, hiện chưa có quan hệ suy đoán. Khi cần nhập bằng công cụ SQL: `npm run shipping:seed -- --export` tạo `data/shipping-lines-import.sql`.

### Optional accounts

- Vietnamese: `/vi/login`, `/vi/register`; English: `/en/login`, `/en/register`.
- Registration accepts name, email and password and signs in immediately. Email verification is not required. Existing Home, map, port directory and shipping data remain public.
- New passwords: 15–128 Unicode characters, spaces allowed. Salted scrypt hashes are stored in `auth_users`; raw passwords are never stored.
- Seven-day sessions use an HttpOnly, SameSite=Lax cookie (Secure in production). `auth_sessions` stores only the token digest and checks expiry/revocation. Logout revokes the session in Neon.
- Persistent 15-minute limits in `auth_rate_limits`: 10 login / 5 registration attempts per email. Accepted per-email requests additionally consume a shared work budget of 500 login / 100 registration attempts per window. This initial budget can be adjusted with expected traffic. Expired session/rate rows are retained; scheduled cleanup can be added later.
- Apply tables with `npm run db:migrate`; check them with `npm run auth:verify`. Development-only rollback checks: `DB_ENV_FILE=.env.neon-dev npm run auth:verify -- --rollback-test`. No test account is retained.
- No password reset, social sign-in, email verification or required authentication in this version.

### Appearance

Light mode is the default. The Light/Dark toggle in the Home and account headers saves the explicit choice in local storage (`vpi-theme`). A small head script applies the saved preference before paint. Both palettes cover shared components, forms, port details, map illustrations and charts; no automatic system-theme override. Switching still works when browser storage is unavailable.

### Admin workspace

`/admin` is an authenticated, admin-only configuration workspace. Home shows its link only for users whose server-stored role is `admin`. Anonymous visitors are sent to login; regular users are returned to Home. Shipping and PHP collection settings are editable and persisted in Neon. Port management and general site settings remain placeholders.

Migration `0005_account_roles.sql` gives existing and new public accounts the default role `user`. Public registration never accepts a role. Administrators can be provisioned with `npx tsx scripts/seed-admin.ts`, supplying a JSON object containing `name`, `email` and `password` through stdin. The script hashes the supplied password, upserts that explicit account as admin and revokes its previous sessions atomically. Credentials are not saved in source code or logs. This trusted provisioning path accepts a deliberately supplied short password; the public registration password policy remains unchanged.

### Monthly shipping data cron

`/admin` now includes the Top 10 shipping lines configuration: enabled status, interval (1–12 months), day (1–28), supported Alphaliner source URL, next due date and recent run history. Configuration is stored in `admin_job_configs`, with server-side admin authorization and optimistic revision checks. `admin_job_runs` records outcomes. Changing a schedule resets the next occurrence; saving an unchanged schedule preserves it.

`vercel.json` invokes `GET /api/cron/shipping-lines` daily at 00:00 UTC (around 07:00 Vietnam; Vercel timing is approximate). The handler checks the DB schedule and performs collection only when due. Default: day 1 every month. This daily check allows admin changes without redeployment and retries failed collection on the next day. A five-minute database lease prevents overlapping collection; successful completion atomically saves a complete snapshot and advances the schedule. Failures keep the previous good snapshot.

Set `DATABASE_URL` and `CRON_SECRET` in Vercel Production environment variables, then deploy Production. The same secret goes in ignored `.env.local`; never expose it through `NEXT_PUBLIC_` variables. Cron is not scheduled by localhost. The route rejects requests without matching bearer authorization. After deployment inspect Vercel Settings → Cron Jobs and its invocation logs.

Only the Alphaliner TOP 100 page and its public `rooter.php` URL are supported. Both use the same public JSON methods used by the source webpage (`getTop100Table`, `getTextCalculations`). Fetching is bounded to 20 seconds/2 MB and refuses redirects. An unknown top-ten carrier, changed source format or inconsistent ranking is rejected; adding a different provider requires its own verified adapter. Public ranking dates are generated in the visitor's browser, so automatic snapshots explicitly display **collection date**, not an asserted source publication date.

Integration verification uses only the dedicated Neon development branch, briefly exercises due/failed/unchanged/edited configurations, then restores the original schedule. It retains development test run history and validated snapshots:

```bash
DB_ENV_FILE=.env.neon-dev NODE_OPTIONS=--conditions=react-server npx tsx scripts/verify-shipping-cron.ts
```

Use `--fixture` on the integration command to verify database behavior with the captured public response when the source is temporarily unreachable. This does not assert a fresh network collection.

### PHP: kế hoạch tàu và DWT theo ngày

Đã lưu 5 điểm khai thác liên quan PHP: Tân Vũ, Hoàng Diệu, Chùa Vẽ (phạm vi trực tiếp); HTIT bến 3–4 Lạch Huyện và Đình Vũ/DVP (phạm vi hệ thống, quan hệ vốn 51%). Membership lưu nguồn, ngày chứng cứ và ngày hiệu lực; phân loại khởi đầu 2026 dựa trên hồ sơ cuối năm 2025, cần cập nhật khi quan hệ thay đổi. DVP dùng chung một thực thể Đình Vũ, không sao chép dữ liệu tàu. Không nhân DWT với tỷ lệ sở hữu.

Nguồn: [kế hoạch tàu Cảng vụ Hải Phòng](https://cangvuhaiphong.gov.vn/ke-hoach-tau/), đọc trang nhúng công khai `csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx`. URL chỉ đổi được giữa hai địa chỉ hỗ trợ; nguồn mới cần bộ đọc riêng. Truy vấn dùng ngày Việt Nam, kiểm tra ngày trong nội dung, đủ các mục/tiêu đề cột, timeout và giới hạn dung lượng.

**DWT tàu vào theo kế hoạch** là tổng trọng tải thiết kế tàu trên các lượt vào cảng trong kế hoạch. Đây không phải tấn hàng qua cảng hay xác nhận tàu đã thực sự cập cảng. Chỉ lưu tàu vào có nơi đến thuộc 5 cảng PHP và tàu rời có nơi đi thuộc 5 cảng PHP. Tàu rời không cộng vào chỉ số DWT tàu vào; lượt chuyển cảng, qua luồng và các cảng khác bị loại trước khi lưu. Không có IMO/ID lượt tàu ổn định từ nguồn; khóa nội bộ dựa trên ngày, loại di chuyển, giờ, tên tàu và nơi đi/đến. Chưa ghép lượt vào/rời thành chuyến thực tế. DWT thiếu giữ `null`, đi kèm số lượt thiếu. Ngày chưa lấy được trả về `available=false`, không hiển thị như ngày có giá trị 0.

Snapshot ngày bất biến giữ bản trích xuất các dòng nguồn thuộc PHP và dữ liệu đã đọc, không giữ toàn bộ HTML kế hoạch Hải Phòng. Chỉ snapshot hợp lệ mới nhất được dùng để tổng hợp; chạy lại không cộng trùng. Dòng lặp cùng khóa và cùng DWT/GT/LOA chỉ tính một lượt; khác thông tin phụ được lưu trong `supplementalVariants`, giá trị phụ xung đột không được khẳng định. Xung đột trọng tải bị từ chối để giữ snapshot tốt trước đó. Mục qua luồng tồn tại nhưng trống được chấp nhận là không có lượt; mất mục hoặc đổi cấu trúc bị từ chối.

Production đã đối chiếu đủ **286 ngày (01/01–13/10/2026)**, 3.419 lượt vào/rời 5 cảng PHP (1.700 lượt vào, 1.719 lượt rời), sau khi dọn 20.875 lượt ngoài phạm vi theo yêu cầu ngày 14/10/2026. Trong phạm vi hệ thống PHP có 1.700 lượt vào theo kế hoạch, tổng 38.929.781 DWT, không có lượt thiếu DWT trong tập này. Đây là kết quả backfill ngày 13/10/2026, có thể thay đổi khi nguồn sửa kế hoạch.

```bash
npm run db:migrate
npm run php:seed
npm run php:backfill -- --from 2026-01-01 --to 2026-10-13
npm run php:backfill -- --retry-failed
# Lấy lại cả ngày đã có khi nguồn sửa kế hoạch:
npm run php:backfill -- --from 2026-10-01 --to 2026-10-13 --refresh
# Chỉ kiểm tra tích hợp trên nhánh development:
DB_ENV_FILE=.env.neon-dev npm run php:verify
DB_ENV_FILE=.env.neon-dev npm run php:verify-cron
```

Backfill chạy tuần tự có giới hạn tốc độ, checkpoint/coverage trong DB. Lệnh mặc định bỏ qua ngày đã thành công và thử ngày lỗi/chưa có; `--retry-failed` chỉ xử lý ngày lỗi đã ghi nhận. Không tạo giá trị giả để lấp ngày thiếu.

`/admin` hiển thị các điểm PHP, phạm vi, tổng DWT kế hoạch, coverage, lịch và lịch sử chạy. Admin có thể bật/tắt, đổi chu kỳ **1–4 ngày** và URL nguồn hỗ trợ. Mặc định mỗi ngày, 00:00 Việt Nam. `GET /api/cron/php-vessel-plans` dùng `CRON_SECRET`, lease DB và kiểm tra revision để giữ thay đổi admin khi đang chạy. Mỗi lượt cập nhật ngày hiện tại và ba ngày trước; ngày lỗi xa hơn cần script backfill. Lỗi giữ dữ liệu tốt trước đó và lịch đến hạn để lần kiểm tra sau thử lại.

Vercel Hobby: `vercel.json` đặt `0 17 * * *` (UTC), tương ứng nửa đêm Việt Nam, có thể chạy trong khoảng 00:00–00:59. Không đổi giờ tùy ý ngay trong admin trên gói này; đổi giờ cần sửa cấu hình Vercel và deploy. Chỉ Production deployment kích hoạt cron, localhost không tự lên lịch. Chưa deploy/push trong bước triển khai local này. Trang báo cáo PHP công khai và bảng theo tháng được mô tả ở mục Trang chi tiết PHP bên dưới.

### Trang chi tiết PHP

`/vi/ports/PHP` và `/en/ports/PHP` là trang công khai, không yêu cầu đăng nhập. Nút “Xem chi tiết” ở dòng PHP và thông tin PHP trên bản đồ dẫn tới trang này. Các mã khác vẫn dùng phần tra cứu hiện tại.

Trang đọc 5 cảng trong hệ thống PHP từ Neon, phân nhóm trực thuộc/quan hệ vốn. Bảng luôn có 12 tháng; chọn năm bằng `?year=2026`, mặc định năm hiện tại theo lịch Việt Nam. Tổng DWT và lượt vào dùng toàn hệ thống, không nhân với tỷ lệ sở hữu. Chỉ ngày không muộn hơn ngày hiện tại được tính. Tháng đang diễn ra có trạng thái đang tổng hợp; tháng tương lai để trống. Năm không có dữ liệu hiển thị thông báo, không tạo số 0. Tháng quá khứ thiếu ngày hoặc thiếu DWT được đánh dấu dữ liệu chưa đầy đủ. Thời gian cập nhật và ngày cuối có snapshot được đọc từ DB cho năm đã chọn. Lỗi DB hiển thị lỗi riêng, không được coi là chưa có dữ liệu.

Đối chiếu tổng tháng với view trong Neon bằng truy vấn chỉ đọc: `npm run php:verify-report`. Trạng thái tổng hợp phản ánh độ phủ kế hoạch, không xác nhận hoạt động tàu thực tế. Không có migration hay thay đổi dữ liệu ở bước làm trang chi tiết.

### Giới hạn lưu dữ liệu kế hoạch PHP

Bộ đọc nguồn và `savePhpDay` đều áp dụng whitelist đúng 5 cảng, theo chiều đi/đến. `0009_php_event_scope.sql` chặn lượt ngoài phạm vi ở cấp DB, bao gồm terminal NULL. `raw_html` là HTML chứa bản trích xuất dòng dữ liệu PHP, không phải toàn trang nguồn; thông tin đối tác nơi đi/đến của chính lượt PHP vẫn được giữ để xác định lượt tàu. Không lưu lượt chuyển cảng/qua luồng trong bộ dữ liệu này.

`npm run php:scope-history` chỉ đọc và báo số liệu dự kiến. Sau khi có chấp thuận dọn dữ liệu, `npm run php:scope-history -- --apply` sao lưu snapshot, dòng tàu, pointer, coverage và metrics vào `.backups/` (bỏ qua bởi Git), rồi thay thế lịch sử theo phạm vi PHP trong một transaction. Lịch sử được chụp theo batch để tránh giới hạn response Neon. Fingerprint kiểm tra dữ liệu không đổi trong lúc chuẩn bị; nếu dữ liệu thay đổi hoặc metrics/coverage không khớp, transaction hủy và cần chạy lại. Chạy dọn trước khi áp dụng migration 0009 trên DB còn dữ liệu ngoài phạm vi. Sau khi dọn, các snapshot mới tiếp tục bất biến và giữ revision theo dữ liệu PHP.
