import type { BrandMutation, BrandResponse } from './catalogService';

const STORAGE_KEY = 'techstore-demo-brands';

const initialBrands: BrandResponse[] = [
  { id: 'demo-brand-apple', name: 'Apple' },
  { id: 'demo-brand-samsung', name: 'Samsung' },
  { id: 'demo-brand-asus', name: 'ASUS' },
  { id: 'demo-brand-dell', name: 'Dell' },
  { id: 'demo-brand-sony', name: 'Sony' },
];

const isBrand = (value: unknown): value is BrandResponse =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'name' in value &&
  typeof value.name === 'string';

const save = (brands: BrandResponse[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  return brands;
};

export const demoBrandService = {
  getAll: (): BrandResponse[] => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return save(initialBrands.map((brand) => ({ ...brand })));

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isBrand)) {
      throw new Error('Dữ liệu thương hiệu demo không hợp lệ.');
    }
    return parsed;
  },

  create: (input: BrandMutation): BrandResponse[] => {
    const brands = demoBrandService.getAll();
    if (brands.some((brand) => brand.name.toLocaleLowerCase() === input.name.toLocaleLowerCase())) {
      throw new Error('Tên thương hiệu đã tồn tại.');
    }
    return save([...brands, { ...input, id: `demo-brand-${Date.now()}` }]);
  },

  update: (brandId: string, input: BrandMutation): BrandResponse[] => {
    const brands = demoBrandService.getAll();
    if (!brands.some((brand) => brand.id === brandId)) {
      throw new Error('Không tìm thấy thương hiệu cần cập nhật.');
    }
    if (brands.some((brand) =>
      brand.id !== brandId && brand.name.toLocaleLowerCase() === input.name.toLocaleLowerCase())) {
      throw new Error('Tên thương hiệu đã tồn tại.');
    }
    return save(brands.map((brand) => brand.id === brandId ? { ...input, id: brandId } : brand));
  },

  delete: (brandId: string): BrandResponse[] => {
    const brands = demoBrandService.getAll();
    if (!brands.some((brand) => brand.id === brandId)) {
      throw new Error('Không tìm thấy thương hiệu cần xóa.');
    }
    return save(brands.filter((brand) => brand.id !== brandId));
  },
};
