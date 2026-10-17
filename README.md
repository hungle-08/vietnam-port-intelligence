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

Mỗi lần mở Home, trình duyệt gọi `GET /api/shipping-lines`; Next.js gọi trực tiếp Alphaliner TOP 100 (`getTop100Table`, `getTextCalculations`) và trả về 10 hãng theo sức chở đội tàu đang khai thác. Giữ nguyên chart, logo, TEU, số tàu và tỷ trọng toàn cầu. Ngày hiển thị là ngày thu thập theo giờ Việt Nam, không suy đoán ngày chốt của nguồn.

Cả request nguồn và response đều `no-store`, không đọc/ghi Neon hoặc snapshot cục bộ, không cron. Phần này tải độc lập với Home; khi nguồn lỗi sẽ có thông báo và nút thử lại. Giới hạn nguồn cố định, timeout 20 giây, tối đa 2 MB, từ chối redirect và kiểm tra đủ/thống nhất 10 hãng trước khi render.

Migration `0016_disable_shipping_cron.sql` tắt cấu hình cũ; endpoint cron, script lưu dữ liệu và cấu hình admin hãng tàu đã gỡ. Các bảng lịch sử cũ được giữ nguyên, không còn được sử dụng bởi tính năng này.

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

### PHP: kế hoạch tàu và DWT theo ngày

Đã lưu 5 điểm khai thác liên quan PHP: Tân Vũ, Hoàng Diệu, Chùa Vẽ (phạm vi trực tiếp); HTIT bến 3–4 Lạch Huyện và Đình Vũ/DVP (phạm vi hệ thống, quan hệ vốn 51%). Membership lưu nguồn, ngày chứng cứ và ngày hiệu lực; phân loại khởi đầu 2026 dựa trên hồ sơ cuối năm 2025, cần cập nhật khi quan hệ thay đổi. DVP dùng chung một thực thể Đình Vũ, không sao chép dữ liệu tàu. Không nhân DWT với tỷ lệ sở hữu.

