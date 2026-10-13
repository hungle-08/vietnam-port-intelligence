> CẬP NHẬT PHẠM VI 13/10/2026 — thay thế các yêu cầu về bến bên dưới: người dùng yêu cầu danh mục ở cấp cảng/doanh nghiệp cảng theo ảnh gồm GMD, PHP, VGR, DVP, PDN, CDN, CQN, DXP, PSP, PAP, SGP, QNP, QSP, NAP, MVN. Mã cổ phiếu là mã hiển thị. Chưa triển khai cấp bến. GMD và MVN là hệ thống nhiều cảng; không gán vị trí trụ sở thành vị trí cảng. Danh sách 15 mã là tập khởi đầu do người dùng cung cấp, chưa phải toàn bộ cảng Việt Nam. Sàn giao dịch, hoạt động và tọa độ cần đối chiếu độc lập; không sao chép nhãn “Đang mở” thành sự thật. Dữ liệu đầu vào lưu ở `data/port-investments.json`; bảng `port_entities` tách biệt với dữ liệu bến cũ.

# Home và danh mục cảng Việt Nam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development only if the user chooses that approach. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lưu danh mục cảng/bến có nguồn trong Neon và thay home bằng giao diện Việt/Anh với bản đồ Việt Nam tương tác.

**Architecture:** Next.js đọc danh mục từ Neon trên server, truyền dữ liệu công khai vào client component dùng chung cho bản đồ và danh sách. React Simple Maps dựng SVG, Motion xử lý animation; migrations và seed được quản lý bằng file trong repo.

