import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';
import {
  checkoutService,
  type OrderDetailsResponse,
  type ShippingAddress,
} from '../services/checkoutService';
import { demoOrderService } from '../services/demoOrderService';

const PAGE_SIZE = 10;

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PACKING', label: 'Đang chuẩn bị' },
  { value: 'READY_TO_SHIP', label: 'Chờ giao hàng' },
  { value: 'SHIPPED', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const statusStyles: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PACKING: 'bg-indigo-50 text-indigo-700',
  READY_TO_SHIP: 'bg-violet-50 text-violet-700',
  SHIPPED: 'bg-cyan-50 text-cyan-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const statusLabel = (status?: string) =>
  statusOptions.find((item) => item.value === status?.toUpperCase())?.label ??
  status?.replaceAll('_', ' ') ??
  'Chưa cập nhật';

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

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail ||
      error.response?.data?.message ||
      'Yêu cầu chưa hoàn tất. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
};

const paymentLabel = (order: OrderDetailsResponse) => {
  const payment = order.paymentMethod;
  if (payment === 1 || payment === '1' || String(payment).toUpperCase() === 'COD') return 'Thanh toán khi nhận hàng';
  if (payment === 2 || payment === '2' || String(payment).toUpperCase() === 'VNPAY') return 'VNPay';
  return String(payment ?? '—');
};

const customerName = (order: OrderDetailsResponse) => {
  if (order.customerName) return order.customerName;
  if (typeof order.shippingAddress === 'object') return order.shippingAddress.recipientName;
  return 'Khách hàng';
};

const addressText = (address?: ShippingAddress | string) => {
  if (!address) return '—';
  if (typeof address === 'string') return address;
  return [address.streetAddress, address.ward, address.district, address.province].filter(Boolean).join(', ');
};

