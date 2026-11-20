import type { CategoryMutation, CategoryResponse } from './catalogService';

const STORAGE_KEY = 'techstore-demo-categories';

const initialCategories: CategoryResponse[] = [
  { id: 'demo-category-phones', name: 'Điện thoại', description: 'Điện thoại thông minh', parentId: null },
  { id: 'demo-category-laptops', name: 'Laptop', description: 'Laptop học tập và làm việc', parentId: null },
  { id: 'demo-category-accessories', name: 'Phụ kiện', description: 'Phụ kiện công nghệ', parentId: null },
  { id: 'demo-category-audio', name: 'Tai nghe', description: 'Tai nghe và thiết bị âm thanh', parentId: 'demo-category-accessories' },
];

const isCategory = (value: unknown): value is CategoryResponse =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'name' in value &&
  typeof value.name === 'string' &&
  (!('description' in value) || typeof value.description === 'string') &&
  (!('parentId' in value) || typeof value.parentId === 'string' || value.parentId === null);

const save = (categories: CategoryResponse[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  return categories;
};

const getDescendantIds = (categories: CategoryResponse[], categoryId: string): Set<string> => {
  const descendants = new Set<string>();
  const pending = [categoryId];
  while (pending.length > 0) {
    const parentId = pending.pop();
    for (const category of categories) {
      if (category.parentId === parentId && !descendants.has(category.id)) {
        descendants.add(category.id);
        pending.push(category.id);
      }
    }
  }
  return descendants;
};

const validateParent = (
  categories: CategoryResponse[],
  categoryId: string | null,
  parentId?: string | null,
) => {
  if (!parentId) return;
  if (parentId === categoryId || getDescendantIds(categories, categoryId ?? '').has(parentId)) {
    throw new Error('Không thể chọn chính danh mục này hoặc danh mục con làm danh mục cha.');
  }
  if (!categories.some((category) => category.id === parentId)) {
    throw new Error('Danh mục cha đã chọn không tồn tại.');
  }
};

export const demoCategoryService = {
  getAll: (): CategoryResponse[] => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return save(initialCategories.map((category) => ({ ...category })));

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isCategory)) {
      throw new Error('Dữ liệu danh mục demo không hợp lệ.');
    }
    return parsed;
  },

  create: (input: CategoryMutation): CategoryResponse[] => {
    const categories = demoCategoryService.getAll();
    validateParent(categories, null, input.parentId);
    const created: CategoryResponse = { ...input, id: `demo-category-${Date.now()}` };
    return save([...categories, created]);
  },

  update: (categoryId: string, input: CategoryMutation): CategoryResponse[] => {
    const categories = demoCategoryService.getAll();
    if (!categories.some((category) => category.id === categoryId)) {
      throw new Error('Không tìm thấy danh mục cần cập nhật.');
    }
    validateParent(categories, categoryId, input.parentId);
    return save(categories.map((category) => category.id === categoryId
      ? { ...input, id: categoryId }
      : category));
  },

  delete: (categoryId: string): CategoryResponse[] => {
    const categories = demoCategoryService.getAll();
    if (!categories.some((category) => category.id === categoryId)) {
      throw new Error('Không tìm thấy danh mục cần xóa.');
    }
    if (categories.some((category) => category.parentId === categoryId)) {
      throw new Error('Hãy xóa hoặc chuyển các danh mục con trước.');
    }
    return save(categories.filter((category) => category.id !== categoryId));
  },
};
