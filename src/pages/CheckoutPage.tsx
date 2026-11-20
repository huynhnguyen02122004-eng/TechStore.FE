import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { demoCartService, type DemoCartItem } from '../services/demoCartService';
import {
  checkoutService,
  type CheckoutRequest,
  type NewShippingAddress,
  type ShippingAddress,
} from '../services/checkoutService';
import { demoOrderService } from '../services/demoOrderService';
import { demoAddressService } from '../services/demoAddressService';

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
    return error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất. Vui lòng thử lại.';
  }
  return 'Không thể kết nối đến dịch vụ đặt hàng. Vui lòng thử lại.';
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems] = useState<DemoCartItem[]>(() => demoCartService.getItems());
  const isDemoCheckout = cartItems.length > 0 && cartItems.every((item) => item.productId === 'mock-iphone');
  const [demoAddresses] = useState(() => isDemoCheckout ? demoAddressService.getAll() : []);
  const [addresses, setAddresses] = useState<ShippingAddress[]>(demoAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    demoAddresses.find((address) => address.isDefault)?.id ?? '',
  );
  const [useNewAddress, setUseNewAddress] = useState(!isDemoCheckout);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [newAddress, setNewAddress] = useState<NewShippingAddress>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<1 | 2>(1);
  const [addressesLoadedForToken, setAddressesLoadedForToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems],
  );
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isLoadingAddresses =
    Boolean(token) && !isDemoCheckout && addressesLoadedForToken !== token;

  useEffect(() => {
    if (isDemoCheckout || !token) return;

    let active = true;
    checkoutService
      .getAddresses(token)
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
  }, [isDemoCheckout, token]);

  const updateNewAddress = (field: keyof NewShippingAddress, value: string) => {
    setNewAddress((current) => ({ ...current, [field]: value }));
  };

  const submitCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (cartItems.length === 0) {
      setError('Giỏ hàng đang trống.');
      return;
    }
    if (!useNewAddress && !selectedAddressId) {
      setError('Vui lòng chọn địa chỉ nhận hàng.');
      return;
    }
    if (useNewAddress && Object.values(newAddress).some((value) => !value.trim())) {
      setError('Vui lòng nhập đầy đủ thông tin địa chỉ nhận hàng.');
      return;
    }

    if (isDemoCheckout) {
      if (paymentMethod === 2) {
        setError('Thanh toán VNPay không khả dụng trong chế độ demo.');
        return;
      }
      const demoOrderId = `DEMO-${Date.now()}`;
      const selectedAddress = useNewAddress
        ? { id: 'demo-address-new', ...newAddress }
        : addresses.find((address) => address.id === selectedAddressId);
      if (!selectedAddress) {
        setError('Không tìm thấy địa chỉ nhận hàng đã chọn.');
        return;
      }

      demoOrderService.save({
        payment: {
          status: 'PENDING',
          paymentReference: `PAY-COD-${demoOrderId}`,
        },
        order: {
          id: demoOrderId,
          orderCode: demoOrderId,
          status: 'PENDING_PAYMENT',
          createdAt: new Date().toISOString(),
          subtotal,
          shippingFee: 0,
          discount: 0,
          grandTotal: subtotal,
          shippingAddress: selectedAddress,
          items: cartItems.map((item) => ({
            id: item.variantId,
            productName: item.productName,
            sku: item.sku,
            imageUrl: item.imageUrl,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.unitPrice * item.quantity,
          })),
        },
      });
      demoCartService.clear();
      navigate(`/checkout/result?orderId=${encodeURIComponent(demoOrderId)}`);
      return;
    }

    if (!token) {
      setError('Vui lòng đăng nhập trước khi đặt hàng.');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload: CheckoutRequest;
      if (useNewAddress && saveNewAddress) {
        const savedAddress = await checkoutService.createAddress(token, newAddress);
        payload = { shippingAddressId: savedAddress.id, paymentMethod };
      } else if (useNewAddress) {
        payload = { newShippingAddress: newAddress, paymentMethod };
      } else {
        payload = { shippingAddressId: selectedAddressId, paymentMethod };
      }

      const order = await checkoutService.checkout(token, payload);
      const orderId = order.orderId || order.id;
      if (!orderId) {
        throw new Error('API đặt hàng không trả về mã đơn hàng.');
      }

      if (paymentMethod === 2) {
        const payment = await checkoutService.initiatePayment(token, orderId);
        if (!payment.paymentUrl) {
          throw new Error('API thanh toán không trả về liên kết thanh toán.');
        }
        window.location.assign(payment.paymentUrl);
        return;
      }

      navigate(`/checkout/result?orderId=${encodeURIComponent(orderId)}`);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : getApiError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <PackageCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-xl font-bold">Chưa có sản phẩm để thanh toán</h1>
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

        {isDemoCheckout && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: thông tin địa chỉ và đơn hàng chỉ dùng để xem thử giao diện, không gửi lên máy chủ.
          </p>
        )}

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
                  <p className="text-xs text-slate-500">Chọn địa chỉ hoặc nhập địa chỉ mới</p>
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
                      onChange={() => setUseNewAddress(true)}
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
                      <label className="text-sm font-medium">
                        Tỉnh / Thành phố
                        <input required value={newAddress.province} onChange={(event) => updateNewAddress('province', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="text-sm font-medium">
                        Quận / Huyện
                        <input required value={newAddress.district} onChange={(event) => updateNewAddress('district', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="text-sm font-medium">
                        Phường / Xã
                        <input required value={newAddress.ward} onChange={(event) => updateNewAddress('ward', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      <label className="text-sm font-medium sm:col-span-2">
                        Số nhà, tên đường
                        <input required value={newAddress.streetAddress} onChange={(event) => updateNewAddress('streetAddress', event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      {!isDemoCheckout && (
                        <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                          <input type="checkbox" checked={saveNewAddress} onChange={(event) => setSaveNewAddress(event.target.checked)} className="h-4 w-4 accent-blue-600" />
                          Lưu địa chỉ này vào sổ địa chỉ
                        </label>
                      )}
                    </div>
                  )}
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
              <label className={`mb-3 flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === 1 ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'}`}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 1} onChange={() => setPaymentMethod(1)} className="accent-blue-600" />
                <span className="flex-1">
                  <strong className="block text-sm">Thanh toán khi nhận hàng (COD)</strong>
                  <span className="mt-1 block text-xs text-slate-500">Thanh toán bằng tiền mặt khi nhận hàng</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === 2 ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200'}`}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 2} onChange={() => setPaymentMethod(2)} className="accent-blue-600" />
                <span className="flex-1">
                  <strong className="block text-sm">Thanh toán online (VNPay)</strong>
                  <span className="mt-1 block text-xs text-slate-500">Chuyển đến cổng thanh toán bảo mật sau khi đặt hàng</span>
                </span>
              </label>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-36">
            <h2 className="font-bold">Đơn hàng của bạn</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {cartItems.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1">
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <strong className="line-clamp-2 text-slate-800">{item.productName}</strong>
                    <p className="mt-1 text-slate-500">{item.variantLabel} · SL {item.quantity}</p>
                    <p className="mt-1 font-bold text-slate-700">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span className="text-xs">Tính sau khi xác nhận địa chỉ</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 font-bold">
                <span>Tổng cộng</span>
                <span className="text-lg text-red-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <button type="submit" disabled={isLoadingAddresses || isSubmitting} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1b64c7] text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              <PackageCheck className="h-4 w-4" />
              {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
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
