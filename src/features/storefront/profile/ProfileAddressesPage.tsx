import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AddressDivisionFields } from '../../../shared/components/AddressDivisionFields';
import { AccountSidebar } from '../../../shared/layouts/AccountSidebar';
import {
  AlertCircle,
  Check,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { authService, clearAuthSession, isUnauthorized, retryWithRefreshedSession } from '../../../services/authService';
import {
  checkoutService,
  type NewShippingAddress,
  type ShippingAddress,
} from '../../../services/checkoutService';
import { demoAddressService } from '../../../services/demoAddressService';

const emptyAddress: NewShippingAddress = {
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  streetAddress: '',
  isDefault: false,
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string; errors?: Record<string, string[]> }>(error)) {
    const validation = Object.values(error.response?.data?.errors ?? {}).flat().join(' ');
    return validation || error.response?.data?.detail || error.response?.data?.message || (error.response
      ? `Máy chủ trả về lỗi ${error.response.status}. Vui lòng thử lại.`
      : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
};

const toAddressForm = (address: ShippingAddress): NewShippingAddress => ({
  recipientName: address.recipientName,
  phone: address.phone,
  province: address.province,
  provinceCode: address.provinceCode,
  district: address.district,
  districtCode: address.districtCode,
  ward: address.ward,
  wardCode: address.wardCode,
  streetAddress: address.streetAddress,
  isDefault: Boolean(address.isDefault),
});

export function ProfileAddressesPage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  const isDemo = !token;
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewShippingAddress>(emptyAddress);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShippingAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = token
      ? retryWithRefreshedSession(token, async (validToken) => {
        await authService.getCurrentUser(validToken);
        return checkoutService.getAddresses(validToken);
      })
      : Promise.resolve().then(() => demoAddressService.getAll());

    loadProfile
      .then((savedAddresses) => {
        if (!active) return;
        setAddresses(savedAddresses);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isUnauthorized(error)) {
          clearAuthSession();
          navigate('/login', { replace: true });
        } else {
          setPageError(getApiError(error));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, token]);

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setFormData({ ...emptyAddress, isDefault: addresses.length === 0 });
    setFormError(null);
    setShowAddressForm(true);
  };

  const openEditAddressForm = (address: ShippingAddress) => {
    setEditingAddressId(address.id);
    setFormData(toAddressForm(address));
    setFormError(null);
    setShowAddressForm(true);
  };

  const updateFormField = (field: keyof NewShippingAddress, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const reloadAddresses = async () => {
    const savedAddresses = token
      ? await checkoutService.getAddresses(token)
      : demoAddressService.getAll();
    setAddresses(savedAddresses);
  };

  const submitAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredDivisions = token
      ? [formData.provinceCode, formData.districtCode, formData.wardCode]
      : [formData.province, formData.district, formData.ward];
    if (requiredDivisions.some((value) => !value?.trim())) {
      setFormError('Vui lòng chọn đủ tỉnh/thành phố, quận/huyện và phường/xã.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    setPageError(null);
    setSuccessMessage(null);

    try {
      if (token) {
        if (editingAddressId) {
          await checkoutService.updateAddress(token, editingAddressId, formData);
        } else {
          await checkoutService.createAddress(token, formData);
        }
      } else if (editingAddressId) {
        demoAddressService.update(editingAddressId, formData);
      } else {
        demoAddressService.create(formData);
      }

      setShowAddressForm(false);
      setEditingAddressId(null);
      setSuccessMessage(editingAddressId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.');
      try {
        await reloadAddresses();
      } catch (refreshError: unknown) {
        setPageError(`Đã lưu địa chỉ nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (saveError: unknown) {
      setFormError(getApiError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAddress = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setPageError(null);
    setSuccessMessage(null);
    try {
      if (token) {
        await checkoutService.deleteAddress(token, deleteTarget.id);
      } else {
        demoAddressService.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      setSuccessMessage('Đã xóa địa chỉ.');
      try {
        await reloadAddresses();
      } catch (refreshError: unknown) {
        setPageError(`Đã xóa địa chỉ nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (deleteError: unknown) {
      setPageError(getApiError(deleteError));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const setDefaultAddress = async (address: ShippingAddress) => {
    const payload = { ...toAddressForm(address), isDefault: true };
    setPageError(null);
    setSuccessMessage(null);
    try {
      if (token) {
        await checkoutService.updateAddress(token, address.id, payload);
        await reloadAddresses();
      } else {
        setAddresses(demoAddressService.update(address.id, payload));
      }
      setSuccessMessage('Đã cập nhật địa chỉ mặc định.');
    } catch (updateError: unknown) {
      setPageError(getApiError(updateError));
    }
  };

  const fullAddress = (address: ShippingAddress) =>
    `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`;

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-slate-50/70 px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Tài khoản của bạn</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-[28px]">Hồ sơ cá nhân & sổ địa chỉ</h1>
            <p className="mt-1.5 text-sm text-slate-500">Quản lý thông tin tài khoản và địa chỉ nhận hàng.</p>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm sm:inline-flex">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            {addresses.length} địa chỉ đã lưu
          </span>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Bạn đang xem chế độ demo. Hồ sơ mẫu và thay đổi sổ địa chỉ được lưu trên trình duyệt này, không gửi lên máy chủ.
          </p>
        )}
        {pageError && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{pageError}</span>
          </div>
        )}
        {successMessage && (
          <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </p>
        )}

        {isLoading ? (
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]" aria-label="Đang tải hồ sơ">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <AccountSidebar />
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Sổ địa chỉ nhận hàng</h2>
                  <p className="mt-1 text-xs text-slate-500">Chọn địa chỉ giao hàng nhanh khi thanh toán.</p>
                </div>
                <button type="button" onClick={openNewAddressForm} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <Plus className="h-4 w-4" />
                  Thêm địa chỉ
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="m-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-14 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MapPin className="h-6 w-6" />
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900">Bạn chưa lưu địa chỉ nào</h3>
                  <p className="mt-1.5 text-sm text-slate-500">Thêm địa chỉ để thanh toán nhanh hơn ở lần mua tiếp theo.</p>
                </div>
              ) : (
                <div className="grid gap-3 p-5 sm:p-6">
                  {addresses.map((address) => (
                    <article key={address.id} className={`rounded-xl border p-4 transition sm:p-5 ${address.isDefault ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950">{address.recipientName}</h3>
                            {address.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                <Star className="h-3 w-3 fill-current" />
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {address.phone}
                          </p>
                          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="break-words">{fullAddress(address)}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                          {!address.isDefault && (
                            <button type="button" onClick={() => setDefaultAddress(address)} className="h-9 rounded-lg px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                              Đặt mặc định
                            </button>
                          )}
                          <button type="button" onClick={() => openEditAddressForm(address)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                            <Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(address)} aria-label={`Xóa địa chỉ của ${address.recipientName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {showAddressForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setShowAddressForm(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="address-form-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="address-form-title" className="text-lg font-bold">{editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h2>
                <p className="mt-1 text-sm text-slate-500">Nhập đầy đủ thông tin người nhận và địa chỉ giao hàng.</p>
              </div>
              <button type="button" onClick={() => setShowAddressForm(false)} disabled={isSaving} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitAddress} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">Tên người nhận
                  <input required value={formData.recipientName} onChange={(event) => updateFormField('recipientName', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="text-sm font-semibold">Số điện thoại
                  <input required type="tel" pattern="[0-9+(). -]{9,18}" value={formData.phone} onChange={(event) => updateFormField('phone', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <AddressDivisionFields
                  address={formData}
                  onChange={(divisions) => setFormData((current) => ({ ...current, ...divisions }))}
                />
                <label className="text-sm font-semibold sm:col-span-2">Số nhà, tên đường
                  <input required value={formData.streetAddress} onChange={(event) => updateFormField('streetAddress', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(formData.isDefault)} onChange={(event) => updateFormField('isDefault', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Đặt làm địa chỉ mặc định
              </label>
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowAddressForm(false)} disabled={isSaving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Đóng
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {isSaving ? 'Đang lưu...' : 'Lưu địa chỉ'}
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
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-address-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-address-title" className="text-lg font-bold">Xóa địa chỉ này?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{deleteTarget.recipientName} · {fullAddress(deleteTarget)}</p>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} aria-label="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Giữ lại
              </button>
              <button type="button" onClick={deleteAddress} disabled={isDeleting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? 'Đang xóa...' : 'Xóa địa chỉ'}
                {!isDeleting && <Check className="h-4 w-4" />}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
