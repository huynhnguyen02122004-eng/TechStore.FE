import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Check,
  MapPin,
  Mail,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { authService, type UserProfile } from '../services/authService';
import {
  checkoutService,
  type NewShippingAddress,
  type ShippingAddress,
} from '../services/checkoutService';
import { demoAddressService } from '../services/demoAddressService';

const demoProfile: UserProfile = {
  id: 'demo-user',
  fullName: 'Nguyễn Minh Anh',
  email: 'minhanh@example.com',
  phone: '0912345678',
};

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
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
};

const toAddressForm = (address: ShippingAddress): NewShippingAddress => ({
  recipientName: address.recipientName,
  phone: address.phone,
  province: address.province,
  district: address.district,
  ward: address.ward,
  streetAddress: address.streetAddress,
  isDefault: Boolean(address.isDefault),
});

export function ProfileAddressesPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isDemo = !token;
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
      ? Promise.all([authService.getCurrentUser(token), checkoutService.getAddresses(token)])
      : Promise.resolve().then(() => [demoProfile, demoAddressService.getAll()] as const);

    loadProfile
      .then(([user, savedAddresses]) => {
        if (!active) return;
        setProfile(user);
        setAddresses(savedAddresses);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (active) setPageError(getApiError(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

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
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Tài khoản của bạn</p>
          <h1 className="mt-1 text-2xl font-extrabold">Hồ sơ cá nhân & sổ địa chỉ</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý thông tin tài khoản và địa chỉ nhận hàng.</p>
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
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]" aria-label="Đang tải hồ sơ">
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <UserRound className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold">{profile?.fullName || 'Tài khoản'}</h2>
                  {profile?.role && <p className="mt-0.5 text-xs text-slate-500">{profile.role}</p>}
                </div>
              </div>
              <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                <p className="flex items-start gap-2.5 text-slate-600">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="break-all">{profile?.email || 'Chưa cập nhật email'}</span>
                </p>
                <p className="flex items-center gap-2.5 text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>{profile?.phone || 'Chưa cập nhật số điện thoại'}</span>
                </p>
              </div>
              {!isDemo && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Thông tin hồ sơ được đồng bộ từ tài khoản của bạn.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Sổ địa chỉ nhận hàng</h2>
                  <p className="mt-1 text-sm text-slate-500">Bạn có {addresses.length} địa chỉ đã lưu.</p>
                </div>
                <button type="button" onClick={openNewAddressForm} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Thêm địa chỉ
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                  <MapPin className="mx-auto h-9 w-9 text-slate-400" />
                  <h3 className="mt-3 font-semibold">Bạn chưa lưu địa chỉ nào</h3>
                  <p className="mt-1 text-sm text-slate-500">Thêm địa chỉ để thanh toán nhanh hơn ở lần mua tiếp theo.</p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {addresses.map((address) => (
                    <article key={address.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{address.recipientName}</h3>
                            {address.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                <Star className="h-3 w-3 fill-current" />
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {address.phone}
                          </p>
                          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                            <span>{fullAddress(address)}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                <label className="text-sm font-semibold">Tỉnh / Thành phố
                  <input required value={formData.province} onChange={(event) => updateFormField('province', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="text-sm font-semibold">Quận / Huyện
                  <input required value={formData.district} onChange={(event) => updateFormField('district', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="text-sm font-semibold">Phường / Xã
                  <input required value={formData.ward} onChange={(event) => updateFormField('ward', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
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
