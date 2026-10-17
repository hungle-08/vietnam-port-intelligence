# Khung giá dịch vụ cảng PHP

Ngày: 2026-10-17
Trạng thái: Chờ người dùng duyệt đặc tả

## Mục tiêu

Thêm một mục “Khung giá dịch vụ” vào trang chi tiết PHP để theo dõi biểu giá dịch vụ cảng được công bố chính thức, xem đơn vị áp dụng, thời điểm hiệu lực, nguồn gốc và các lần thay đổi. Dữ liệu đã duyệt được lưu ở Neon để trang PHP đọc ổn định; không gọi trang bên ngoài mỗi lần người dùng mở.

Tính năng phân biệt rõ hai khái niệm:

- **Khung pháp lý**: văn bản quy định cơ chế hoặc phạm vi quản lý giá dịch vụ cảng biển.
- **Biểu giá niêm yết của doanh nghiệp**: giá cụ thể do đơn vị khai thác công bố.

Không dùng giá niêm yết để suy ra doanh thu, giá giao dịch thực tế, lợi nhuận, hoặc chi phí của một chuyến tàu.

## Phạm vi và nguồn đã xác minh

Trang “Niêm yết giá” của Cảng vụ Hàng hải Hải Phòng liệt kê riêng doanh nghiệp, bến cảng, loại dịch vụ và liên kết biểu giá. Phạm vi PHP dùng năm địa điểm đang theo dõi, nhưng giữ nguyên đơn vị công bố giá thay vì gộp tất cả thành một bảng giá PHP:

