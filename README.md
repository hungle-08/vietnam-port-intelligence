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

Đối chiếu tọa độ chính xác và trạng thái hoạt động, sau đó bổ sung nguồn sản lượng, đơn vị TEU/tấn, tổng hợp theo kỳ và tính thị phần. Hiện chưa có đăng nhập, CRUD, báo cáo thực, crawler hay lịch cập nhật mỗi sáng. Danh mục 15 mã là tập khởi đầu, chưa phải mọi cảng Việt Nam.

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

`shipping:collect` không có `--input` sẽ thử tải nguồn công khai trực tiếp với timeout. Import chỉ thành công khi có ngày chốt cùng bảng tỷ trọng và bảng đội tàu đầy đủ, nhất quán. Nguồn hiện tại được trích từ kết quả web index do HTTP trực tiếp lỗi DNS; xem provenance trong `data/shipping-lines.json` và `data/sources/alphaliner-2026-10-12.txt`. Chưa cài lịch cào tự động.

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

`/admin` is an authenticated, admin-only placeholder workspace. Home shows its link only for users whose server-stored role is `admin`. Anonymous visitors are sent to login; regular users are returned to Home. Source settings, synchronization schedules, port management and site settings are placeholders with no configuration mutations yet.

Migration `0005_account_roles.sql` gives existing and new public accounts the default role `user`. Public registration never accepts a role. Administrators can be provisioned with `npx tsx scripts/seed-admin.ts`, supplying a JSON object containing `name`, `email` and `password` through stdin. The script hashes the supplied password, upserts that explicit account as admin and revokes its previous sessions atomically. Credentials are not saved in source code or logs. This trusted provisioning path accepts a deliberately supplied short password; the public registration password policy remains unchanged.
