import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Home,
  PackageCheck,
  RefreshCw,
  Truck,
} from 'lucide-react';
import {
  checkoutService,
  type OrderDetailsResponse,
  type PaymentOrderResponse,
} from '../services/checkoutService';
import { demoOrderService, type DemoOrderResult } from '../services/demoOrderService';

type CheckoutResult = {
  order: OrderDetailsResponse;
  payment: {
    status: string;
    paymentReference?: string;
  };
};

const formatCurrency = (value: number | undefined) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const normalizePayment = (payment: PaymentOrderResponse): CheckoutResult['payment'] => ({
  status: payment.payment?.status ?? payment.status ?? 'UNKNOWN',
  paymentReference: payment.payment?.paymentReference ?? payment.paymentReference,
});

const getDemoResult = (result: DemoOrderResult): CheckoutResult => ({
  order: result.order,
  payment: result.payment,
});

export function CheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isDemoResult = orderId.startsWith('DEMO-');
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const requestKey = `${orderId}:${reloadVersion}`;
  const isLoading = Boolean(orderId) && loadedKey !== requestKey && (isDemoResult || Boolean(token));
  const pageError =
    error ||
    (!orderId ? 'Không tìm thấy mã đơn hàng trong đường dẫn.' : !isDemoResult && !token ? 'Vui lòng đăng nhập để xem kết quả đơn hàng.' : null);

  useEffect(() => {
    if (!orderId || (!isDemoResult && !token)) return;
    let active = true;

    const loadResult = async (): Promise<CheckoutResult> => {
      if (isDemoResult) {
        const demoResult = demoOrderService.get(orderId);
        if (!demoResult) throw new Error('Không tìm thấy dữ liệu đơn hàng demo trong phiên hiện tại.');
        return getDemoResult(demoResult);
      }

      if (!token) throw new Error('Vui lòng đăng nhập để xem kết quả đơn hàng.');
      const [payment, order] = await Promise.all([
        checkoutService.getPaymentByOrderId(token, orderId),
        checkoutService.getOrderById(token, orderId),
      ]);
      return { payment: normalizePayment(payment), order };
    };

    loadResult()
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Không thể tải kết quả đơn hàng.');
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [orderId, isDemoResult, token, requestKey]);

  const normalizedStatus = result?.payment.status.toUpperCase() ?? '';
  const statusDetails = useMemo(() => {
    if (['PAID', 'SUCCESS', 'COMPLETED'].includes(normalizedStatus)) {
      return { title: 'Thanh toán thành công', label: 'Đã thanh toán', tone: 'emerald' as const };
    }
    if (normalizedStatus === 'FAILED') {
      return { title: 'Thanh toán thất bại', label: 'Thất bại', tone: 'red' as const };
    }
    if (normalizedStatus === 'EXPIRED') {
      return { title: 'Giao dịch đã hết hạn', label: 'Hết hạn', tone: 'slate' as const };
    }
    if (normalizedStatus === 'PENDING') {
      return { title: 'Đơn hàng đã được ghi nhận', label: 'Chờ thanh toán', tone: 'amber' as const };
    }
    return { title: 'Kết quả đơn hàng', label: result?.payment.status ?? 'Chưa xác định', tone: 'blue' as const };
  }, [normalizedStatus, result?.payment.status]);

  const copyOrderCode = async () => {
    const orderCode = result?.order.orderCode;
    if (!orderCode) return;
    await navigator.clipboard.writeText(orderCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (isLoading) {
    return (
      <main className="min-h-[70vh] bg-[#f5f7fb] px-4 py-10">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="mx-auto h-16 w-16 rounded-full bg-slate-200" />
          <div className="mx-auto mt-5 h-8 w-64 rounded bg-slate-200" />
          <div className="mt-8 h-64 rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  if (pageError || !result) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f5f7fb] px-4 py-10">
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Không thể tải kết quả</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-slate-500">{pageError ?? 'Không có dữ liệu đơn hàng.'}</p>
          {orderId && !isDemoResult && token && (
            <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          )}
          <div className="mt-5">
            <Link to="/" className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
              Về trang chủ
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const order = result.order;
  const address = order.shippingAddress;
  const addressText =
    typeof address === 'string'
      ? address
      : address
        ? `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`
        : null;
  const recipient = typeof address === 'string' ? null : address;
  const paymentDeadline = formatDate(order.paymentExpiresAt);
  const toneStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  };
  const iconStyles = {
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    slate: 'bg-slate-200 text-slate-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 pb-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {isDemoResult && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Đây là kết quả demo lưu trong phiên trình duyệt; không đại diện cho giao dịch thật.
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-9">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconStyles[statusDetails.tone]}`}>
            {statusDetails.tone === 'emerald' ? <CheckCircle2 className="h-9 w-9" /> : <Clock3 className="h-8 w-8" />}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{statusDetails.title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {normalizedStatus === 'PENDING'
              ? 'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ cập nhật trạng thái khi đơn hàng được xử lý.'
              : normalizedStatus === 'FAILED'
                ? 'Giao dịch chưa hoàn tất. Vui lòng kiểm tra thông tin hoặc liên hệ bộ phận hỗ trợ.'
                : 'Thông tin đơn hàng và thanh toán của bạn được tổng hợp bên dưới.'}
          </p>

          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset">
            <span className={`rounded-full px-3 py-1.5 ${toneStyles[statusDetails.tone]}`}>{statusDetails.label}</span>
          </div>

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs text-slate-500">Mã đơn hàng</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <strong className="break-all text-sm text-slate-900">{order.orderCode || order.id}</strong>
                {order.orderCode && (
                  <button type="button" onClick={copyOrderCode} className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50" aria-label="Sao chép mã đơn hàng">
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-left">
              <p className="text-xs text-slate-500">Mã tham chiếu thanh toán</p>
              <strong className="mt-1 block break-all text-sm text-slate-900">{result.payment.paymentReference || '—'}</strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-left sm:col-span-2">
              <p className="text-xs text-slate-500">Tổng thanh toán</p>
              <strong className="mt-1 block text-2xl font-extrabold text-red-600">{formatCurrency(order.grandTotal)}</strong>
            </div>
          </div>

          {paymentDeadline && normalizedStatus === 'PENDING' && (
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-amber-700">
              <Clock3 className="h-4 w-4" />
              Hạn thanh toán: {paymentDeadline}
            </p>
          )}

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/profile/orders/${encodeURIComponent(order.id)}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700">
              <PackageCheck className="h-4 w-4" />
              Xem đơn hàng
            </Link>
            <Link to="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Home className="h-4 w-4" />
              Tiếp tục mua sắm
            </Link>
          </div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Chi tiết đơn hàng</h2>
            {recipient && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Truck className="h-4 w-4 text-blue-600" />
                  Địa chỉ nhận hàng
                </div>
                <p className="mt-2 text-sm font-semibold">{recipient.recipientName} · {recipient.phone}</p>
                {addressText && <p className="mt-1 text-sm leading-6 text-slate-500">{addressText}</p>}
              </div>
            )}
            {typeof address === 'string' && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold"><Truck className="h-4 w-4 text-blue-600" />Địa chỉ nhận hàng</p>
                <p className="mt-2 text-sm text-slate-600">{address}</p>
              </div>
            )}
            <div className="mt-4 divide-y divide-slate-100">
              {order.items?.map((item, index) => {
                const quantity = item.quantity ?? 0;
                const lineTotal = item.lineTotal ?? (item.unitPrice !== undefined ? item.unitPrice * quantity : undefined);
                return (
                  <div key={item.id ?? item.sku ?? index} className="flex items-center gap-3 py-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-14 w-14 rounded-lg border border-slate-100 object-contain p-1" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><PackageCheck className="h-6 w-6" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold">{item.productName || item.name || 'Sản phẩm'}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.sku ? `SKU: ${item.sku} · ` : ''}Số lượng: {quantity}</p>
                    </div>
                    <strong className="shrink-0 text-sm">{formatCurrency(lineTotal)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Tổng kết chi phí</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3 text-slate-600"><dt>Tạm tính</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
              <div className="flex justify-between gap-3 text-slate-600"><dt>Phí vận chuyển</dt><dd>{formatCurrency(order.shippingFee)}</dd></div>
              <div className="flex justify-between gap-3 text-slate-600"><dt>Giảm giá</dt><dd>{formatCurrency(order.discount)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 font-bold text-slate-900"><dt>Tổng thanh toán</dt><dd className="text-red-600">{formatCurrency(order.grandTotal)}</dd></div>
            </dl>
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-800">
              <CreditCard className="h-4 w-4 shrink-0" />
              Trạng thái đơn: {order.status || '—'}
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
