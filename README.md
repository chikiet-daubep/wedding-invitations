# Thiệp cưới Chí Kiệt & Tố Quân

Thiệp HTML, CSS, JavaScript thuần, phong cách Trung Hoa với đỏ son, vàng champagne, đèn lồng và chữ song hỷ. Tiêu đề dùng **Lora**, nội dung dùng Be Vietnam Pro. Không cần npm hoặc bước build. Máy chủ local cho RSVP dùng Python 3.10 trở lên, không cần cài thêm thư viện.

## Mở thiệp

Để dùng **đầy đủ cả RSVP và sổ lời chúc**, chạy `start-local.cmd` rồi mở `http://127.0.0.1:4173/` bằng Chrome, Edge, Safari hoặc Firefox hiện đại. Giữ cửa sổ máy chủ mở trong lúc sử dụng; nhấn Ctrl+C để dừng. Nếu cần đổi cổng: `python server.py --port 4174`.

Các tệp ảnh, nhạc và video đã đi kèm. Có thể mở `dist/index.html` trực tiếp để xem phần thiệp. Khi mở như vậy, hoặc khi chỉ đưa `dist/` lên hosting tĩnh, RSVP sẽ thông báo chưa kết nối và **không báo gửi thành công**. Muốn nhận RSVP từ khách bên ngoài, cần máy chủ được triển khai riêng; bản giao hiện tại chỉ chạy trên máy của bạn, không được xuất bản lên dịch vụ ngoài.

Font Google và bản đồ cần Internet; khi mất kết nối, chữ dùng font dự phòng. Bản đồ không cần khóa API; có nút chỉ đường riêng nếu iframe không hiển thị.

## Cá nhân hóa người nhận qua URL

Sửa `dist/config.js`, mục `guests`:

```js
guests: {
  'gia-dinh': 'Quý gia đình',
  'ban-be': 'Bạn và người thương',
  'anh-minh': 'Anh Nguyễn Văn Minh', // Tên ví dụ, hãy thay bằng khách thật.
},
```

Gửi link dạng `https://ten-mien-cua-ban/?guest=anh-minh`. Alias `?to=anh-minh` cũng được hỗ trợ. Mã không có trong danh sách hiển thị `Quý khách`. Mã được chuyển thành chữ thường; nên dùng chữ không dấu và dấu gạch nối. Tên khách được chèn bằng `textContent`, không xử lý như HTML.

Hoặc mở `http://127.0.0.1:4173/guests.html` để dùng **công cụ tạo link khách mời**. Mỗi dòng nhập một tên, hoặc `ma-khach | Tên đầy đủ`. Bấm **Tạo & lưu danh sách**: bản local ghi thật vào `dist/guest-map.js` và `dist/guest-map.json`; link mới lập tức hiện đúng tên. Danh sách này ưu tiên hơn `config.js` nếu trùng mã. Khi dùng hosting tĩnh, tải `guest-map.js` rồi thay vào cùng thư mục với `index.html`.

Các link bắt đầu bằng `127.0.0.1` chỉ dùng xem trên máy đang chạy thiệp. Khi có hosting thật, đổi ô **Đường dẫn gốc của thiệp** thành URL hosting trước khi sao chép link gửi khách.

Nếu mở trực tiếp trên máy, thêm `?guest=gia-dinh` vào cuối URL của `index.html`. Toàn bộ danh sách trong JavaScript có thể được người xem đọc; chỉ lưu tên hiển thị và mã khách, không thêm dữ liệu riêng tư khác.

## Thay QR mừng cưới

QR hiện tại là hình mẫu, **không chứa dữ liệu nhận chuyển khoản**. Chép ảnh QR thật vào `dist/assets/qr-ngan-hang.png`, sau đó sửa:

```js
gift: {
  qrImage: 'assets/qr-ngan-hang.png',
  isMock: false,
  bank: 'Tên ngân hàng',
  accountNumber: 'Số tài khoản',
  accountName: 'Tên chủ tài khoản',
},
```

Khi `isMock: true`, thiệp ghi rõ “QR mẫu · Chưa dùng để chuyển khoản” và ẩn thông tin ngân hàng. Khi đổi thành `false`, thiệp hiện thông tin đã nhập và nút sao chép số tài khoản. Hãy quét thử QR để kiểm tra đúng người nhận trước khi gửi thiệp.

## Ảnh, video và nhạc

