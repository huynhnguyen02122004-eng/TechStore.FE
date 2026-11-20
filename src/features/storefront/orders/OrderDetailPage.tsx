import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react';
import {
  checkoutService,
  type OrderDetailsResponse,
  type ShipmentDetailsResponse,
} from '../../../services/checkoutService';
import { demoOrderService } from '../../../services/demoOrderService';

const orderStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang chuẩn bị',
  READY_TO_SHIP: 'Chờ giao hàng',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const orderStatusStyles: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
  PACKING: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  READY_TO_SHIP: 'bg-violet-50 text-violet-700 ring-violet-200',
  SHIPPED: 'bg-purple-50 text-purple-700 ring-purple-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
};

const shipmentStatusLabels: Record<string, string> = {
  PENDING: 'Chờ lấy hàng',
  PICKEDUP: 'Shipper đã lấy hàng',
  INTRANSIT: 'Đang trên đường giao',
  DELIVERING: 'Đang giao đến bạn',
  DELIVERED: 'Giao hàng thành công',
  CANCELLED: 'Đã hủy vận đơn',
};

const formatCurrency = (value?: number) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatStatus = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const normalized = value.toUpperCase().replaceAll('_', '').replaceAll(' ', '');
  return shipmentStatusLabels[normalized] ?? value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
};

const errorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Không thể tải thông tin đơn hàng.';
  }
  return error instanceof Error ? error.message : 'Không thể tải thông tin đơn hàng.';
};

const isNotFound = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;

