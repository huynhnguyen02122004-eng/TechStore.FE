# Cấu trúc `src`

Ứng dụng dùng feature-based architecture: màn hình và mã nghiệp vụ được nhóm theo phân hệ, còn các phần hạ tầng/giao diện thực sự dùng chung nằm trong `shared/`. Các page được chuyển nguyên trạng để giữ logic và giao diện hiện có.

## Cây thư mục

```text
src/
├── App.tsx
├── main.tsx
├── assets/
├── features/
│   ├── storefront/
│   │   ├── auth/                 # Login, Register
│   │   ├── catalog/              # Home/catalog, product detail
│   │   ├── cart/
│   │   ├── checkout/             # Checkout, checkout result
│   │   ├── orders/               # My orders, order detail
│   │   ├── profile/              # Addresses and customer profile
│   │   └── shipments/            # Shipment tracking
│   └── admin/
│       ├── catalog/              # Products, categories, brands
│       ├── inventory/            # Stock and transaction/reservation history
│       ├── orders/
│       ├── payments/
│       └── shipments/
├── routes/
│   ├── AppRouter.tsx
│   ├── publicRoutes.tsx
│   ├── clientRoutes.tsx
│   ├── adminRoutes.tsx
│   └── AdminPageChunks.tsx       # Lazy-loaded admin pages
├── shared/
│   ├── api/
│   │   ├── httpClient.ts         # Shared Axios configuration
│   │   ├── serviceMode.ts        # API/demo selection for admin features
│   │   ├── dto/                  # Request/response contracts
│   │   └── endpoints/            # Auth, catalog, checkout, inventory APIs
│   ├── components/               # AddressDivisionFields
│   └── layouts/                  # StorefrontLayout, AdminLayout, StorefrontNavigation
├── services/
│   ├── demo*.ts                  # Local/demo adapters
│   └── *Service.ts               # Compatibility exports to shared API endpoints
├── mocks/                        # Static product-detail fixture
├── constants/
├── hooks/
├── store/
├── types/
├── utils/
├── App.css
└── index.css
```

`Footer` chưa tồn tại trong phiên bản trước khi tái cấu trúc, vì vậy không thêm một footer mới để tránh tự ý thay đổi giao diện. Có thể bổ sung tại `shared/layouts/` khi có thiết kế/nội dung xác nhận.

## API và demo

- `shared/api/httpClient.ts` là Axios client dùng chung; endpoint được cấu hình bởi `VITE_API_BASE_URL`, mặc định `/api/v1`. Vite dev proxy hiện chuyển `/api/v1` tới backend local.
- Request/response types nằm trong `shared/api/dto/`; endpoint implementation nằm trong `shared/api/endpoints/`.
- Các file trong `services/` giữ export cũ để page và demo adapter hiện tại không phải đổi imports cùng lúc. Mã mới nên import endpoint/DTO trực tiếp từ `shared/api/`.
- `VITE_SERVICE_MODE=api` (mặc định) dùng API cho màn hình quản trị khi có access token. `VITE_SERVICE_MODE=demo` dùng các `demo*Service` cho màn hình quản trị. Khi chưa có token, các màn hình đó vẫn dùng demo để bảo toàn luồng guest hiện hữu.
- Storefront dùng API thật cho giỏ hàng tài khoản và checkout. Người dùng cần đăng nhập để thêm hàng, xem giỏ hoặc đặt hàng; những luồng demo khác vẫn được giữ theo cấu hình hiện có.

## Lộ trình di chuyển an toàn

1. **Chốt baseline**: chạy `npm run build`, ghi nhận các luồng hiện có và giữ nguyên các thay đổi chưa commit. Không đổi API nghiệp vụ hay DTO trong bước di chuyển.
2. **Nhóm màn hình theo feature**: chuyển `pages/` sang `features/storefront/{auth,catalog,cart,checkout,orders,profile,shipments}` và `features/admin/{catalog,inventory,orders,payments,shipments}`. Chỉ cập nhật import path; giữ nguyên nội dung trang.
3. **Tách routing/layout**: chuyển route declarations sang `routes/`, giữ URL hiện tại, tải lazy các màn hình admin, đưa Navigation/Search vào `shared/layouts/`. Các page tiếp tục giữ access checks hiện có để không chặn demo/guest flow.
4. **Tách hạ tầng API**: chuyển Axios client, endpoint modules và DTO sang `shared/api/`; giữ compatibility exports trong `services/` trong thời gian chuyển tiếp.
5. **Chuyển demo theo từng feature**: khi chỉnh một feature, gom API adapter, demo adapter và types của feature vào cùng module; dùng `VITE_SERVICE_MODE` để kiểm tra cả hai chế độ trước khi xóa compatibility export.
6. **Xác minh từng lát cắt**: sau mỗi lần chuyển feature, chạy build và kiểm tra route storefront/admin tương ứng; chỉ xóa thư mục tương thích khi không còn imports tham chiếu.

Không thêm route guard tập trung trong lần này: một số route đang hỗ trợ guest/demo, còn các kiểm tra đăng nhập hiện nằm trong page. Có thể đưa guard vào `routes/` ở một thay đổi riêng sau khi chốt rõ chính sách guest cho checkout/đơn hàng.