**Tech Stack:** Next.js 16.4, React 19.3, TypeScript, shadcn/Base UI, Neon serverless HTTP, React Simple Maps 5, Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-12-home-port-directory-design.md`

## Global Constraints

- Mỗi đối tượng là một cảng/bến khai thác; mã cổ phiếu chỉ là thông tin bổ sung nếu có.
- Phạm vi là cảng biển và bến thuộc cảng biển, kể cả bến chuyên dụng; chưa mở rộng sang ICD, cảng cá và toàn bộ bến thủy nội địa.
- Navy #082F49, xanh biển #0C4A6E, cyan #38BDF8, nền #F6F9FC, chữ #0B2239.
- `/` chuyển tới `/vi`; hỗ trợ `/vi` và `/en`, metadata và html lang theo locale.
- Không bịa mã, tọa độ, số liệu hoặc trạng thái đang hoạt động. UN/LOCODE không mặc nhiên là mã riêng từng bến.
- Không đưa credentials ra client, không tạo backend riêng hoặc crawler trong đợt này.
- Đối chiếu toàn bộ danh mục, lưu nguồn và ngày kiểm tra; thử schema/seed trên nhánh Neon phát triển trước production.
- Tọa độ thiếu không được thay bằng tâm tỉnh. Marker chính xác không bị dịch để tránh chồng lấp.

## Review Focus

1. Một bến trải qua hai trang PDF: ghép đúng tên và cảng biển, không tạo hai bến.
2. Hai bến dùng cùng mã địa điểm: vẫn là hai thực thể; không bị ghi đè khi seed.
3. Nhiều tọa độ gần/trùng nhau: tất cả chọn được qua cụm hoặc danh sách.
4. Neon lỗi hoặc thiếu tọa độ: lỗi dữ liệu phân biệt với danh mục trống; vẫn có fallback danh sách.
5. Mobile, bàn phím, reduced-motion và đổi ngôn ngữ: tooltip sử dụng được và giữ bến đang chọn.

---

### Task 1: Dataset có nguồn và đối soát danh mục

**Files:** `scripts/collect-port-directory.py`, `data/sources/manifest.json`, `data/port-directory.json`, `data/port-enrichment.json`, `docs/data/port-directory-audit.md`, `tests/port-data.test.ts`.

**Interfaces:** Dataset `{ sourceId, appendix, ordinal, seaportName, nameVi, nameEn, internalCode, officialCodes, region, sourceLocation, address, latitude, longitude, coordinateAccuracy, operationalStatus, sources }[]`. `internalCode` là khóa ổn định theo phụ lục/ordinal của nguồn; mã khác có `type`, `scope`, `value`, `sourceUrl`. Không dùng tên làm unique key.

- [ ] Viết kiểm tra fixture một bến có tên/nhóm cảng nối qua trang; kết quả là một đối tượng giữ đúng tên và nhóm cảng. Kiểm tra mã UN/LOCODE trùng không làm mất bến; tọa độ thiếu vẫn là null.
- [ ] Chạy `npm test -- tests/port-data.test.ts`, xác nhận thiếu collector/validator khiến test thất bại đúng nguyên nhân.
- [ ] Đọc tất cả 27 trang PDF đã tải tại `data/sources/505-2026.pdf`, tách bến khỏi cầu cảng, ghép ô nối qua trang. Giữ riêng phụ lục I và II; các số thứ tự cuối đã quan sát là 309 và 14, cần xác minh không thiếu/trùng cả chuỗi trước khi dùng làm count chuẩn.
- [ ] Tìm văn bản cập nhật sau 17/04/2026 đến thời điểm nhập. Đối chiếu website cơ quan/cảng cho mã, tọa độ và khai thác; lưu enrichment riêng, thiếu bằng chứng để trạng thái chưa xác minh.
- [ ] Chạy test, đối soát tên/cảng biển trên từng trang và số lượng mỗi phụ lục; ghi số bản ghi xác minh hoạt động/mã/tọa độ cùng các khoảng thiếu, không gọi bản ghi chưa xác minh là cảng đang hoạt động.

### Task 2: Schema, nhập và đọc Neon

**Files:** `db/migrations/0001_port_directory.sql`, `scripts/migrate-db.ts`, `scripts/seed-ports.ts`, `scripts/verify-ports.ts`, `src/lib/ports/types.ts`, `src/lib/ports/repository.ts`, `tests/port-import.test.ts`, `package.json`.

**Interfaces:** `PortRecord` là dữ liệu công khai của bến với các trường Task 1; `getPortDirectory(): Promise<PortRecord[]>`. Migration tạo `seaports`, `terminals`, `terminal_codes` và bảng ledger migration. Seed consumes Task 1, upsert theo internalCode; không xóa bản ghi ngoài nguồn nhập.

- [ ] Viết test khóa nhập: hai bến cùng UN/LOCODE vẫn có hai internalCode; chạy nhập lại giữ nguyên count; lat/lon thiếu phải cùng null, tọa độ ngoài giới hạn bị từ chối.
- [ ] Chạy `npm test -- tests/port-import.test.ts`, xác nhận test đỏ trước triển khai.
- [ ] Triển khai SQL migration có constraints FK, code uniqueness theo terminal/type/scope/value, vùng và operationalStatus có CHECK. `DATABASE_URL_UNPOOLED` cho migration; tagged SQL và transaction cho batch seed. Không in credentials.
- [ ] Tạo nhánh Neon `dev-home-port-directory`, tải env vào file gitignored riêng để không đổi kết nối production mặc định; chạy migration, seed, verify và seed lại trên nhánh này.
- [ ] Kiểm tra đầy đủ tên/mã/nhóm cảng so với dataset và count ổn định; áp dụng cùng migration/seed bổ sung lên production, chạy verify. Query repository chọn rõ trường công khai và chuyển numeric thành number đúng type, không trả connection details.

### Task 3: Routing và bản dịch Việt/Anh

**Files:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/lib/i18n.ts`, `tests/i18n.test.ts`.

**Interfaces:** `Locale = 'vi' | 'en'`; `isLocale(value: string): value is Locale`, `getMessages(locale: Locale)` trả dictionary cùng keys; locale và messages truyền xuống client Home.

- [ ] Viết test dictionary cùng keys, fallback tên tiếng Việt khi tên Anh chưa xác minh, locale ngoài vi/en bị từ chối; kiểm tra search tiếng Việt bỏ dấu.
- [ ] Chạy test xác nhận thất bại, sau đó triển khai dictionary, validation và tìm kiếm chuẩn hóa ở `src/lib/ports/filter.ts`.
- [ ] Route `/` redirect `/vi`, route locale không hợp lệ trả 404; root html/body nằm trong layout locale để html lang và metadata đúng. Đọc hướng dẫn Next.js bundled về route/layout và cacheComponents trước khi sửa; query database đặt trong Suspense boundary, không đóng băng dữ liệu theo lần build.
- [ ] H1 VI “Hiểu từng cảng. Nắm bắt thị trường.”, H1 EN “Know every port. Understand the market.”; copy hero và CTA theo spec. Mọi label, lỗi, tooltip, nguồn dữ liệu, control, aria label đều có bản dịch.
- [ ] Test pass; kiểm tra `/`, `/vi`, `/en`, `/xx`, metadata và html lang.