Nguồn: [kế hoạch tàu Cảng vụ Hải Phòng](https://cangvuhaiphong.gov.vn/ke-hoach-tau/), đọc trang nhúng công khai `csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx`. URL chỉ đổi được giữa hai địa chỉ hỗ trợ; nguồn mới cần bộ đọc riêng. Truy vấn dùng ngày Việt Nam, kiểm tra ngày trong nội dung, đủ các mục/tiêu đề cột, timeout và giới hạn dung lượng.

**DWT tàu vào theo kế hoạch** là tổng trọng tải thiết kế tàu trên các lượt vào cảng trong kế hoạch. Đây không phải tấn hàng qua cảng hay xác nhận tàu đã thực sự cập cảng. Lưu toàn bộ kế hoạch tàu của Cảng vụ Hải Phòng, gồm vào, rời, chuyển cảng và qua luồng của mọi cảng. Báo cáo PHP chỉ tính lượt vào có nơi đến thuộc đúng 5 cảng thành viên theo bảng quan hệ sở hữu, không cộng lượt rời/chuyển/qua luồng hoặc cảng ngoài PHP vào tổng DWT PHP. Không có IMO/ID lượt tàu ổn định từ nguồn; khóa nội bộ dựa trên ngày, loại di chuyển, giờ, tên tàu và nơi đi/đến. Chưa ghép lượt vào/rời thành chuyến thực tế. DWT thiếu giữ `null`, đi kèm số lượt thiếu. Ngày chưa lấy được trả về `available=false`, không hiển thị như ngày có giá trị 0.

Snapshot ngày bất biến giữ HTML toàn bộ kế hoạch Hải Phòng và dữ liệu đã đọc của cả 4 loại di chuyển. Chỉ snapshot hợp lệ mới nhất được dùng để tổng hợp; chạy lại không cộng trùng. Dòng lặp cùng khóa và cùng DWT/GT/LOA chỉ tính một lượt; khác thông tin phụ được lưu trong `supplementalVariants`, giá trị phụ xung đột không được khẳng định. Xung đột trọng tải bị từ chối để giữ snapshot tốt trước đó. Mục qua luồng tồn tại nhưng trống được chấp nhận là không có lượt; mất mục hoặc đổi cấu trúc bị từ chối.

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

### Lưu toàn bộ kế hoạch tàu Hải Phòng

Migration `0015_haiphong_regional_storage.sql` gỡ ràng buộc PHP-only của migration 0009. Crawler hằng ngày (07:00 Việt Nam) và backfill dùng `parseHaiphongPlan` để lưu toàn bộ lượt vào/rời/chuyển cảng/qua luồng cùng HTML nguồn. Tên nơi đi/đến luôn giữ nguyên, kể cả cảng chưa có mã nội bộ (`fromTerminal`/`toTerminal` có thể null).

View `issuer_daily_planned_dwt` vẫn chỉ tính lượt vào qua quan hệ `issuer_terminal_memberships`. Các truy vấn detail PHP đều lọc `ticker='PHP'` nên chỉ 5 cảng PHP được tổng hợp. Snapshot scoped cũ được giữ làm lịch sử nhưng không cộng trùng vì báo cáo chỉ đọc snapshot active của mỗi ngày.

`npm run haiphong:restore` kiểm tra checksum bản sao lưu gốc, tạo bản sao trạng thái hiện tại vào `.backups/` và đối chiếu DWT/lượt vào PHP từng ngày/từng cảng. Thêm `-- --apply` để khôi phục 286 ngày 01/01–13/10/2026 bằng bản sao lưu gốc trên máy này, sau khi áp dụng migration 0015. Script kiểm tra pointer không bị thay đổi trong lúc chạy, lưu mỗi ngày trong transaction và không xóa revision đang có. Script dọn PHP-only cũ đã bị vô hiệu hóa vì không còn phù hợp phạm vi lưu trữ.

Đã khôi phục và bổ sung trên Neon đủ 289 ngày từ 01/01 đến 16/10/2026, gồm 24.575 bản ghi kế hoạch active. Số liệu PHP đến 15/10 không đổi. Khi cào lại ngày 16/10, nguồn có thêm 1 lượt vào Chùa Vẽ (8.721 DWT); tổng PHP hiện tại là 39.311.239 DWT / 1.719 lượt vào.

Dữ liệu ngày 14–16/10/2026 được cào lại toàn vùng. Những lần bổ sung sau dùng `npm run php:backfill -- --from YYYY-MM-DD --to YYYY-MM-DD --refresh` để thay snapshot active bằng bản nguồn hợp lệ mới nhất. Nếu nguồn thay đổi, số liệu mới có thể thay đổi theo kế hoạch cập nhật; lỗi nguồn giữ bản tốt trước đó.

### Xuất nhập khẩu hàng hóa

Home gọi REST API chính thức của [Dữ Liệu Kinh Tế](https://console.dulieukinhte.com/huong-dan) ở server, rồi render một biểu đồ gồm 3 đường: xuất khẩu, nhập khẩu và cán cân thương mại. Hai chuỗi tháng `22603`/`22606` được lấy chung qua `/v1/series/observations?ids=22603,22606&limit=500`. Đơn vị gốc triệu USD được chuẩn hóa thành USD, UI hiển thị tỷ USD. Cán cân = xuất khẩu − nhập khẩu, chỉ tính khi đủ cả hai chiều cùng tháng.

Đặt `DLKT_API_KEY` trong `.env.local` (đã bỏ qua Git) và Environment Variables trên Vercel cho các môi trường cần dùng, sau đó deploy lại. Khóa chỉ gửi bằng header Authorization tới domain API cố định, không đưa vào browser, query string, log hay biến `NEXT_PUBLIC_`.

Request dùng Next.js Data Cache (`force-cache`, revalidate 24 giờ), chia sẻ giữa VI/EN và mọi bộ lọc để giảm lượt gọi. Không gọi API riêng mỗi lần hover/chuyển kỳ. Lưu ý: cache có thể bị xóa hoặc bỏ qua trong dev khi hard reload, nên đây không phải cam kết số request tối đa. Khi API lỗi/hết hạn mức, trang vẫn hoạt động và hiển thị trạng thái chưa tải được dữ liệu cùng liên kết nguồn.

Chart dùng Apache ECharts, nạp riêng ở client với các module line, tooltip và dataZoom. Có chọn khoảng 1/2/3/5/10 năm hoặc toàn bộ lịch sử, chọn năm dương lịch cụ thể, zoom bằng wheel/trackpad/pinch, kéo dịch thời gian, thanh navigator, nút zoom/đặt lại, bật tắt từng đường và khung phóng lớn (Esc đóng). Không có tính năng tải ảnh. Bộ chọn Từ kỳ/Đến kỳ dành cho bàn phím xuất hiện khi focus để thao tác khoảng thời gian mà không cần chuột.

Mặc định tháng hiển thị 12 tháng tới tháng hiện tại; quý 8 quý; năm 5 năm gần nhất. Quý/năm chỉ cộng các tháng có đủ cả hai chiều và ghi rõ độ phủ. Khoảng thiếu không thay bằng 0 hoặc nối liền đường; không hiển thị kỳ tương lai. Mọi thao tác chart chỉ dùng dữ liệu đã tải, không gọi thêm API. Độ sâu lịch sử phụ thuộc gói API và khoảng chọn được giới hạn theo dữ liệu thực tế.

Không lưu dữ liệu thương mại trong Neon, không có cron/admin config riêng. Migration `0014_retire_vietnam_trade.sql` đã xóa ba bảng của pipeline cũ, sau khi sao lưu vào `.backups/retired-trade-2026-10-16T04-02-47-872Z.json`. Các migration cũ vẫn được giữ để bảo toàn lịch sử/checksum. Deploy mới cũng gỡ endpoint và lịch cron cũ trên Vercel.

### So sánh Lạch Huyện trong detail PHP

Tab HTIT trong trang chi tiết PHP có chart tỷ trọng, mặc định cột chồng 100% và tùy chọn đường, thể hiện tỷ trọng DWT/lượt vào của HICT (bến 1–2), HTIT (bến 3–4) và HHIT (bến 5–6). Mặc định hiển thị tối đa 12 tháng gần nhất tới tháng hiện tại; cuộn hoặc kéo navigator để xem toàn bộ lịch sử, dừng tại tháng đầu tiên có dữ liệu, độc lập với bộ chọn năm báo cáo PHP. Chỉ đọc snapshot toàn vùng và lượt `arrival`; không gộp khu neo `LACH HUYEN 1/2`, không điều chỉnh theo sở hữu và không cộng lượt rời/chuyển/qua luồng. Không thay đổi danh mục 5 cảng của báo cáo PHP.

Mẫu số luôn là tổng cả ba cảng, kể cả khi ẩn một đường. Tháng không có snapshot vùng giữ giá trị null, không nối đường qua khoảng thiếu. Tháng có snapshot nhưng không có lượt được ghi 0 lượt; tỷ trọng để trống nếu tổng bằng 0. Nếu có lượt thiếu DWT, tỷ trọng DWT để trống, vẫn xem được tỷ trọng lượt tàu. Tháng hiện tại và các tháng thiếu ngày ghi rõ độ phủ. Có chú thích tên/bến, chuyển chỉ số, cuộn chuột/trackpad để dịch khung thời gian, navigator, đặt lại 12 tháng gần nhất và bộ chọn tháng để xem số liệu bằng bàn phím. Không có migration hoặc cron mới; dùng dữ liệu kế hoạch Hải Phòng đã lưu.

Chart Lạch Huyện phân biệt tháng hiện tại bằng cột vạch chéo/điểm hình thoi, dấu * trên nhãn tháng và thông báo tỷ trọng tạm tính. Độ phủ là số ngày có dữ liệu / tổng số ngày lịch của tháng (ví dụ 16/31); cột 100% chỉ thể hiện cơ cấu ba cảng.

### Loading UI

Spinner và Skeleton dùng component shadcn trong `src/components/ui`, thống nhất qua `src/components/loading`. Home, PHP detail, tài khoản và admin có fallback theo bố cục trang và route `loading.tsx`; chart giữ chiều cao trong lúc tải bundle. Hãng tàu và tin tức dùng skeleton theo từng hàng/card, logo và ảnh có placeholder đến khi tải xong hoặc chuyển fallback khi lỗi. Nút đăng nhập/đăng ký, đổi năm, tải tin và lưu cấu hình hiển thị Spinner, trạng thái busy và khóa thao tác lặp khi đang xử lý. Loading được dịch VI/EN, placeholder ẩn với trình đọc màn hình và animation tắt theo `prefers-reduced-motion`.

Xuất nhập khẩu mặc định chọn 12 tháng lịch gần nhất kết thúc tại tháng đã công bố mới nhất (có ít nhất một chiều xuất/nhập), giữ khoảng thiếu dữ liệu ở giữa. Nút đặt lại và chuyển về chế độ Tháng cũng dùng khoảng này; nếu lịch sử chưa đủ 12 tháng thì giới hạn theo dữ liệu hiện có.

Trang PHP có 6 tab cấp đầu: Tổng quan PHP, Tân Vũ, Hoàng Diệu, Chùa Vẽ, HTIT và Đình Vũ. Tổng quan PHP mặc định gồm mô tả và địa điểm, rồi các mục Tổng quan/Tin tức; đã bỏ khối danh sách “Hệ thống cảng thuộc PHP”. Báo cáo DWT, lượt vào, đóng góp theo tháng và bảng tháng giữ tại Tổng quan. Mỗi tab cảng có hồ sơ, ảnh nguồn chính thức, thông tin chủ sở hữu/cổ đông theo hồ sơ 31/12/2025 và chart DWT riêng. Chart tỷ trọng Lạch Huyện nằm bên dưới chart DWT trong HTIT.

Chart DWT từng cảng dùng tổng lượt vào từ view `issuer_daily_planned_dwt` với `ticker=PHP`, nhóm theo tháng và terminal ID. Đọc toàn bộ lịch sử có dữ liệu, mặc định tối đa 12 tháng tới tháng hiện tại, cuộn/trackpad hoặc navigator để dịch khung; không lệ thuộc năm chọn của báo cáo PHP. Không nhân tỷ lệ sở hữu, giữ null khi không có snapshot, số 0 chỉ cho tháng có độ phủ nhưng không có lượt; tháng hiện tại/vùng dữ liệu thiếu dùng vạch chéo và độ phủ trên số ngày lịch. Ảnh có Skeleton/fallback, dẫn nguồn và ghi rõ ảnh tư liệu. Hồ sơ sở hữu phân biệt chi nhánh Tân Vũ, chủ sở hữu công ty Hoàng Diệu Chùa Vẽ, vốn liên doanh HTIT (lợi ích/vốn 51%, quyền biểu quyết 50% theo PHP 2025), và cổ đông lớn DVP theo trang 16 báo cáo DVP 2025. Không thêm cron hoặc migration.

Hồ sơ chi tiết 5 cảng có mô tả mở rộng, nhóm hạ tầng/năng lực. Khối Kết quả & Kế hoạch và Góc nhìn theo dõi đã bỏ khỏi UI theo yêu cầu. Dữ liệu có cấu trúc tại `src/lib/php/terminal-facts.ts`, đối chiếu 16/10/2026; nguồn, phạm vi và kỳ được gắn với từng chỉ số. Phân biệt thực hiện/ước/kế hoạch và năng lực giới thiệu/hồ sơ lịch sử. Hoàng Diệu–Chùa Vẽ có hạ tầng riêng nhưng năng lực chung không phân bổ sang từng địa điểm. HTIT giữ ghi chú nguồn công suất khác nhau, không tính hệ số sử dụng. DVP 2025 xác minh 513.942 TEU từ trang in 20 báo cáo thường niên. Chi tiết nghiên cứu trong `docs/research/2026-10-16-php-terminal-profiles.md`.

Rà soát giao diện 16/10/2026: token màu cảng dùng chung ở `src/lib/ports/colors.ts`, giá trị light/dark trong `globals.css`; HTIT giữ cùng màu ở hồ sơ PHP, chart riêng, đóng góp và so sánh Lạch Huyện. ECharts lấy màu CSS đã resolve để vẽ canvas và redraw khi đổi theme. Dùng chung `SiteBrand` cho Home/PHP/auth/admin; tăng chữ nhỏ lên 12px, card danh mục mobile gọn hơn nhưng giữ đủ danh sách, nhãn/điểm chạm bản đồ tăng theo breakpoint, phạm vi PHP mở rộng bằng details và thanh tab có gợi ý vuốt. Hồ sơ cảng gom các nguồn trùng nhau trong phần nguồn, mỗi chỉ số giữ liên kết trực tiếp. Không đổi logic số liệu hoặc cấu hình cron.

Brand highlight cập nhật 17/10/2026: xanh biển sâu thiên xanh dương. Hai theme dùng primary #1E5AA8, hover #276FC1, chữ nút #FFFFFF và focus #4B91E2. Link/highlight dark #74B3FF, light #245FA5; nền chọn nhẹ dark #74B3FF1A, light #EDF4FF. Nút, tab, hover, focus, logo và marker bản đồ đọc token chung. Giữ nguyên nền/gradient trang, card và màu dữ liệu biểu đồ.