- Chín ảnh cưới gốc nằm trong `dist/assets/photo-01.jpg` đến `photo-09.jpg`, theo thứ tự tên tệp nguồn tăng dần; mọi ảnh đều có trong album.
- Nhạc nền dùng đúng `Violin.mp3` bạn cung cấp, bắt đầu sau thao tác mở thiệp. Nút nhạc ở góc dưới cho phép bật/tắt.
- Video slideshow đã được tối ưu từ tệp 4K xuống 720p để tải qua mạng thuận tiện hơn. Video chỉ tải khi người xem bấm phát; có nút điều khiển và hỗ trợ toàn màn hình của trình duyệt.
- Khi video phát, nhạc nền tạm dừng; khi video dừng/kết thúc, nhạc tiếp tục nếu người xem vẫn bật nhạc.
- Thay đường dẫn nhạc/video ở `config.js` nếu muốn dùng tệp khác.

## Ngày và giờ

Đồng hồ đếm tới **18:00 ngày 25/11/2026, múi giờ Việt Nam (+07:00)**. Sau mốc này, đồng hồ về 0 và hiện lời cảm ơn. Hôn lễ tại tư gia lúc 06:00 được trình bày riêng. Ngày âm lịch được giữ theo thông tin bạn cung cấp: 17/10 năm Bính Ngọ.

Tệp `assets/tiec-cuoi.ics` cho phép thêm tiệc vào lịch, bắt đầu 18:00. Thời lượng lịch tạm đặt 3 giờ để tiện giữ lịch; đây không phải thời gian kết thúc đã được gia đình xác nhận. Có thể sửa `DTEND` nếu cần.

## Những phần đã có

Mở cửa 3D, dấu song hỷ, đèn lồng, hạt sáng; ảnh lớn zoom chậm và chuyển động nhẹ theo cuộn; giảm chuyển động theo cài đặt của thiết bị; giao diện điện thoại/máy tính; thanh tiện ích mobile; đầy đủ thông tin hai gia đình; hôn lễ; tiệc; đồng hồ; album phóng to, vuốt và phím mũi tên; video; nhạc; bản đồ; thêm lịch; hộp QR; xem lại bìa; công cụ tạo link; RSVP và sổ lời chúc.

## Xác nhận tham dự và sổ lời chúc

Phản hồi lưu trong `data/wedding.sqlite3` trên máy, vẫn còn sau khi dừng/chạy lại máy chủ. Tên, tình trạng tham dự, số người và lời chúc được lưu. Khách phải tự chọn **Cho phép hiện tên và lời chúc** thì nội dung mới xuất hiện trên sổ; bỏ chọn rồi cập nhật sẽ ẩn lời chúc đó. Số người chỉ được tính khi chọn sẽ tham dự.

Trình duyệt lưu một mã phản hồi để lần cập nhật thay thế phản hồi trước, tránh tạo trùng khi gửi lại. Cùng thiết bị và cùng mã khách sẽ chỉnh cùng phản hồi; nếu nhiều người dùng chung máy, dùng link có mã khách riêng cho từng người.

Trang `guests.html` có phần xem phản hồi, tổng số người xác nhận và tải CSV (mở được bằng Excel). Máy chủ chỉ lắng nghe `127.0.0.1`; các API quản lý chỉ dùng trong bản local. Dữ liệu riêng không được đưa vào gói ZIP giao ban đầu. Khi sao lưu về sau, giữ thêm thư mục `data/` và hai tệp `guest-map.*` đã chỉnh.

Máy chủ đi kèm là máy chủ xem thử local, không phải cấu hình triển khai Internet. Việc triển khai công khai sau này cần xác thực cho trang quản lý, chống spam, sao lưu và cấu hình HTTPS. Thiệp hiện không tự gửi email/tin nhắn.

## Hình xem trước

![Bìa thiệp phong cách Trung Hoa](docs/preview-cover.png)

![Giao diện điện thoại với thanh tiện ích](docs/preview-mobile.png)

## Các tệp trong repo

- `dist/`: toàn bộ HTML, CSS, JavaScript và tài nguyên để chạy thiệp.
- `dist/assets/`: chín ảnh cưới, Violin MP3, slideshow MP4 đã tối ưu, QR mẫu, biểu tượng, ảnh bìa video và lịch ICS.
- `server.py`, `start-local.cmd`: máy chủ và tệp khởi chạy local có lưu RSVP.
- `docs/`: hình xem trước bìa và giao diện mobile.

Repo không chứa cơ sở dữ liệu phản hồi thật của khách, tệp kiểm thử, thông tin đăng nhập hoặc mã định danh của dịch vụ hosting. Upload mã nguồn lên GitHub không tự triển khai trang web hay máy chủ RSVP.