### Task 4: Home, bản đồ và danh mục đồng bộ

**Files:** `src/components/home/port-home.tsx`, `src/components/home/port-map.tsx`, `src/components/home/port-directory.tsx`, `src/components/home/port-details.tsx`, `src/lib/ports/map-clusters.ts`, `public/maps/vietnam.geojson`, `public/maps/README.md`, `src/app/globals.css`, `tests/map-clusters.test.ts`, `tests/port-filter.test.ts`.

**Interfaces:** `PortHome({ locale, ports, loadError })` owns query, region, selectedId. `PortMap({ ports, selectedId, onSelect, locale })`; `PortDirectory` consumes same filtered records. `clusterProjectedPorts(points, radius)` trả cụm với member IDs, không thay tọa độ stored; `filterPorts(ports, query, region)` tìm tên/mã/địa danh.

- [ ] Test cluster cho tọa độ trùng/gần nhau và radius thay đổi khi zoom: union member IDs luôn bằng tất cả valid input, không lặp/mất điểm; thiếu tọa độ bỏ khỏi map nhưng còn trong directory. Test filter tên bỏ dấu và codes trùng.
- [ ] Chạy test đỏ rồi triển khai các utility thuần, chạy test xanh.
- [ ] Kiểm tra peer dependencies (React Simple Maps 5.0.5 hiện hỗ trợ React 19), cài react-simple-maps/Motion và typings nếu cần. Chọn GeoJSON thật có nguồn/giấy phép ghi tại maps README; không dùng outline tự vẽ.
- [ ] Hero desktop 45/55, mobile xếp dọc; header VI/EN, nút CTA cuộn tới danh mục. Navy/cyan theo spec, giữ shadcn cho controls; bảng tìm kiếm/lọc vùng, số count thực từ Neon, badges thể hiện loại mã và độ xác minh.
- [ ] SVG marker theo `[longitude, latitude]`; zoom/pan và reset, cụm có số lượng và danh sách chọn từng bến. Hover/focus hiện details, click/tap pin, Escape đóng. Chọn danh mục đồng bộ với bản đồ; switch locale giữ query/region/selectedId qua query params.
- [ ] Animation fade/hover nhẹ bằng Motion; reduced-motion tắt chuyển động. Không pulse tất cả marker. Tooltip/details bị giới hạn trong container, vùng chạm đủ lớn. Map lỗi fallback sang danh sách; Neon lỗi có banner rõ khác empty state.

### Task 5: Kiểm chứng và bàn giao

**Files:** `README.md`, `docs/data/port-directory-audit.md`, `docs/superpowers/specs/2026-10-12-home-port-directory-design.md`, `docs/superpowers/plans/2026-10-12-home-port-directory.md`.

- [ ] Chạy `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:check` và `npm run db:verify`. Tất cả trả exit code 0; verify đối chiếu dataset/db, không chỉ SELECT 1.
- [ ] Dùng browser kiểm tra desktop/mobile, redirect/locale, tooltip hover/tap/focus, Escape, cluster zoom/reset, tìm kiếm/lọc, đổi ngôn ngữ giữ lựa chọn, reduced-motion, trạng thái lỗi/empty.
- [ ] Kiểm tra bundle client không chứa credentials; Git ignore các env/Neon context vẫn đúng. Kiểm tra diff, migration idempotency, không dùng dữ liệu mẫu âm thầm.
- [ ] Lưu ảnh giao diện cuối để người dùng xem. Cập nhật README lệnh migration/seed/verify, nguồn map, giới hạn dataset và crawler chưa triển khai. Báo số danh mục đã nhập, số có vị trí/mã/xác minh hoạt động và phần còn thiếu bằng chứng.

## Self-review

Năm review focus đều có kiểm tra ở Task 1–5. Schema, đọc server, locale, nguồn dữ liệu/địa lý, cluster/accessibility và các trạng thái lỗi đều có task sở hữu. Không có thay đổi sản lượng/crawler ngoài phạm vi. Kế hoạch chưa được triển khai; cần người dùng duyệt và chọn native hoặc subagent-driven theo skill writing-plans.