export function OrderManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isDemo = !token;
  const [orders, setOrders] = useState<OrderDetailsResponse[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [detailTarget, setDetailTarget] = useState<OrderDetailsResponse | null>(null);
  const [statusTarget, setStatusTarget] = useState<OrderDetailsResponse | null>(null);
  const [nextStatus, setNextStatus] = useState('CONFIRMED');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const loadKey = `${isDemo ? 'demo' : 'account'}:${status}:${reloadVersion}`;
  const isLoading = loadedKey !== loadKey;

  useEffect(() => {
    let active = true;
    const request = token
      ? checkoutService.getAllOrders(token, status || undefined)
      : Promise.resolve().then(() =>
          demoOrderService
            .getAll()
            .map((result) => result.order)
            .filter((order) => !status || order.status?.toUpperCase() === status),
        );

    request
      .then((data) => {
        if (!active) return;
        setOrders(data);
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
  }, [token, status, loadKey, reloadVersion]);

  const visibleOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filtered = normalizedSearch
      ? orders.filter((order) =>
          (order.orderCode ?? order.id).toLocaleLowerCase().includes(normalizedSearch) ||
          customerName(order).toLocaleLowerCase().includes(normalizedSearch),
        )
      : orders;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(pageIndex, totalPages);
    return {
      items: filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      totalCount: filtered.length,
      totalPages,
      safePage,
    };
  }, [orders, search, pageIndex]);

  useEffect(() => {
    setPageIndex(1);
  }, [search, status]);

  const openStatusForm = (order: OrderDetailsResponse) => {
    setStatusTarget(order);
    setNextStatus(order.status?.toUpperCase() || 'CONFIRMED');
    setStatusError(null);
  };

  const updateStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!statusTarget) return;
    setIsUpdating(true);
    setStatusError(null);
    setNotice(null);
    try {
      if (token) {
        await checkoutService.updateOrderStatus(token, statusTarget.id, nextStatus);
      } else {
        demoOrderService.updateStatus(statusTarget.id, nextStatus);
      }
      setOrders((current) =>
        current.map((order) =>
          order.id === statusTarget.id ? { ...order, status: nextStatus } : order,
        ),
      );
      setStatusTarget(null);
      setNotice(`Đã cập nhật trạng thái đơn ${statusTarget.orderCode ?? statusTarget.id}.`);
    } catch (updateError: unknown) {
      setStatusError(getApiError(updateError));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-extrabold">Quản lý đơn hàng</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi, xem chi tiết và cập nhật trạng thái đơn hàng.</p>
          </div>
          <button
            type="button"
            onClick={() => setReloadVersion((version) => version + 1)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: đơn hàng và thay đổi trạng thái chỉ được lưu trong trình duyệt.
          </p>
        )}
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Danh sách đơn hàng</h2>
                <p className="mt-0.5 text-xs text-slate-500">{visibleOrders.totalCount} đơn hàng</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <label className="relative block sm:w-64">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Mã đơn hoặc tên khách hàng"
                  aria-label="Tìm đơn hàng"
                  className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Lọc trạng thái đơn hàng"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5" aria-label="Đang tải đơn hàng">
              {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : visibleOrders.items.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 font-semibold">{error ? 'Chưa thể tải đơn hàng' : 'Không tìm thấy đơn hàng'}</h3>
              <p className="mt-1 text-sm text-slate-500">{error ? 'Kiểm tra kết nối hoặc quyền truy cập.' : 'Thử thay đổi từ khóa hoặc trạng thái.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3">Mã đơn hàng</th>
                      <th scope="col" className="px-5 py-3">Tên khách hàng</th>
                      <th scope="col" className="px-5 py-3">Ngày đặt</th>
                      <th scope="col" className="px-5 py-3">Tổng giá trị</th>
                      <th scope="col" className="px-5 py-3">Thanh toán</th>
                      <th scope="col" className="px-5 py-3">Trạng thái</th>
                      <th scope="col" className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleOrders.items.map((order) => (
                      <tr key={order.id} className="transition hover:bg-blue-50/40">
                        <td className="px-5 py-4 text-sm font-bold text-blue-700">#{order.orderCode ?? order.id}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold">{customerName(order)}</p>
                          {typeof order.shippingAddress === 'object' && (
                            <p className="mt-0.5 text-xs text-slate-500">{order.shippingAddress.phone}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-red-600">{formatCurrency(order.grandTotal)}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            {paymentLabel(order)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[order.status?.toUpperCase() ?? ''] ?? 'bg-slate-100 text-slate-700'}`}>
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {order.status?.toUpperCase() === 'SHIPPED' && (
                              <button type="button" onClick={() => window.open('/tracking', '_blank', 'noopener,noreferrer')} aria-label={`Xem vận đơn giao hàng nhanh cho đơn ${order.orderCode ?? order.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                                <Truck className="h-4 w-4" />
                                Giao hàng nhanh
                              </button>
                            )}
                            <button type="button" onClick={() => setDetailTarget(order)} aria-label={`Xem chi tiết ${order.orderCode ?? order.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                              <Eye className="h-4 w-4" />
                              Chi tiết
                            </button>
                            <button type="button" onClick={() => openStatusForm(order)} aria-label={`Cập nhật trạng thái ${order.orderCode ?? order.id}`} className="inline-flex h-9 items-center rounded-lg border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50">
                              Cập nhật
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">Trang {visibleOrders.safePage} / {visibleOrders.totalPages} · {visibleOrders.totalCount} đơn hàng</p>
                <div className="flex gap-2">
                  <button type="button" disabled={visibleOrders.safePage <= 1} onClick={() => setPageIndex((page) => page - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" /> Trước
                  </button>
                  <button type="button" disabled={visibleOrders.safePage >= visibleOrders.totalPages} onClick={() => setPageIndex((page) => page + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    Sau <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {detailTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Chi tiết đơn hàng</p>
                <h2 id="order-detail-title" className="mt-1 text-lg font-bold">#{detailTarget.orderCode ?? detailTarget.id}</h2>
              </div>
              <button type="button" onClick={() => setDetailTarget(null)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Khách hàng</p>
                  <p className="mt-1 font-bold">{customerName(detailTarget)}</p>
                  {typeof detailTarget.shippingAddress === 'object' && (
                    <p className="mt-1 text-sm text-slate-600">{detailTarget.shippingAddress.phone}</p>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ngày đặt hàng</p>
                  <p className="mt-1 font-bold">{formatDate(detailTarget.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Phương thức thanh toán</p>
                  <p className="mt-1 font-bold">{paymentLabel(detailTarget)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Trạng thái</p>
                  <p className="mt-1 font-bold">{statusLabel(detailTarget.status)}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Địa chỉ nhận hàng</p>
                <p className="mt-1 text-sm leading-6">{addressText(detailTarget.shippingAddress)}</p>
              </div>
              <div>
                <h3 className="mb-2 font-bold">Sản phẩm</h3>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {(detailTarget.items ?? []).map((item, index) => (
                    <div key={item.id ?? item.sku ?? index} className="flex items-center justify-between gap-4 p-3">
                      <div>
                        <p className="text-sm font-semibold">{item.productName ?? item.name ?? 'Sản phẩm'}</p>
                        <p className="mt-1 text-xs text-slate-500">SKU: {item.sku ?? '—'} · SL: {item.quantity ?? 1}</p>
                      </div>
                      <strong className="shrink-0 text-sm text-red-600">{formatCurrency(item.lineTotal ?? item.unitPrice)}</strong>
                    </div>
                  ))}
                  {(detailTarget.items ?? []).length === 0 && <p className="p-4 text-sm text-slate-500">Chưa có sản phẩm.</p>}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-600">Tổng giá trị đơn hàng</span>
                <strong className="text-xl text-red-600">{formatCurrency(detailTarget.grandTotal)}</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {statusTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isUpdating) setStatusTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="update-status-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="update-status-title" className="text-lg font-bold">Cập nhật trạng thái</h2>
                <p className="mt-1 text-sm text-slate-500">Đơn #{statusTarget.orderCode ?? statusTarget.id}</p>
              </div>
              <button type="button" onClick={() => setStatusTarget(null)} disabled={isUpdating} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={updateStatus} className="mt-4">
              <label className="block text-sm font-semibold">
                Trạng thái mới
                <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500">
                  {statusOptions.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              {statusError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{statusError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setStatusTarget(null)} disabled={isUpdating} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={isUpdating} className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                  {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
