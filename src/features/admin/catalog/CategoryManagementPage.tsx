import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ChevronDown,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  catalogService,
  type CategoryMutation,
  type CategoryResponse,
} from '../../../services/catalogService';
import { demoCategoryService } from '../../../services/demoCategoryService';
import { shouldUseDemoServices } from '../../../shared/api/serviceMode';

interface CategoryRow {
  category: CategoryResponse;
  depth: number;
  childCount: number;
}

const emptyCategory: CategoryMutation = {
  name: '',
  description: '',
  parentId: null,
};

const flattenCategoryResponse = (categories: CategoryResponse[]) => {
  const flattened = new Map<string, CategoryResponse>();
  const visit = (items: CategoryResponse[], parentId?: string | null) => {
    items.forEach((item) => {
      const { children, ...category } = item;
      flattened.set(item.id, {
        ...category,
        parentId: item.parentId ?? parentId ?? null,
      });
      if (children?.length) visit(children, item.id);
    });
  };
  visit(categories);
  return [...flattened.values()];
};

const buildCategoryRows = (categories: CategoryResponse[]): CategoryRow[] => {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const childrenByParent = new Map<string, CategoryResponse[]>();
  categories.forEach((category) => {
    if (!category.parentId || !byId.has(category.parentId)) return;
    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category);
    childrenByParent.set(category.parentId, children);
  });

  const rows: CategoryRow[] = [];
  const visited = new Set<string>();
  const visit = (category: CategoryResponse, depth: number) => {
    if (visited.has(category.id)) return;
    visited.add(category.id);
    const children = childrenByParent.get(category.id) ?? [];
    rows.push({ category, depth, childCount: children.length });
    children.forEach((child) => visit(child, depth + 1));
  };

  categories
    .filter((category) => !category.parentId || !byId.has(category.parentId))
    .forEach((category) => visit(category, 0));
  categories.forEach((category) => visit(category, 0));
  return rows;
};

const getDescendantIds = (categories: CategoryResponse[], categoryId: string): Set<string> => {
  const descendants = new Set<string>();
  const pending = [categoryId];
  while (pending.length > 0) {
    const parentId = pending.pop();
    categories.forEach((category) => {
      if (category.parentId === parentId && !descendants.has(category.id)) {
        descendants.add(category.id);
        pending.push(category.id);
      }
    });
  }
  return descendants;
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
};