| Địa điểm trong PHP | Đơn vị/nguồn niêm yết |
|---|---|
| Tân Vũ, Hoàng Diệu, Chùa Vẽ | Công ty Cổ phần Cảng Hải Phòng; nguồn biểu giá trên [trang bảng giá Cảng Hải Phòng](https://haiphongport.com.vn/vi/bang-gia-dich-vu) |
| HTIT | Công ty TNHH Cảng Container Quốc tế Hải Phòng (HICT); nguồn riêng tại [trang bảng giá HICT](https://hict.net.vn/ho-tro-khach-hang/pages/bang-gia-dich-vu.aspx) |
| Đình Vũ | Công ty Cổ phần Đầu tư và Phát triển Cảng Đình Vũ; nguồn riêng tại [trang bảng giá Đình Vũ](https://dinhvuport.com.vn/vn/serviceprice.html) |

Danh sách ánh xạ và liên kết gốc được lấy từ [Danh mục niêm yết giá của Cảng vụ Hải Phòng](https://cangvuhaiphong.gov.vn/niem-yet-gia/). Nguồn này có cả đơn vị hoa tiêu, lai dắt và hãng tàu; v1 chỉ lưu các mục liên quan đến năm địa điểm PHP, không nhập toàn bộ danh bạ Hải Phòng.

Trang Cảng Hải Phòng hiện công bố biểu giá năm 2026 và các thông báo bổ sung/sửa đổi. Trang HICT hiện liệt kê biểu giá nội/ngoại năm 2026 cùng bổ sung tháng 4/2026. Trang Cảng Đình Vũ hiện liệt kê biểu giá nội, ngoại, RoRo năm 2026 và giá bổ sung. Lần nạp ban đầu chuẩn hóa biểu giá gốc năm 2026 và toàn bộ bổ sung năm 2026 tìm thấy ở ba nhà khai thác; lịch sử các kỳ cũ hơn chưa được chuẩn hóa trong v1. Đồng bộ phải lưu từng tài liệu/sửa đổi riêng, không ghi đè một biểu giá cũ bằng bản mới.

Khung pháp lý v1 dẫn tới [Thông tư 12/2024/TT-BGTVT](https://vanban.chinhphu.vn/?classid=1&docid=210330&pageid=27160), hiệu lực từ 01-07-2024, và [Thông tư 31/2024/TT-BGTVT](https://vanban.chinhphu.vn/?classid=1&docid=211672&pageid=27160&typegroupid=6), sửa đổi có hiệu lực từ 15-01-2025. Metadata và liên kết của hai văn bản này được nạp ban đầu từ nguồn Chính phủ. Bài cũ trên website Cảng vụ dẫn Thông tư 39/2023 không được coi là văn bản hiện hành; UI đánh dấu văn bản cũ là hết hiệu lực nếu hiển thị tham chiếu.

## Trải nghiệm người dùng

Thêm tab thứ ba “Khung giá” bên trong phần Tổng quan PHP, cạnh “Tổng quan” và “Tin tức”. Không thêm tab cấp cảng thứ sáu và không thay đổi năm tab địa điểm đang có.

Mục này gồm:

1. Một dải thông tin ngắn cho biết ngày đồng bộ gần nhất, số biểu giá đang hiệu lực và liên kết tới nguồn chính thức.
2. Bộ lọc địa điểm (Tân Vũ, Hoàng Diệu, Chùa Vẽ, HTIT, Đình Vũ), năm/phiên bản và loại biểu giá khi nguồn có phân loại (nội địa, quốc tế, RoRo).
3. Bảng giá gồm tên dịch vụ, điều kiện/ghi chú áp dụng, đơn vị tính, nội dung giá được công bố, VAT nếu nguồn tách riêng, ngày hiệu lực và tài liệu nguồn.
4. Lựa chọn xem tài liệu cũ đã được duyệt để theo dõi thay đổi. Bản bổ sung chỉ áp dụng từ ngày ghi trên tài liệu; không thay thế ngược các kỳ trước.
5. Khung pháp lý riêng biệt với liên kết văn bản và ngày hiệu lực; không trộn các mức pháp lý với giá doanh nghiệp.

Giữ nguyên đơn vị tiền tệ, đơn vị tính, điều kiện, cách viết giá và chú thích nguồn. Chỉ điền giá trị số đã parse chắc chắn; giá dạng khoảng, theo tỷ lệ, phụ thuộc điều kiện, hoặc không tách được cột vẫn lưu chuỗi gốc và hiển thị theo nguồn. Không quy đổi/ước tính giá còn thiếu. Nếu một địa điểm chưa có tài liệu giá hiện hành được xác minh, hiển thị trạng thái “Chưa có biểu giá được xác minh” và liên kết nguồn thay vì mượn biểu giá của đơn vị khác.

## Lưu trữ và phiên bản

Thêm migration mới `0017_php_service_prices.sql` với ba nhóm dữ liệu:

- Snapshot có phiên bản của các mục PHP lấy từ danh mục Cảng vụ, kèm tên đơn vị, địa điểm, dịch vụ, URL biểu giá, ghi chú trạng thái, thời điểm lấy và hash nội dung.
- Tài liệu giá/pháp lý theo định danh tài liệu ổn định và các phiên bản bất biến. Lưu nhà phát hành, địa điểm áp dụng, tiêu đề, loại biểu giá/văn bản, URL gốc, ngày ban hành, ngày hiệu lực, ngày hết hiệu lực nếu có, hash tệp/nội dung, trạng thái duyệt và thời điểm lấy. Không lưu bản PDF nhị phân trong Neon; lưu liên kết gốc và nội dung trích xuất cần cho hiển thị/lịch sử.
- Các dòng biểu giá đã chuẩn hóa theo phiên bản tài liệu: thứ tự/trang nguồn, nhóm và tên dịch vụ, điều kiện, đơn vị, chuỗi giá nguyên gốc, số tiền/tiền tệ/VAT chỉ khi xác định chắc chắn, cùng payload trích xuất gốc để giữ các cột hoặc ghi chú đặc thù.

Các phiên bản tài liệu dùng trạng thái `pending_review`, `approved`, `rejected` hoặc `superseded`. Chỉ phiên bản `approved` mới xuất hiện cho người dùng. Phê duyệt một phiên bản mới không xóa phiên bản đã duyệt trước; phiên bản cũ được giữ để xem lịch sử và hết hiệu lực theo mốc trong tài liệu.

## Đồng bộ và quản trị

- Tái sử dụng lượt cron PHP hiện có lúc 07:00 giờ Việt Nam, phù hợp cấu hình Vercel Hobby; không tạo lịch Vercel thứ hai.
- Phần kiểm tra giá chạy độc lập với kết quả thu thập DWT/kế hoạch tàu. Lỗi nguồn giá không làm hỏng hoặc đánh dấu thất bại lượt DWT, và ngược lại.
- Mỗi ngày kiểm tra trang danh mục Cảng vụ cùng ba trang biểu giá của Cảng Hải Phòng, HICT và Cảng Đình Vũ. Chỉ tải tài liệu khi URL/tên phiên bản/hash thay đổi. Thời gian chờ, kích thước phản hồi và danh sách domain được giới hạn; chỉ chấp nhận nguồn HTTPS chính thức đã cấu hình.
- Hash giống nhau thì không tạo bản sao. Khi có tài liệu mới hoặc thay đổi, lưu thành phiên bản `pending_review`; parse PDF/HTML tạo gợi ý dòng giá, nhưng không tự động đưa dữ liệu parse chưa xác minh lên UI.
- Trang admin hiển thị trạng thái bật/tắt, nguồn đang dùng, lần kiểm tra gần nhất, lần thành công gần nhất, lỗi hiện tại và hàng chờ duyệt. Admin có thể chạy đồng bộ thủ công, duyệt hoặc từ chối phiên bản. Nguồn được giới hạn vào các host chính thức nêu trên.
- Nếu trang nguồn không truy cập được, parse thất bại hoặc nội dung mới không hợp lệ, giữ nguyên snapshot và phiên bản giá đã duyệt gần nhất; báo trạng thái lỗi cho admin.

## Ranh giới kỹ thuật

- Server Component của trang PHP đọc dữ liệu `approved` từ Neon; không gọi website nguồn trong request người dùng.
- Tách module miền giá dịch vụ khỏi `src/lib/php/collect.ts` để lỗi/parsing giá không ảnh hưởng bộ thu thập tàu.
- Crawler riêng cho danh mục Cảng vụ và adapter tài liệu cho ba nhà khai thác. Parser dùng fixture HTML/PDF được lưu trong repo để kiểm thử; mỗi adapter chịu trách nhiệm giữ điều kiện và thứ tự dòng nguồn.
- Dùng route cron PHP hiện có làm điểm gọi job giá. Job giá có lease/idempotency riêng để tránh chạy chồng hoặc tạo phiên bản trùng.
- Tạo module repository server-only để tải snapshot, phiên bản đã duyệt, lịch sử và trạng thái sync. Admin action bắt buộc `requireAdmin()`.

## Ngoài phạm vi v1

- Tính hóa đơn hoặc dự báo doanh thu/chi phí từ biểu giá.
- Tự kết luận tuân thủ pháp luật, mức giá tối đa/tối thiểu, hoặc giá thực thu.
- Tự suy diễn một tài liệu của công ty mẹ áp dụng cho mọi bến hoặc cho các công ty liên kết.
- Cào toàn bộ danh sách hãng tàu, hoa tiêu, lai dắt và mọi cảng tại Hải Phòng.
- Lưu nhị phân PDF hay dựa vào iframe bên ngoài để hiển thị bảng giá.

## Tiêu chí nghiệm thu

1. Danh mục Cảng vụ và ba trang biểu giá chính thức có thể đồng bộ thành snapshot/tài liệu; lặp cùng nội dung không tạo bản trùng.
2. Năm địa điểm được gắn đúng nhà khai thác/nguồn; giao diện không quy giá của HICT hoặc Cảng Đình Vũ thành giá của Công ty Cổ phần Cảng Hải Phòng.
3. Có thể xem giá đã duyệt theo địa điểm và phiên bản, cùng ghi chú, đơn vị, VAT/tiền tệ khi xác định được, ngày hiệu lực và liên kết nguồn.
4. Dữ liệu mới chưa duyệt không hiển thị cho khách; duyệt/từ chối chỉ admin thực hiện; phiên bản cũ vẫn truy cập được.
5. Lỗi đồng bộ không làm mất dữ liệu đang hiển thị và không làm lỗi lượt cron DWT.
6. Tab mới hoạt động cả tiếng Việt và tiếng Anh; trạng thái trống/lỗi/đang tải có nội dung phù hợp.
7. Kiểm thử parser, version/hash idempotency, trạng thái duyệt, cách ly lỗi job và quyền admin; chạy lint, typecheck, test, migration check và build liên quan.

## Nguồn tham khảo

- [Danh mục niêm yết giá — Cảng vụ Hàng hải Hải Phòng](https://cangvuhaiphong.gov.vn/niem-yet-gia/)
- [Bảng giá dịch vụ — Cảng Hải Phòng](https://haiphongport.com.vn/vi/bang-gia-dich-vu)
- [Bảng giá dịch vụ — HICT](https://hict.net.vn/ho-tro-khach-hang/pages/bang-gia-dich-vu.aspx)
- [Bảng giá dịch vụ năm 2026 — Cảng Đình Vũ](https://dinhvuport.com.vn/vn/serviceprice.html)
- [Thông tư 12/2024/TT-BGTVT — Cổng văn bản Chính phủ](https://vanban.chinhphu.vn/?classid=1&docid=210330&pageid=27160)
- [Thông tư 31/2024/TT-BGTVT — Cổng văn bản Chính phủ](https://vanban.chinhphu.vn/?classid=1&docid=211672&pageid=27160&typegroupid=6)
