import type {
  ProductImageResponse,
  ProductResponse,
  ProductVariantResponse,
  VariantSpecificationResponse,
} from '../services/catalogService';

export const MOCK_PRODUCT_ID = 'mock-iphone';

export const mockProductDetail = {
  product: {
    id: MOCK_PRODUCT_ID,
    name: 'TechPhone Pro 256GB',
    slug: 'techphone-pro-256gb',
    description:
      'Mẫu điện thoại minh họa cho giao diện chi tiết sản phẩm TechStore. Thiết kế cao cấp, màn hình sắc nét và hiệu năng mạnh mẽ cho nhu cầu sử dụng hằng ngày.',
    categoryName: 'Điện thoại',
    brandName: 'TechStore',
    warrantyMonths: 12,
    status: 'ACTIVE',
  } satisfies ProductResponse,
  variants: [
    {
      id: 'mock-variant-256-black',
      sku: 'TP-PRO-256-BLK',
      price: 25990000,
      attributesSummary: '256 GB · Đen',
      status: 'ACTIVE',
    },
    {
      id: 'mock-variant-256-silver',
      sku: 'TP-PRO-256-SLV',
      price: 25990000,
      attributesSummary: '256 GB · Bạc',
      status: 'ACTIVE',
    },
    {
      id: 'mock-variant-512-black',
      sku: 'TP-PRO-512-BLK',
      price: 28990000,
      attributesSummary: '512 GB · Đen',
      status: 'ACTIVE',
    },
    {
      id: 'mock-variant-1tb-burgundy',
      sku: 'TP-PRO-1TB-BRG',
      price: 32990000,
      attributesSummary: '1 TB · Đỏ Burgundy',
      status: 'ACTIVE',
    },
  ] satisfies ProductVariantResponse[],
  images: [
    {
      id: 'mock-image-back',
      imageUrl: '/mock-phone-back.svg',
      isPrimary: true,
      displayOrder: 1,
    },
    {
      id: 'mock-image-front',
      imageUrl: '/mock-phone-front.svg',
      displayOrder: 2,
    },
    {
      id: 'mock-image-side',
      imageUrl: '/mock-phone-side.svg',
      displayOrder: 3,
    },
  ] satisfies ProductImageResponse[],
  specifications: {
    'mock-variant-256-black': [
      { id: 'mock-spec-display', specKey: 'Màn hình', specValue: '6.7 inch, OLED, 120 Hz', displayOrder: 1 },
      { id: 'mock-spec-chip', specKey: 'Vi xử lý', specValue: 'Tech A Pro', displayOrder: 2 },
      { id: 'mock-spec-camera', specKey: 'Camera', specValue: 'Chính 48 MP, góc rộng 12 MP', displayOrder: 3 },
      { id: 'mock-spec-battery', specKey: 'Pin', specValue: 'Sử dụng cả ngày, sạc nhanh', displayOrder: 4 },
      { id: 'mock-spec-os', specKey: 'Hệ điều hành', specValue: 'TechOS 19', displayOrder: 5 },
    ],
    'mock-variant-256-silver': [
      { id: 'mock-spec-display', specKey: 'Màn hình', specValue: '6.7 inch, OLED, 120 Hz', displayOrder: 1 },
      { id: 'mock-spec-chip', specKey: 'Vi xử lý', specValue: 'Tech A Pro', displayOrder: 2 },
      { id: 'mock-spec-camera', specKey: 'Camera', specValue: 'Chính 48 MP, góc rộng 12 MP', displayOrder: 3 },
      { id: 'mock-spec-battery', specKey: 'Pin', specValue: 'Sử dụng cả ngày, sạc nhanh', displayOrder: 4 },
      { id: 'mock-spec-os', specKey: 'Hệ điều hành', specValue: 'TechOS 19', displayOrder: 5 },
    ],
    'mock-variant-512-black': [
      { id: 'mock-spec-display', specKey: 'Màn hình', specValue: '6.7 inch, OLED, 120 Hz', displayOrder: 1 },
      { id: 'mock-spec-chip', specKey: 'Vi xử lý', specValue: 'Tech A Pro', displayOrder: 2 },
      { id: 'mock-spec-camera', specKey: 'Camera', specValue: 'Chính 48 MP, góc rộng 12 MP', displayOrder: 3 },
      { id: 'mock-spec-storage', specKey: 'Dung lượng', specValue: '512 GB', displayOrder: 4 },
      { id: 'mock-spec-os', specKey: 'Hệ điều hành', specValue: 'TechOS 19', displayOrder: 5 },
    ],
    'mock-variant-1tb-burgundy': [
      { id: 'mock-spec-display', specKey: 'Màn hình', specValue: '6.7 inch, OLED, 120 Hz', displayOrder: 1 },
      { id: 'mock-spec-chip', specKey: 'Vi xử lý', specValue: 'Tech A Pro', displayOrder: 2 },
      { id: 'mock-spec-camera', specKey: 'Camera', specValue: 'Chính 48 MP, góc rộng 12 MP', displayOrder: 3 },
      { id: 'mock-spec-storage', specKey: 'Dung lượng', specValue: '1 TB', displayOrder: 4 },
      { id: 'mock-spec-os', specKey: 'Hệ điều hành', specValue: 'TechOS 19', displayOrder: 5 },
    ],
  } satisfies Record<string, VariantSpecificationResponse[]>,
};