export function CategoryManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const isDemo = shouldUseDemoServices(token);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryMutation>(emptyCategory);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadKey = isDemo ? 'demo' : 'account';
  const isLoading = loadedKey !== loadKey;

  useEffect(() => {
    let active = true;
    const request = isDemo
      ? Promise.resolve().then(() => demoCategoryService.getAll())
      : catalogService.getCategories(token);

    request
      .then((data) => {
        if (!active) return;
        setCategories(flattenCategoryResponse(data));
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setLoadedKey(loadKey);
      });

    return () => {
      active = false;
    };
  }, [token, isDemo, loadKey]);

  const rows = useMemo(() => buildCategoryRows(categories), [categories]);
  const parentNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleRows = rows.filter(({ category }) =>
    !normalizedSearch ||
    category.name.toLocaleLowerCase().includes(normalizedSearch) ||
    category.description?.toLocaleLowerCase().includes(normalizedSearch) ||
    parentNameById.get(category.parentId ?? '')?.toLocaleLowerCase().includes(normalizedSearch),
  );
  const rootCount = categories.filter((category) => !category.parentId || !parentNameById.has(category.parentId)).length;
  const excludedParentIds = editingCategoryId
    ? new Set([editingCategoryId, ...getDescendantIds(categories, editingCategoryId)])
    : new Set<string>();
  const parentOptions = rows.filter(({ category }) => !excludedParentIds.has(category.id));

  const refreshCategories = async () => {
    const data = isDemo ? demoCategoryService.getAll() : await catalogService.getCategories(token);
    setCategories(flattenCategoryResponse(data));
  };

  const openCreateForm = () => {
    setEditingCategoryId(null);
    setFormData(emptyCategory);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category: CategoryResponse) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? null,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const updateFormField = (field: keyof CategoryMutation, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formData.name.trim();
    if (!name || name.length > 100) {
      setFormError('Tên danh mục phải có từ 1 đến 100 ký tự.');
      return;
    }

    const payload: CategoryMutation = {
      name,
      description: formData.description?.trim() || undefined,
      parentId: formData.parentId || null,
    };
    if (editingCategoryId && excludedParentIds.has(payload.parentId ?? '')) {
      setFormError('Không thể chọn chính danh mục này hoặc danh mục con làm danh mục cha.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setError(null);
    setNotice(null);
    try {
      if (!isDemo) {
        if (editingCategoryId) {
          await catalogService.updateCategory(token, editingCategoryId, payload);
        } else {
          await catalogService.createCategory(token, payload);
        }
      } else if (editingCategoryId) {
        demoCategoryService.update(editingCategoryId, payload);
      } else {
        demoCategoryService.create(payload);
      }

      setIsFormOpen(false);
      setNotice(editingCategoryId ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.');
      try {
        await refreshCategories();
      } catch (refreshError: unknown) {
        setError(`Đã lưu danh mục nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (saveError: unknown) {
      setFormError(getApiError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    setNotice(null);
    try {
      if (!isDemo) {
        await catalogService.deleteCategory(token, deleteTarget.id);
      } else {
        demoCategoryService.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      setNotice('Đã xóa danh mục.');
      try {
        await refreshCategories();
      } catch (refreshError: unknown) {
        setError(`Đã xóa danh mục nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (deleteError: unknown) {
      setError(getApiError(deleteError));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-68px)] bg-[#f5f7fb] px-6 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-black">Quản lý danh mục</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo cấu trúc danh mục cha – con cho sản phẩm.</p>
          </div>
          <button type="button" onClick={openCreateForm} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Thêm danh mục
          </button>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: danh mục và thay đổi chỉ được lưu trên trình duyệt này, không gửi lên máy chủ.
          </p>
        )}
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>
        )}

        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Tổng danh mục</p>
            <p className="mt-1 text-2xl font-extrabold">{categories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Danh mục gốc</p>
            <p className="mt-1 text-2xl font-extrabold">{rootCount}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-bold">Cấu trúc danh mục</h2>
              <p className="mt-1 text-xs text-slate-500">Danh mục cha và danh mục con được hiển thị theo cấp bậc.</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm danh mục..."
                aria-label="Tìm danh mục"
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5" aria-label="Đang tải danh mục">
              {[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <FolderTree className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 font-semibold">{error ? 'Chưa thể tải danh mục' : 'Không tìm thấy danh mục'}</h3>
              <p className="mt-1 text-sm text-slate-500">{error ? 'Kiểm tra kết nối hoặc quyền quản trị rồi thử lại.' : 'Thử từ khóa khác hoặc thêm danh mục mới.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Tên danh mục</th>
                    <th scope="col" className="px-5 py-3">Mô tả</th>
                    <th scope="col" className="px-5 py-3">Danh mục cha</th>
                    <th scope="col" className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map(({ category, depth, childCount }) => (
                    <tr key={category.id} className="transition hover:bg-blue-50/40">
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                          {depth > 0 && <span aria-hidden="true" className="mr-1 h-5 w-px bg-slate-300" />}
                          <FolderTree className={`h-4 w-4 shrink-0 ${depth ? 'text-slate-400' : 'text-blue-600'}`} />
                          <span className="truncate text-sm font-semibold">{category.name}</span>
                          {childCount > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{childCount} con</span>}
                        </div>
                      </td>
                      <td className="max-w-sm px-5 py-4 text-sm text-slate-500">{category.description || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{category.parentId ? parentNameById.get(category.parentId) || 'Không rõ' : 'Danh mục gốc'}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openEditForm(category)} aria-label={`Sửa ${category.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(category)} aria-label={`Xóa ${category.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="category-form-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="category-form-title" className="text-lg font-bold">{editingCategoryId ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h2>
                <p className="mt-1 text-sm text-slate-500">Thiết lập tên, mô tả và cấp danh mục.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitCategory} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">Tên danh mục <span className="text-red-500">*</span>
                <input
                  required
                  minLength={1}
                  maxLength={100}
                  value={formData.name}
                  onChange={(event) => updateFormField('name', event.target.value)}
                  placeholder="Ví dụ: Điện thoại"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-semibold">Mô tả
                <textarea
                  rows={3}
                  value={formData.description ?? ''}
                  onChange={(event) => updateFormField('description', event.target.value)}
                  placeholder="Mô tả ngắn về danh mục..."
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-sm font-semibold">Danh mục cha
                <span className="relative mt-1.5 block">
                  <select
                    value={formData.parentId ?? ''}
                    onChange={(event) => updateFormField('parentId', event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Không có (danh mục gốc)</option>
                    {parentOptions.map(({ category, depth }) => (
                      <option key={category.id} value={category.id}>{`${'— '.repeat(depth)}${category.name}`}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </span>
              </label>
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {isSaving ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setDeleteTarget(null);
        }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-category-title" className="text-lg font-bold">Xóa danh mục này?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{deleteTarget.name}</p>
                {categories.some((category) => category.parentId === deleteTarget.id) && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">Danh mục đang có danh mục con. Hãy xóa hoặc chuyển các danh mục con trước.</p>
                )}
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} aria-label="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Giữ lại
              </button>
              <button
                type="button"
                onClick={deleteCategory}
                disabled={isDeleting || categories.some((category) => category.parentId === deleteTarget.id)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa danh mục'}
                {!isDeleting && <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
