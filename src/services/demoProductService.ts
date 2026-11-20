import type {
  ProductMutation,
  ProductResponse,
} from './catalogService';

const STORAGE_KEY = 'techstore-demo-products';

const initialProducts: ProductResponse[] = [
  {
    id: 'mock-iphone',
    name: 'TechPhone Pro',
    slug: 'techphone-pro',
    categoryId: 'demo-category-phones',
    brandId: 'demo-brand-apple',
    categoryName: 'Điện thoại',
    brandName: 'Apple',
    description: 'Điện thoại demo với nhiều phiên bản cấu hình.',
    warrantyMonths: 12,
    status: 'ACTIVE',
    imageUrl: '/mock-phone-front.svg',
  },
  {
    id: 'demo-product-laptop',
    name: 'Laptop Pro 14',
    slug: 'laptop-pro-14',
    categoryId: 'demo-category-laptops',
    brandId: 'demo-brand-dell',
    categoryName: 'Laptop',
    brandName: 'Dell',
    description: 'Laptop demo dành cho công việc và học tập.',
    warrantyMonths: 24,
    status: 'ACTIVE',
  },
  {
    id: 'demo-product-headphones',
    name: 'Tai nghe không dây',
    slug: 'tai-nghe-khong-day',
    categoryId: 'demo-category-audio',
    brandId: 'demo-brand-sony',
    categoryName: 'Tai nghe',
    brandName: 'Sony',
    description: 'Tai nghe demo có chống ồn chủ động.',
    warrantyMonths: 12,
    status: 'INACTIVE',
  },
];

const isProduct = (value: unknown): value is ProductResponse =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'name' in value &&
  typeof value.name === 'string' &&
  'slug' in value &&
  typeof value.slug === 'string';

const save = (products: ProductResponse[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  return products;
};

const normalizeProduct = (
  product: ProductMutation,
  id: string,
  categories: Array<{ id: string; name: string }>,
  brands: Array<{ id: string; name: string }>,
): ProductResponse => ({
  ...product,
  id,
  slug: product.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  categoryName: categories.find((category) => category.id === product.categoryId)?.name,
  brandName: brands.find((brand) => brand.id === product.brandId)?.name,
});

export const demoProductService = {
  getAll: (): ProductResponse[] => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return save(initialProducts.map((product) => ({ ...product })));
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isProduct)) {
      throw new Error('Dữ liệu sản phẩm demo không hợp lệ.');
    }
    return parsed;
  },

  create: (
    product: ProductMutation,
    categories: Array<{ id: string; name: string }>,
    brands: Array<{ id: string; name: string }>,
  ): ProductResponse[] => {
    const products = demoProductService.getAll();
    const created = normalizeProduct(product, `demo-product-${Date.now()}`, categories, brands);
    return save([created, ...products]);
  },

  update: (
    productId: string,
    product: ProductMutation,
    categories: Array<{ id: string; name: string }>,
    brands: Array<{ id: string; name: string }>,
  ): ProductResponse[] => {
    const products = demoProductService.getAll();
    if (!products.some((item) => item.id === productId)) {
      throw new Error('Không tìm thấy sản phẩm demo cần cập nhật.');
    }
    return save(products.map((item) => {
      if (item.id !== productId) return item;
      const updated = normalizeProduct(product, productId, categories, brands);
      return { ...item, ...updated };
    }));
  },

  delete: (productId: string): ProductResponse[] => {
    const products = demoProductService.getAll();
    if (!products.some((item) => item.id === productId)) {
      throw new Error('Không tìm thấy sản phẩm demo cần xóa.');
    }
    return save(products.filter((item) => item.id !== productId));
  },
};