const getShipmentDate = (shipment: ShipmentDetailsResponse) =>
  shipment.expectedDeliveryDate ??
  shipment.estimatedDeliveryDate ??
  shipment.expectedDeliveryAt;

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isDemoOrder = orderId.startsWith('DEMO-');
  const [order, setOrder] = useState<OrderDetailsResponse | null>(null);
  const [shipment, setShipment] = useState<ShipmentDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledNotice, setCancelledNotice] = useState(false);
  const requestKey = `${orderId}:${token ? 'account' : 'guest'}:${reloadVersion}`;
  const isLoading = loadedKey !== requestKey && Boolean(orderId) && (isDemoOrder || Boolean(token));
  const pageError = error || (!orderId ? 'Không tìm thấy mã đơn hàng.' : !isDemoOrder && !token ? 'Vui lòng đăng nhập để xem đơn hàng.' : null);

  useEffect(() => {
    if (!orderId || (!isDemoOrder && !token)) return;
    let active = true;

    const orderRequest = isDemoOrder
      ? Promise.resolve().then(() => {
          const result = demoOrderService.get(orderId);
          if (!result) throw new Error('Không tìm thấy dữ liệu đơn demo trong phiên hiện tại.');
          return result.order;
        })
      : checkoutService.getOrderById(token!, orderId);
    const shipmentRequest = isDemoOrder
      ? Promise.resolve(null)
      : checkoutService.getShipmentByOrderId(token!, orderId);

    Promise.allSettled([orderRequest, shipmentRequest])
      .then(([orderResult, shipmentResult]) => {
        if (!active) return;
        if (orderResult.status === 'rejected') {
          setError(errorMessage(orderResult.reason));
          return;
        }

        setOrder(orderResult.value);
        setError(null);
        if (shipmentResult.status === 'fulfilled') {
          setShipment(shipmentResult.value);
          setShipmentError(null);
        } else if (isNotFound(shipmentResult.reason)) {
          setShipment(null);
          setShipmentError(null);
        } else {
          setShipment(null);
          setShipmentError(errorMessage(shipmentResult.reason));
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [orderId, isDemoOrder, token, requestKey]);

  const normalizedOrderStatus = order?.status?.toUpperCase() ?? '';
  const canCancel = ['PENDING_PAYMENT', 'CONFIRMED'].includes(normalizedOrderStatus);
  const sortedHistory = useMemo(
    () =>
      [...(shipment?.statusHistories ?? [])].sort((a, b) => {
        const aTime = new Date(a.createdAt ?? a.timestamp ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? b.timestamp ?? 0).getTime();
        return aTime - bTime;
      }),
    [shipment?.statusHistories],
  );

  const submitCancellation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError('Vui lòng nhập lý do hủy đơn hàng.');
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      if (isDemoOrder) {
        const result = demoOrderService.cancel(orderId, reason);
        setOrder(result.order);
      } else {
        if (!token) throw new Error('Vui lòng đăng nhập để hủy đơn hàng.');
        await checkoutService.cancelOrder(token, orderId, reason);
        setOrder((current) => current ? { ...current, status: 'CANCELLED', cancelReason: reason } : current);
      }
      setShowCancelDialog(false);
      setCancelReason('');
      setCancelledNotice(true);
    } catch (requestError: unknown) {
      setCancelError(errorMessage(requestError));
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-4 py-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="h-36 rounded-2xl bg-white" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="h-96 rounded-2xl bg-white" />
            <div className="h-72 rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (pageError || !order) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f5f7fb] px-4 py-10">
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-bold">Không thể tải chi tiết đơn hàng</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-slate-500">{pageError ?? 'Không có dữ liệu đơn hàng.'}</p>
          {orderId && (isDemoOrder || token) && (
            <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          )}
          <Link to="/profile/orders" className="mt-5 inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  const address = order.shippingAddress;
  const addressText = typeof address === 'string'
    ? address
    : address
      ? `${address.streetAddress}, ${address.ward}, ${address.district}, ${address.province}`
      : null;
  const items = order.items ?? [];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 pb-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/profile/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
          <ArrowLeft className="h-4 w-4" />
          Danh sách đơn hàng
        </Link>

        {isDemoOrder && (
          <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Đơn hàng demo được lưu trong phiên trình duyệt; không đại diện cho giao dịch thật.
          </p>
        )}
        {cancelledNotice && (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Đơn hàng đã được hủy.
          </p>
        )}

        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Chi tiết đơn hàng</p>
            <h1 className="mt-1 break-all text-xl font-extrabold sm:text-2xl">#{order.orderCode || order.id}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Đặt ngày {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${orderStatusStyles[normalizedOrderStatus] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
              {orderStatusLabels[normalizedOrderStatus] ?? formatStatus(order.status)}
            </span>
            {canCancel && (
              <button type="button" onClick={() => { setCancelError(null); setShowCancelDialog(true); }} className="h-10 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-600 transition hover:bg-red-50">
                Hủy đơn hàng
              </button>
            )}
          </div>
        </section>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold">Theo dõi vận chuyển</h2>
              </div>
              {shipmentError ? (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{shipmentError}</span>
                </div>
              ) : shipment ? (
                <>
                  <div className="mt-4 grid gap-3 rounded-xl bg-blue-50/70 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Đơn vị vận chuyển</p>
                      <p className="mt-1 text-sm font-bold">{shipment.provider || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Mã vận đơn</p>
                      <p className="mt-1 break-all text-sm font-bold text-blue-700">{shipment.trackingCode || 'Chưa có mã'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Dự kiến giao hàng</p>
                      <p className="mt-1 text-sm font-bold">{formatDate(getShipmentDate(shipment))}</p>
                    </div>
                  </div>
                  {sortedHistory.length > 0 ? (
                    <ol className="mt-5 space-y-0">
                      {sortedHistory.map((history, index) => (
                        <li key={history.id ?? `${history.status}-${history.createdAt ?? history.timestamp ?? index}`} className="relative flex gap-3 pb-5 last:pb-0">
                          {index < sortedHistory.length - 1 && <span aria-hidden="true" className="absolute left-[9px] top-5 h-full w-px bg-slate-200" />}
                          <span className={`relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${index === sortedHistory.length - 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                            {index === sortedHistory.length - 1 ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{history.description || formatStatus(history.status)}</p>
                            {history.status && <p className="mt-0.5 text-xs text-slate-500">{formatStatus(history.status)}</p>}
                            <p className="mt-1 text-xs text-slate-400">{formatDate(history.createdAt ?? history.timestamp)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">Đơn vị vận chuyển chưa cập nhật lịch sử giao hàng.</p>
                  )}
                </>
              ) : (
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Chưa có thông tin vận chuyển</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Thông tin vận đơn sẽ xuất hiện khi đơn hàng được bàn giao cho đơn vị giao hàng.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold">Sản phẩm trong đơn hàng</h2>
              {items.length > 0 ? (
                <div className="mt-3 divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const lineTotal = item.lineTotal ??
                      (item.unitPrice !== undefined && item.quantity !== undefined ? item.unitPrice * item.quantity : undefined);
                    return (
                      <div key={item.id ?? item.sku ?? index} className="flex items-center gap-3 py-4">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-xl border border-slate-100 object-contain p-1" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <PackageCheck className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{item.productName || item.name || 'Sản phẩm'}</p>
                          {item.sku && <p className="mt-1 text-xs text-slate-500">SKU: {item.sku}</p>}
                          <p className="mt-1 text-xs text-slate-500">Số lượng: {item.quantity ?? '—'}</p>
                        </div>
                        <strong className="shrink-0 text-sm">{formatCurrency(lineTotal)}</strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Đơn hàng chưa có thông tin sản phẩm.</p>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold">Địa chỉ nhận hàng</h2>
              </div>
              {typeof address === 'string' ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">{address}</p>
              ) : address ? (
                <div className="mt-3 text-sm leading-6">
                  <p className="font-semibold">{address.recipientName}</p>
                  <p className="text-slate-600">{address.phone}</p>
                  <p className="mt-1 text-slate-600">{addressText}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Chưa có thông tin địa chỉ giao hàng.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold">Tổng kết đơn hàng</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3 text-slate-600"><dt>Tạm tính</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
                <div className="flex justify-between gap-3 text-slate-600"><dt>Phí vận chuyển</dt><dd>{formatCurrency(order.shippingFee)}</dd></div>
                <div className="flex justify-between gap-3 text-slate-600"><dt>Giảm giá</dt><dd>{formatCurrency(order.discount)}</dd></div>
                <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 font-bold text-slate-900">
                  <dt>Tổng thanh toán</dt>
                  <dd className="text-red-600">{formatCurrency(order.grandTotal)}</dd>
                </div>
              </dl>
              {normalizedOrderStatus === 'CANCELLED' && order.cancelReason && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">Lý do hủy: {order.cancelReason}</p>
              )}
            </section>
          </aside>
        </div>
      </div>

      {showCancelDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !cancelling) setShowCancelDialog(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cancel-order-title" className="text-lg font-bold">Hủy đơn hàng?</h2>
                <p className="mt-1 text-sm text-slate-500">Đơn #{order.orderCode || order.id}</p>
              </div>
              <button type="button" onClick={() => setShowCancelDialog(false)} disabled={cancelling} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCancellation}>
              <label htmlFor="cancel-reason" className="mt-5 block text-sm font-semibold">Lý do hủy đơn</label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                maxLength={500}
                rows={4}
                required
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập lý do bạn muốn hủy đơn..."
              />
              {cancelError && <p role="alert" className="mt-2 text-sm text-red-600">{cancelError}</p>}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowCancelDialog(false)} disabled={cancelling} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Giữ đơn hàng
                </button>
                <button type="submit" disabled={cancelling || !cancelReason.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {cancelling && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
