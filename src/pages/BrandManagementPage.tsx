import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { AlertCircle, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import {
  catalogService,
  type BrandMutation,
  type BrandResponse,
} from '../services/catalogService';
import { demoBrandService } from '../services/demoBrandService';

const emptyBrand: BrandMutation = { name: '' };

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
};

export function BrandManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isDemo = !token;
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BrandMutation>(emptyBrand);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BrandResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const loadKey = isDemo ? 'demo' : 'account';
  const isLoading = loadedKey !== loadKey;

  useEffect(() => {
    let active = true;
    const request = token
      ? catalogService.getBrands(token)
      : Promise.resolve().then(() => demoBrandService.getAll());

    request
      .then((data) => {
        if (!active) return;
        setBrands(data);
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
  }, [token, loadKey]);

  const visibleBrands = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return normalizedSearch
      ? brands.filter((brand) => brand.name.toLocaleLowerCase().includes(normalizedSearch))
      : brands;
  }, [brands, search]);

  const refreshBrands = async () => {
    const data = token ? await catalogService.getBrands(token) : demoBrandService.getAll();
    setBrands(data);
  };

  const openCreateForm = () => {
    setEditingBrandId(null);
    setFormData(emptyBrand);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (brand: BrandResponse) => {
    setEditingBrandId(brand.id);
    setFormData({ name: brand.name });
    setFormError(null);
    setIsFormOpen(true);
  };

  const submitBrand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      setFormError('Vui lòng nhập tên thương hiệu.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setError(null);
    setNotice(null);
    try {
      if (token) {
        if (editingBrandId) {
          await catalogService.updateBrand(token, editingBrandId, { name });
        } else {
          await catalogService.createBrand(token, { name });
        }
      } else if (editingBrandId) {
        demoBrandService.update(editingBrandId, { name });
      } else {
        demoBrandService.create({ name });
      }

      setIsFormOpen(false);
      setNotice(editingBrandId ? 'Đã cập nhật thương hiệu.' : 'Đã thêm thương hiệu.');
      try {
        await refreshBrands();
      } catch (refreshError: unknown) {
        setError(`Đã lưu thương hiệu nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (saveError: unknown) {
      setFormError(getApiError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBrand = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    setNotice(null);
    try {
      if (token) {
        await catalogService.deleteBrand(token, deleteTarget.id);
      } else {
        demoBrandService.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      setNotice('Đã xóa thương hiệu.');
      try {
        await refreshBrands();
      } catch (refreshError: unknown) {
        setError(`Đã xóa thương hiệu nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (deleteError: unknown) {
      setError(getApiError(deleteError));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-extrabold">Quản lý thương hiệu</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý các thương hiệu được sử dụng để phân loại sản phẩm.</p>
          </div>
          <button type="button" onClick={openCreateForm} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Thêm thương hiệu
          </button>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: thương hiệu và thay đổi chỉ được lưu trên trình duyệt này, không gửi lên máy chủ.
          </p>
        )}
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Danh sách thương hiệu</h2>
                <p className="mt-0.5 text-xs text-slate-500">{brands.length} thương hiệu</p>
              </div>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm thương hiệu..."
                aria-label="Tìm thương hiệu"
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5" aria-label="Đang tải thương hiệu">
              {[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : visibleBrands.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Tag className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 font-semibold">{error ? 'Chưa thể tải thương hiệu' : 'Không tìm thấy thương hiệu'}</h3>
              <p className="mt-1 text-sm text-slate-500">{error ? 'Kiểm tra kết nối hoặc quyền quản trị rồi thử lại.' : 'Thử từ khóa khác hoặc thêm thương hiệu mới.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Thương hiệu</th>
                    <th scope="col" className="px-5 py-3">Mã</th>
                    <th scope="col" className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleBrands.map((brand) => (
                    <tr key={brand.id} className="transition hover:bg-blue-50/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-sm font-extrabold text-blue-700">
                            {brand.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{brand.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openEditForm(brand)} aria-label={`Sửa ${brand.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(brand)} aria-label={`Xóa ${brand.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
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
          <section role="dialog" aria-modal="true" aria-labelledby="brand-form-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="brand-form-title" className="text-lg font-bold">{editingBrandId ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu'}</h2>
                <p className="mt-1 text-sm text-slate-500">Nhập tên thương hiệu cần quản lý.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitBrand} className="mt-5">
              <label className="block text-sm font-semibold">Tên thương hiệu <span className="text-red-500">*</span>
                <input
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(event) => setFormData({ name: event.target.value })}
                  placeholder="Ví dụ: Apple"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {formError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {isSaving ? 'Đang lưu...' : 'Lưu thương hiệu'}
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
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-brand-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-brand-title" className="text-lg font-bold">Xóa thương hiệu này?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{deleteTarget.name}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Nếu thương hiệu đang được sản phẩm sử dụng, máy chủ có thể từ chối yêu cầu xóa.</p>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} aria-label="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Giữ lại
              </button>
              <button type="button" onClick={deleteBrand} disabled={isDeleting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? 'Đang xóa...' : 'Xóa thương hiệu'}
                {!isDeleting && <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
