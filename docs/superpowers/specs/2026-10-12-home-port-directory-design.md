# Home và danh mục cảng Việt Nam

Cập nhật theo chỉ dẫn người dùng ngày 13/10/2026. Các điều chỉnh phạm vi và vị trí tương đối thay thế bản thiết kế bến trước đó.

## Mục tiêu

Nơi theo dõi thông tin, sản lượng và thị phần cảng Việt Nam theo ngày, tháng, năm. Nội dung giao diện diễn đạt trực tiếp mục đích theo dõi cảng, không dùng lời giới thiệu về đầu tư. Home Next.js + shadcn, dữ liệu Neon được đọc ở server, không cần backend riêng. Tiếng Việt mặc định `/vi`, tiếng Anh `/en`, branding xanh đại dương #082F49, cyan #38BDF8, nền #F6F9FC.

## Danh mục hiện tại

15 mã theo ảnh người dùng: GMD, PHP, VGR, DVP, PDN, CDN, CQN, DXP, PSP, PAP, SGP, QNP, QSP, NAP, MVN. Đây là tập khởi đầu, chưa phải tất cả cảng Việt Nam. Đơn vị theo dõi là cảng/doanh nghiệp khai thác, chưa đi sâu vào bến. Mã cổ phiếu là mã hiển thị chính.

`data/port-investments.json` được nhập idempotent vào `port_entities`. Payload gồm tên, mã, khu vực, vị trí tương đối, tham khảo nguồn và quy tắc hiển thị. GMD và MVN thuộc nhiều vùng. MVN là holding: giữ trong danh mục, luôn loại khỏi bản đồ kể cả khi có tọa độ (`mapVisible=false`). Thông tin MVN được mở trong khu vực danh mục.

Dữ liệu bến trong PDF 505 và dataset trích xuất cũ chỉ là tài liệu nghiên cứu, không phải danh mục hiện tại. Trạng thái hoạt động vẫn là chưa xác minh, không suy ra đang hoạt động từ việc xuất hiện trong ảnh.

## Bản đồ

Điều chỉnh mới nhất: bản đồ cố định, bỏ toàn bộ zoom (wheel/pinch, double-click, bàn phím) và kéo di chuyển. Luôn nhận đầy đủ danh mục thay vì kết quả lọc; tìm kiếm, vùng và phân trang chỉ áp dụng danh sách. Các điểm gần nhau vẫn nhóm và hiển thị số lượng cảng để không che nhau; chọn nhóm để xem đầy đủ các thành viên. MVN vẫn bị loại khỏi bản đồ.

Điều chỉnh UX mới nhất: giữ SVG, bỏ nền khung/border/caption/chú thích/nút điều khiển của bản đồ. Mặc định chỉ hiện hình địa lý cùng điểm cảng và nhãn đảo. Bên trong hình bản đồ dùng nền đỏ và sao vàng năm cánh theo cờ Việt Nam, thay gradient xanh và lưới caro. Sao được cắt theo đường địa lý, đặt trong phần phía Bắc đủ rộng để giữ hình sao nguyên vẹn. Hiệu ứng gồm xuất hiện mượt, ánh sáng quét nhẹ trên cờ, vòng tín hiệu lan tại cảng, nét sáng chuyển động dọc đường bờ và sao vàng sáng nhẹ. Motion useInView dừng hiệu ứng khi ra khỏi viewport; reduced-motion tắt quét/animation. Chiều cao desktop tăng lên clamp(960px,157.5svh,1650px); mobile giữ tỷ lệ SVG. Popup chỉ hiện khi tương tác. Bản đồ dùng phép chiếu cố định, không đăng ký sự kiện zoom hoặc kéo.

