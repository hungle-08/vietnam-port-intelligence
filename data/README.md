# Danh mục đầu tư cảng

`port-investments.json` là dữ liệu đang sử dụng cho trang chủ và bảng Neon `port_entities`: 15 mã do người dùng cung cấp trong ảnh ngày 13/10/2026. Đây là danh mục khởi đầu, chưa phải danh sách đầy đủ mọi cảng Việt Nam. Sàn và tên theo ảnh; website tham khảo chưa được dùng làm bằng chứng xác minh.

- Mỗi bản ghi là cảng/doanh nghiệp khai thác ở cấp theo dõi đầu tư; không phải một bến.
- GMD và MVN là hệ thống nhiều cảng; `regions` bao phủ nhiều vùng. Không dùng tọa độ trụ sở thay cho vị trí cảng.
- MVN có `mapVisible=false`, luôn bị loại khỏi bản đồ nhưng vẫn có trong danh mục.
- Theo yêu cầu bổ sung ngày 13/10/2026, sử dụng vị trí tương đối theo khu vực cảng: 14 đơn vị có 16 điểm bản đồ. Tọa độ được ước lượng đến hai chữ số thập phân, không phải tọa độ công bố của từng bến. `accuracy=approximate`, `method=area-estimate`; URL dẫn đến tài liệu tham khảo khu vực, không tuyên bố nguồn đó cung cấp đúng con số tọa độ này.
- GMD có ba khu vực đại diện: Nam Đình Vũ, Dung Quất, Gemalink/Cái Mép; đây chưa phải tất cả cơ sở của GMD. Các doanh nghiệp khác dùng một điểm khu vực đại diện, chưa bao phủ mọi cơ sở khai thác. `mapLocations` lưu cùng payload trong Neon; lọc theo vùng áp dụng trên từng điểm.
- Trạng thái khai thác giữ `unverified`; tọa độ tương đối không được dùng làm bằng chứng “đang mở”.
- Chưa triển khai dữ liệu sản lượng, crawler hay lịch cập nhật mỗi sáng.

`port-directory.json`, PDF 505 và script Python trích xuất là tài liệu nghiên cứu bến của phạm vi cũ, không nhập vào danh mục đầu tư. Nhánh Neon phát triển đã có dữ liệu bến thử nghiệm; production chỉ nhập 15 bản ghi vào `port_entities`. Migration đầu tiên để lại bảng bến trống trên production và không xóa dữ liệu cũ.

Nhập dữ liệu: `npm run db:migrate`, `npm run db:seed`, `npm run db:verify`. Dùng `DB_ENV_FILE=.env.neon-dev` để kiểm tra nhánh phát triển. Seed upsert theo mã và xác minh payload khớp dataset; việc chạy lại không tăng số bản ghi.

Hoàng Sa và Trường Sa dùng các điểm đảo tham khảo có tên và tọa độ từ cổng thông tin Đà Nẵng, Sở Văn hóa Khánh Hòa. Nguồn được lưu trong `src/lib/ports/archipelagos.ts` và liên kết dưới bản đồ. Đây là các điểm đại diện, không phải lớp đường bờ đầy đủ hoặc ranh giới trên biển. Đảo được vẽ bằng ký hiệu nhỏ để nhìn thấy ở tỷ lệ toàn quốc; màu/ký hiệu tách khỏi điểm cảng.

## Shipping lines

`shipping-lines.json`: top 10 Alphaliner operated container fleet snapshot dated 2026-10-12, retrieved 2026-10-13 through web search index. Original facts limited to ranks 1–10, capacity share, total TEU and vessel counts in `sources/alphaliner-2026-10-12.txt`. Published shares are retained rather than recalculated from a potentially different global denominator. Metric is global capacity share, not port throughput/share. Figures include consolidated subsidiaries and owned/chartered operated vessels; no orderbook included in capacity. Source URL and retrieval method are explicit.

Brand metadata lives in `src/lib/shipping/carriers.ts`; brand images are referenced from company sites or Wikimedia reproductions, with image failure falling back to the carrier name. No affiliation is implied. Logo reference URLs should be periodically checked; no invented brand graphic is generated.
