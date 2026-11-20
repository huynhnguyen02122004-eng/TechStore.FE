# Cấu trúc thư mục `src`

- `assets/`: hình ảnh, biểu tượng và tài nguyên tĩnh.
- `components/`: thành phần giao diện dùng lại; `common/` cho thành phần chung, `modal/` cho hộp thoại, `product/` và `cart/` cho giao diện theo nghiệp vụ.
- `constants/`: hằng số và cấu hình dùng chung.
- `hooks/`: React hooks dùng chung.
- `layouts/`: bố cục trang, chẳng hạn bố cục cửa hàng và tài khoản.
- `pages/`: các trang theo nghiệp vụ như trang chủ, sản phẩm, giỏ hàng, thanh toán, đơn hàng và hồ sơ.
- `routes/`: khai báo và điều hướng giữa các trang.
- `services/api/`: giao tiếp với backend.
- `store/`: trạng thái dùng chung của ứng dụng.
- `types/`: kiểu TypeScript dùng chung.
- `utils/`: hàm tiện ích; dùng cách viết chuẩn `utils` thay cho `untils`.

Các thư mục nghiệp vụ hiện được để trống để bổ sung component và trang khi phát triển.
