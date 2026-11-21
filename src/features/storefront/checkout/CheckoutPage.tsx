import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AddressDivisionFields } from '../../../shared/components/AddressDivisionFields';
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  MapPin,
  PackageCheck,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import type { CartItemResponse } from '../../../shared/api/endpoints/cartApi';
import { getAccountCart, getCurrentAccessToken, notifyCartUpdated } from '../../../services/cartService';
import { retryWithRefreshedSession } from '../../../services/authService';
import {
  checkoutService,
  type CheckoutRequest,
  type NewShippingAddress,
  type PaymentMethod,
  type ShippingFeeRequest,
  type ShippingFeeResponse,
  type ShippingAddress,
} from '../../../services/checkoutService';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const emptyAddress: NewShippingAddress = {
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  streetAddress: '',
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message ||
      (error.response ? `Yêu cầu chưa hoàn tất (HTTP ${error.response.status}). Vui lòng thử lại.` : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
  }
  return 'Không thể kết nối đến dịch vụ đặt hàng. Vui lòng thử lại.';
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [cartLoadedForToken, setCartLoadedForToken] = useState<string | null>(null);
  const token = getCurrentAccessToken();
  const requiresLoginToCheckout = !token;
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [newAddress, setNewAddress] = useState<NewShippingAddress>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [notes, setNotes] = useState('');
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState<string | null>(null);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [shippingQuote, setShippingQuote] = useState<ShippingFeeResponse | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);
  const [addressesLoadedForToken, setAddressesLoadedForToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartSubtotal;
  const isLoadingCart = Boolean(token) && cartLoadedForToken !== token;
  const isLoadingAddresses =
    Boolean(token) && addressesLoadedForToken !== token;

  useEffect(() => {
    if (!token) return;

    let active = true;
    retryWithRefreshedSession(token, (validToken) => getAccountCart(validToken))
      .then((cart) => {
        if (!active) return;
        setCartItems(cart.items);
        setCartSubtotal(cart.subtotal);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setCartLoadedForToken(token);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || cartLoadedForToken !== token || cartItems.length === 0) {
      setShippingQuote(null);
      setIsCalculatingShipping(false);
      setShippingFeeError(null);
      return;
    }

    let request: ShippingFeeRequest | null = null;
    if (!useNewAddress && selectedAddressId) {
      request = {
        addressId: selectedAddressId,
        shippingAddress: null,
        note: notes.trim(),
      };
    } else if (useNewAddress) {
      const hasAddressNames = [
        newAddress.recipientName,
        newAddress.phone,
        newAddress.province,
        newAddress.district,
        newAddress.ward,
        newAddress.streetAddress,
      ].every((value) => value.trim());
      const hasDivisionCodes = Boolean(newAddress.provinceCode && newAddress.districtCode && newAddress.wardCode);

      if (hasAddressNames && hasDivisionCodes) {
        request = {
          addressId: null,
          shippingAddress: {
            receiverName: newAddress.recipientName.trim(),
            receiverPhone: newAddress.phone.trim(),
            province: newAddress.province.trim(),
            provinceCode: newAddress.provinceCode!,
            district: newAddress.district.trim(),
            districtCode: newAddress.districtCode!,
            ward: newAddress.ward.trim(),
            wardCode: newAddress.wardCode!,
            addressLine: newAddress.streetAddress.trim(),
          },
          note: notes.trim(),
        };
      }
    }

    if (!request) {
      setShippingQuote(null);
      setIsCalculatingShipping(false);
      setShippingFeeError(null);
      return;
    }

    let active = true;
    setShippingQuote(null);
    setIsCalculatingShipping(true);
    setShippingFeeError(null);
    const timeoutId = window.setTimeout(() => {
      retryWithRefreshedSession(token, (validToken) => checkoutService.calculateShippingFee(validToken, request!))
        .then((quote) => {
          if (active) setShippingQuote(quote);
        })
        .catch((requestError: unknown) => {
          if (active) setShippingFeeError(getApiError(requestError));
        })
        .finally(() => {
          if (active) setIsCalculatingShipping(false);
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    token,
    cartLoadedForToken,
    cartItems.length,
    useNewAddress,
    selectedAddressId,
    newAddress,
    notes,
  ]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    retryWithRefreshedSession(token, (validToken) => checkoutService.getAddresses(validToken))
      .then((data) => {
        if (!active) return;
        setAddresses(data);
        const defaultAddress = data.find((address) => address.isDefault) ?? data[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setAddressesLoadedForToken(token);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const updateNewAddress = (field: keyof NewShippingAddress, value: string) => {
    setNewAddress((current) => ({ ...current, [field]: value }));
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!pendingPaymentOrderId) {
      if (cartItems.length === 0) {
        setError('Giỏ hàng đang trống.');
        return;
      }
      if (!useNewAddress && !selectedAddressId) {
        setError('Vui lòng chọn địa chỉ nhận hàng.');
        return;
      }
      const requiredAddressFields = [
        newAddress.recipientName,
        newAddress.phone,
        newAddress.province,
        newAddress.district,
        newAddress.ward,
        newAddress.streetAddress,
      ];
      if (useNewAddress && requiredAddressFields.some((value) => !value.trim())) {
        setError('Vui lòng nhập đầy đủ thông tin địa chỉ nhận hàng.');
        return;
      }
      if (useNewAddress && (!newAddress.provinceCode || !newAddress.districtCode || !newAddress.wardCode)) {
        setError('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã.');
        return;
      }
      if (!shippingQuote) {
        setError('Vui lòng chờ tính phí giao hàng trước khi đặt hàng.');
        return;
      }
    }

    if (!token) {
      setError('Vui lòng đăng nhập để đặt hàng bằng giỏ hàng của tài khoản.');
      return;
    }

    setIsSubmitting(true);
    let createdOrderId = pendingPaymentOrderId;
    try {
      let orderId = pendingPaymentOrderId;
      if (!orderId) {
        const payload: CheckoutRequest = {
          addressId: useNewAddress ? null : selectedAddressId,
          shippingAddress: useNewAddress ? {
            receiverName: newAddress.recipientName.trim(),
            receiverPhone: newAddress.phone.trim(),
            province: newAddress.province.trim(),
            provinceCode: newAddress.provinceCode!,
            district: newAddress.district.trim(),
            districtCode: newAddress.districtCode!,
            ward: newAddress.ward.trim(),
            wardCode: newAddress.wardCode!,
            addressLine: newAddress.streetAddress.trim(),
          } : null,
          note: notes.trim() || null,
        };

        const order = await retryWithRefreshedSession(token, (validToken) => checkoutService.checkout(validToken, payload));
        orderId = order.id || order.orderId || null;
        if (!orderId) {
          throw new Error('API đặt hàng không trả về mã đơn hàng.');
        }
        createdOrderId = orderId;
        setPendingPaymentOrderId(orderId);
        // The backend clears its cart when it creates the order.
        notifyCartUpdated();
      }

      const payment = await retryWithRefreshedSession(token, (validToken) =>
        checkoutService.initiatePayment(validToken, orderId!, paymentMethod));

      if (paymentMethod === 'VNPAY') {
        if (!payment.paymentUrl) {
          throw new Error('API thanh toán không trả về liên kết thanh toán.');
        }
        setCartItems([]);
        setCartSubtotal(0);
        setShippingQuote(null);
        setPendingPaymentOrderId(null);
        notifyCartUpdated();
        window.location.assign(payment.paymentUrl);
        return;
      }

      setCartItems([]);
      setCartSubtotal(0);
      setShippingQuote(null);
      setPendingPaymentOrderId(null);
      notifyCartUpdated();
      navigate(`/orders/${encodeURIComponent(orderId)}`, { replace: true });
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError)
        ? getApiError(requestError)
        : requestError instanceof Error
          ? requestError.message
          : getApiError(requestError);
      setError(createdOrderId
        ? `Đơn hàng ${createdOrderId} đã được tạo, nhưng chưa khởi tạo được thanh toán: ${message} Bấm thử lại để tiếp tục thanh toán cho đơn này.`
        : message);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (requiresLoginToCheckout) {
    return (
      <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#f5f7fb] px-4 py-12 text-slate-900">
        <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <PackageCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-xl font-extrabold">Đăng nhập để hoàn tất đơn hàng</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Đăng nhập để tải giỏ hàng tài khoản và tiếp tục đặt hàng.</p>
          <Link to="/login?returnUrl=%2Fcheckout" className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white">
            Đăng nhập
          </Link>
        </section>
      </main>
    );
  }

  if (isLoadingCart || (token && cartLoadedForToken !== token)) {
    return <main className="min-h-[calc(100vh-7rem)] animate-pulse bg-[#f5f7fb] p-8"><div className="mx-auto h-96 max-w-5xl rounded-2xl bg-white" /></main>;
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <PackageCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-xl font-bold">Chưa có sản phẩm để thanh toán</h1>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <p className="mt-2 text-sm text-slate-500">Hãy thêm sản phẩm vào giỏ hàng trước khi tiếp tục.</p>
          <Link to="/cart" className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white">
            Về giỏ hàng
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 pb-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Quay lại giỏ hàng
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold">Đặt hàng & Thanh toán</h1>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submitCheckout} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold">Địa chỉ nhận hàng</h2>
            <p className="text-xs text-slate-500">Phí giao hàng sẽ được tính tự động theo địa chỉ</p>
                </div>
              </div>

              {isLoadingAddresses ? (
                <div className="space-y-3" aria-label="Đang tải địa chỉ">
                  <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                </div>
              ) : (
                <>
                  {addresses.map((address) => (
                    <label key={address.id} className={`mb-3 flex cursor-pointer gap-3 rounded-xl border p-4 ${
                      !useNewAddress && selectedAddressId === address.id ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="shippingAddress"
                        checked={!useNewAddress && selectedAddressId === address.id}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setUseNewAddress(false);
                        }}
                        className="mt-1 accent-blue-600"
                      />
                      <span className="min-w-0 text-sm">
                        <strong>{address.recipientName}</strong> <span className="text-slate-500">· {address.phone}</span>
                        {address.isDefault && <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Mặc định</span>}
                        <span className="mt-1 block text-slate-500">
                          {address.streetAddress}, {address.ward}, {address.district}, {address.province}
                        </span>
                      </span>
                    </label>
                  ))}

                  <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    useNewAddress ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={useNewAddress}
                      onChange={() => {
                        setSelectedAddressId('');
                        setUseNewAddress(true);
                      }}
                      className="mt-1 accent-blue-600"
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <Plus className="h-4 w-4" />
                      Giao đến địa chỉ mới
                    </span>
                  </label>

                  {useNewAddress && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium sm:col-span-2">
                        Tên người nhận
                        <input required value={newAddress.recipientName} onChange={(event) => updateNewAddress('recipientName', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="text-sm font-medium">
                        Số điện thoại
                        <input required type="tel" value={newAddress.phone} onChange={(event) => updateNewAddress('phone', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <AddressDivisionFields
                        address={newAddress}
                        onChange={(divisions) => setNewAddress((current) => ({ ...current, ...divisions }))}
                      />
                      <label className="text-sm font-medium sm:col-span-2">
                        Số nhà, tên đường
                        <input required value={newAddress.streetAddress} onChange={(event) => updateNewAddress('streetAddress', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <p className="text-xs text-slate-500 sm:col-span-2">Địa chỉ mới sẽ được lưu cùng đơn hàng.</p>
                    </div>
                  )}
                  {isCalculatingShipping && <p role="status" className="mt-3 text-sm text-blue-700">Đang tính phí giao hàng…</p>}
                  {shippingQuote && <p role="status" className="mt-3 text-xs text-emerald-700">Đã cập nhật phí giao hàng theo địa chỉ.</p>}
                  {shippingFeeError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Không tính được phí giao hàng: {shippingFeeError}</p>}
                </>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold">Phương thức thanh toán</h2>
                  <p className="text-xs text-slate-500">Chọn phương thức phù hợp</p>
                </div>
              </div>
              <label className={`mb-3 flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'}`}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-blue-600" />
                <span className="flex-1">
                  <strong className="block text-sm">Thanh toán khi nhận hàng (COD)</strong>
                  <span className="mt-1 block text-xs text-slate-500">Thanh toán bằng tiền mặt khi nhận hàng</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === 'VNPAY' ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'}`}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} className="accent-blue-600" />
                <span className="flex-1">
                  <strong className="block text-sm">Thanh toán online (VNPay)</strong>
                  <span className="mt-1 block text-xs text-slate-500">Chuyển đến cổng thanh toán bảo mật sau khi đặt hàng</span>
                </span>
              </label>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <label className="text-sm font-medium">
                Ghi chú đơn hàng (tùy chọn)
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-36">
            <h2 className="font-bold">Đơn hàng của bạn</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {cartItems.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <PackageCheck className="h-7 w-7 text-blue-600" />}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <strong className="line-clamp-2 text-slate-800">{item.productName || item.variantName}</strong>
                    {item.productName && item.variantName && <p className="mt-1 text-slate-500">{item.variantName}</p>}
                    <p className="mt-1 text-slate-500">SKU: {item.sku} · SL {item.quantity}</p>
                    <p className="mt-1 font-bold text-slate-700">{formatCurrency(item.lineTotal ?? item.price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(shippingQuote?.subtotal ?? subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{isCalculatingShipping ? 'Đang tính…' : shippingQuote ? formatCurrency(shippingQuote.shippingFee) : 'Chọn địa chỉ để tính'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 font-bold">
                <span>Tổng cộng</span>
                <span className="text-lg text-red-600">{shippingQuote ? formatCurrency(shippingQuote.grandTotal) : '—'}</span>
              </div>
              {shippingQuote?.includesCodFee && <p className="text-xs text-slate-500">Tổng tiền đã bao gồm phí COD.</p>}
            </div>

            <button type="submit" disabled={isLoadingAddresses || isLoadingCart || isSubmitting || isCalculatingShipping || (!pendingPaymentOrderId && !shippingQuote)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1b64c7] text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              <PackageCheck className="h-4 w-4" />
              {isSubmitting ? 'Đang xử lý...' : pendingPaymentOrderId ? 'Thử thanh toán lại' : 'Đặt hàng'}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Thông tin được bảo vệ an toàn
            </p>
          </aside>
        </form>

        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
          <Truck className="h-4 w-4 text-blue-600" />
          Đơn hàng sẽ được giao đến địa chỉ bạn đã chọn.
        </div>
      </div>
    </main>
  );
}