Theo yêu cầu bổ sung, dùng vị trí tương đối theo khu vực cảng, không chờ tọa độ bến chính xác. Tất cả vị trí hiện có `accuracy=approximate`, `method=area-estimate`; nguồn URL là tham khảo khu vực, không tuyên bố nguồn cung cấp đúng tọa độ ước lượng. GMD có ba khu vực đại diện: Nam Đình Vũ, Dung Quất, Gemalink/Cái Mép. Các doanh nghiệp khác có một điểm khu vực; đây không phải danh sách đầy đủ mọi cơ sở của mỗi doanh nghiệp.

React Simple Maps + Motion dựng SVG địa lý thực từ Natural Earth, kèm lớp điểm đảo tham khảo có nguồn Đà Nẵng và Khánh Hòa. Hoàng Sa, Trường Sa được gắn nhãn và các điểm đảo có tên, phân biệt ký hiệu đảo với cảng. Không tạo đường bờ hoặc ranh giới biển giả. Khung SVG 920×1020, tỷ lệ chiếu tăng 1,5 lần (1850→2775), tâm chiếu [105.8, 16.1] đặt phần đất liền chính giữa; dành khoảng trống phía đông cho điểm đảo và nhãn.

16 điểm cho 14 mã trên bản đồ. Các điểm gần nhau gom cụm theo khoảng cách trên màn hình, có số mã và danh sách lựa chọn. Hover/focus hiển thị thông tin, click/tap giữ lựa chọn; Enter mở nhóm và chuyển focus vào danh sách, Escape đóng. Reduced-motion được hỗ trợ. Bản đồ luôn giữ toàn bộ điểm, kể cả khi tìm kiếm hoặc lọc vùng trong danh mục.

## Giao diện

Hero xếp dọc: tiêu đề “Theo dõi cảng Việt Nam” / “Track Vietnam’s ports” và hai đoạn giới thiệu căn giữa phía trên: mục đích tổng hợp dữ liệu cảng toàn quốc, khả năng tra cứu hiện có và kế hoạch bổ sung sản lượng/thị phần/lịch sử từ nguồn chính thống, bản đồ chiếm toàn chiều rộng phía dưới. Bỏ nút khám phá, các số thống kê và câu khẩu hiệu trong hero để giữ giới thiệu đơn giản. Bản đồ giữ tỷ lệ hình địa lý, giới hạn chiều cao trên desktop và co theo chiều rộng trên mobile. Popup căn giữa trong vùng bản đồ. Không đưa số liệu sản lượng giả. Phía dưới có tìm kiếm theo tên/mã/khu vực, lọc vùng, bảng danh mục và phân trang. Chọn trong bảng liên kết với thông tin trên bản đồ, ngoại trừ MVN mở riêng trong danh mục.

Khi lỗi Neon, hiện thông báo và nút thử lại; không chuyển sang dataset giả. UI ghi rõ vị trí tương đối và trạng thái xác minh. Mật khẩu/database URL không gửi xuống client. Chuyển ngôn ngữ giữ tìm kiếm, vùng và lựa chọn.

## Kiểm chứng và giới hạn

Kiểm tra dataset, quy tắc MVN, các điểm GMD theo vùng, gom nhóm, phép chiếu chứa các điểm cảng/đảo/nhãn. Kiểm tra seed trên Neon dev rồi production và đối soát payload. Chạy lint, typecheck, tests, production build. Kiểm tra trực quan trong trình duyệt chưa thực hiện được vì chính sách công cụ chặn localhost; visual verification remains unavailable.

Chưa triển khai crawler, lịch chạy buổi sáng, dữ liệu lịch sử/sản lượng/thị phần, đăng nhập hoặc CRUD. Nguồn sản lượng sẽ do người dùng cung cấp; kỳ dữ liệu khác ngày thu thập.

Nguồn và độ chính xác được mô tả tại `data/README.md`, `public/maps/README.md` và `src/lib/ports/archipelagos.ts`.

Tham khảo animation: https://motion.dev/docs/react-transitions và https://motion.dev/docs/react-animation; dùng Motion hiện có cùng SVG/CSS, không thêm thư viện.
