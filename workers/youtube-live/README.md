# Cloudflare Worker cho lịch livestream

Worker gọi endpoint Vercel vào thứ Hai–thứ Sáu lúc 10:10, 10:20 và 10:30 giờ Việt Nam. Cloudflare dùng giờ UTC; cấu hình `MON-FRI` tránh khác biệt về cách đánh số thứ trong tuần.

## Chuẩn bị

- Có tài khoản Cloudflare Workers và còn ít nhất 2 Cron Triggers trong hạn mức; URL Vercel production đã chạy endpoint `/api/cron/youtube-live`.
- `YOUTUBE_API_KEY` và `CRON_SECRET` đã được cấu hình trên Vercel; triển khai lại Vercel nếu mới cập nhật biến môi trường.
- `APP_URL` là URL gốc HTTPS của website Vercel; `CRON_SECRET` phải trùng chính xác với Vercel. Không đưa khóa vào source hay chat.

## Tạo và cấu hình Worker

1. Trong Cloudflare Dashboard, mở **Workers & Pages** → **Create application** → **Create Worker**. Đặt tên `vietnam-port-youtube-live` và triển khai Worker mặc định ban đầu.
2. Trong Worker vừa tạo, vào **Settings → Variables and Secrets**. Thêm `APP_URL` dưới dạng Text với URL gốc HTTPS của Vercel, ví dụ `https://example.vercel.app`. Thêm `CRON_SECRET` dưới dạng **Secret**, dùng cùng giá trị như trên Vercel. Chọn **Deploy** nếu giao diện yêu cầu.
3. Trong terminal ở thư mục gốc repository, đăng nhập Cloudflare:

   ```bash
   npx wrangler@4 login
   ```

   Chọn đúng tài khoản đã tạo Worker. Sau đó triển khai code và lịch:

   ```bash
   npx wrangler@4 deploy --config workers/youtube-live/wrangler.toml --keep-vars
   ```

   `--keep-vars` giữ các biến và secret đã thiết lập trong Dashboard. Không thêm giá trị secret vào file cấu hình. Lệnh deploy cập nhật Worker trên tài khoản Cloudflare.
4. Kiểm tra **Settings → Triggers → Cron Triggers** có lịch `10,20,30 3 * * MON-FRI`. Cloudflare cho biết thay đổi cron có thể mất đến 15 phút để lan truyền.
5. Kiểm tra **Workers Logs** và **Cron Events** sau lần chạy theo lịch; trạng thái `found`, `none` hoặc `skipped` là đã gọi thành công, HTTP 401/503 hoặc lỗi khác cần xử lý. Lịch sử Cron Events của Worker mới có thể xuất hiện trễ. Đối chiếu bảng `youtube_live_checks` trên Neon và trang `/vi/livestreams`. Nếu chưa có lịch sử, chờ lịch tiếp theo; kết quả build hay triển khai không chứng minh cron đã chạy.

Sau khi xác nhận Cloudflare chạy theo lịch thành công, đưa thay đổi xóa `.github/workflows/youtube-live.yml` lên nhánh mặc định hoặc tắt workflow **Capture YouTube live links** trong GitHub Actions để tránh chạy trùng. Việc xóa file local không tự tắt workflow trên GitHub. Trong giai đoạn chuyển tiếp, endpoint lưu theo `video_id` nên các lần gọi trùng không tạo thêm bản ghi video.

Để thử Worker local không cần tác động YouTube/Vercel, chạy `npm test -- tests/youtube-live-worker.test.ts`. Để thử end-to-end, dùng trình thử sự kiện scheduled của Wrangler với biến local an toàn, hoặc chờ một lượt cron đã cấu hình; không công bố URL kèm secret. Chỉ tắt GitHub sau khi xác minh kết quả.

Sau khi lưu một livestream của kênh trong ngày theo giờ Việt Nam, các lần kiểm tra còn lại nhận trạng thái `skipped` và không gọi YouTube. Cron Trigger vẫn kích hoạt Worker; endpoint chỉ kiểm tra cơ sở dữ liệu. Ngày mới, quy trình kiểm tra lại bình thường. Phạm vi này giả định chỉ cần một livestream mỗi ngày.
