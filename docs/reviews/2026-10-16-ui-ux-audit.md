# Rà soát màu sắc và bố cục — 16/10/2026

Phạm vi: trình duyệt local port 3001, Home, PHP Tổng quan, tab cảng, Tin tức, đăng nhập/đăng ký; desktop 1440px và mobile 390px. Kiểm tra thêm chiều ngang Home ở 360/768/1280px. Hai theme dark/light. Admin chỉ đọc code, chưa kiểm tra trực quan phiên đăng nhập quản trị. Không sửa giao diện trong lượt đánh giá này.

## Nhận định

Nền xanh đại dương, cyan, khoảng trắng giữa nhóm và bố cục chart tạo nền tảng tốt. Chữ chính đọc rõ, form đăng nhập gọn, PHP có trạng thái dữ liệu và phân tab. Các viewport đã kiểm tra không có tràn ngang toàn trang. Website chưa hoàn toàn thống nhất về màu dữ liệu, chữ phụ và mật độ nội dung trên mobile.

## Ưu tiên cao

### 1. Chữ màu theo cảng thiếu tương phản trong light mode

Đo computed CSS trên phần mô tả vai trò của cảng, nền trắng:
- HTIT: #e5ae52, 11px, tương phản khoảng 2,00:1.
- Đình Vũ: #de7985, 11px, tương phản khoảng 2,92:1.

Cần dùng biến màu chữ và màu biểu đồ riêng theo theme. Giữ màu nhận diện, dùng sắc tối hơn cho chữ light mode. Không tự coi toàn bộ palette chart bị lỗi chỉ dựa vào phép đo chữ.

Chuẩn tham chiếu: WCAG 1.4.3 đặt ngưỡng 4,5:1 cho chữ thông thường, 3:1 cho chữ lớn: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

Liên quan: src/lib/php/presentation.ts; src/components/ports/terminal-detail.css.

### 2. Cùng HTIT nhưng khác màu giữa hai chart

Chart riêng và hồ sơ PHP dùng HTIT vàng #e5ae52. Chart Lạch Huyện dùng HTIT xanh #2bc8b3, HHIT vàng #eda85b. Hai chart xuất hiện trong cùng tab HTIT nên người xem dễ hiểu nhầm chú giải.

Đề xuất một định danh màu dùng chung theo cảng trên mọi chart; có sắc light/dark tương ứng. Trạng thái đang tổng hợp dùng pattern/nhãn, không đổi màu định danh.

Liên quan: src/lib/php/presentation.ts; src/lib/php/lach-huyen.ts.

### 3. Chữ phụ và nguồn quá nhỏ

Chú thích và nguồn nhiều nơi 9–11px; metadata hồ sơ có đoạn 9px. Tương phản chữ nguồn mẫu đạt khoảng 5,5:1 nhưng kích thước vẫn khó đọc. Không đồng nhất vấn đề kích thước với lỗi tương phản.

Đề xuất mô tả chính 14–16px, label/control 12–14px, nguồn/chú thích ưu tiên 12px. Nhãn chart cần điều chỉnh số lượng mốc để tăng cỡ chữ thay vì ép toàn bộ nhãn.

## Ưu tiên bố cục

### 4. Danh mục Home quá dài trên mobile

Ở 360px: một card khoảng 241px, toàn khu danh mục khoảng 4272px. 15 card phần lớn lặp icon, badge đang triển khai và dòng footer; dữ liệu thương mại/hãng tàu nằm rất sâu.

Giữ yêu cầu hiển thị đủ và không phân trang. Mobile chuyển sang card hàng ngang gọn, giảm thông tin lặp, vẫn giữ mã/tên/vị trí/trạng thái và làm nổi PHP. Desktop giữ grid, giảm khoảng trống trong card.

### 5. Bản đồ mobile có nhãn quá nhỏ

Ở màn hình 390px, chữ SVG hiển thị thực tế có bounding box cao khoảng 4–6px dù font khai báo 8–12px, do SVG bị scale. Không đề xuất thu nhỏ thêm bản đồ. Giữ cờ, tàu và animation, tăng kích thước nhãn/điểm chạm theo breakpoint và giữ thông tin trong tooltip/tap. Tách bố cục nhãn khỏi tỷ lệ scale SVG khi cần.

### 6. PHP dành nhiều diện tích trước khi tới số liệu

Header công ty, thanh 6 tab, khối giới thiệu và thanh tab Tổng quan/Tin tức đẩy KPI xuống sâu. Mobile còn khó nhận ra thanh 6 tab có thể cuộn ngang.

Đề xuất thu gọn mô tả thành 2–3 dòng ban đầu, giữ chi tiết trong phần mở rộng; giảm padding lặp và thêm dấu hiệu cuộn/fade/nút cho thanh tab. Giữ đủ 6 tab và nội dung hiện có.

### 7. Hệ thống header và control chưa thống nhất

Home/PHP dùng Vietnam Port + mô tả, auth dùng VIETNAM PORT / INTELLIGENCE. Nút theme dạng icon ở Home/PHP nhưng có chữ ở auth. Bộ lọc năm/tháng, segment và nút hành động có nhiều kích thước riêng.

Đề xuất dùng chung thành phần brand, scale control, radius và focus style; biến thể điều hướng theo ngữ cảnh vẫn được giữ. Không gom tất cả control vào một kiểu khi chức năng khác nhau.

## Hướng chỉnh đề xuất

1. Đồng bộ token màu nhận diện, màu chữ và màu dữ liệu cho hai theme.
2. Nâng chữ nhỏ và chuẩn hóa khoảng cách, header/control.
3. Tối ưu danh mục, bản đồ và tab trên mobile.
4. Giảm nội dung giới thiệu lặp trước KPI, nhóm nguồn dùng chung để hồ sơ bớt rối nhưng vẫn truy được nguồn của từng chỉ số.

Giữ nền #081421 và gradient nhẹ, chia hero 4/6, bản đồ cờ Việt Nam/Hoàng Sa/Trường Sa và các chart hiện có. Chỉ đề xuất thay đổi mức trình bày, không đổi cách tính hay phạm vi dữ liệu.

## Bằng chứng cục bộ

Ảnh và JSON đo trong /tmp/vpi-design-audit/ (tạm thời, không commit): home-dark.png, home-light.png, php-dark.png, php-mobile-light.png, terminal-facts-light-section.png, htit-light-chart.png, news-desktop.png, login-desktop-dark.png, login-mobile-light.png, report.json, contrast.json.

## Cập nhật sau khi duyệt

Đã triển khai các nhóm chỉnh sửa nêu trên: token màu thống nhất hai theme, brand dùng chung, chữ nhỏ 12px, card mobile gọn, nhãn bản đồ tăng theo breakpoint, phạm vi PHP thu gọn, dấu hiệu vuốt tab và nguồn hồ sơ được gom. Bộ kiểm tra màu xác nhận các màu chữ cảng trên card đạt ít nhất 4,5:1 trong cả hai theme. Kiểm tra trình duyệt Việt/Anh ở 360–1440px, đổi theme, tab cảng và mở thông tin bản đồ. Admin được cập nhật qua thành phần brand/CSS dùng chung; chưa kiểm tra phiên admin trực tiếp.
