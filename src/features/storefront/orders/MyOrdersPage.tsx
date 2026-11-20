import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  PackageCheck,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { checkoutService, type OrderDetailsResponse } from '../../../services/checkoutService';
import { demoOrderService } from '../../../services/demoOrderService';

const orderStatuses = [
  { value: '', label: 'Tất cả đơn hàng' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PACKING', label: 'Đang chuẩn bị' },
  { value: 'READY_TO_SHIP', label: 'Chờ giao hàng' },
  { value: 'SHIPPED', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const statusStyles: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
  PACKING: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  READY_TO_SHIP: 'bg-violet-50 text-violet-700 ring-violet-200',
  SHIPPED: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
};

const statusLabels = new Map(
  orderStatuses.filter((status) => status.value).map((status) => [status.value, status.label]),
);

const formatCurrency = (value?: number) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string) => {
  if (!value) return 'Ngày đặt hàng chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Ngày đặt hàng chưa có'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Không thể tải đơn hàng. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể tải đơn hàng. Vui lòng thử lại.';
};

export function MyOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderDetailsResponse[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const requestKey = `${token ? 'account' : 'demo'}:${selectedStatus}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    const loadOrders = token
      ? checkoutService.getMyOrders(token, selectedStatus || undefined)
      : Promise.resolve().then(() =>
          demoOrderService
            .getAll()
            .map(({ order }) => order)
            .filter((order) => !selectedStatus || order.status?.toUpperCase() === selectedStatus),
        );

    loadOrders
      .then((data) => {
        if (!active) return;
        setOrders(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [token, selectedStatus, requestKey]);

  const visibleOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return orders;
    return orders.filter((order) => order.orderCode?.toLocaleLowerCase().includes(normalizedSearch));
  }, [orders, search]);

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Tài khoản của bạn</p>
            <h1 className="mt-1 text-2xl font-extrabold">Đơn hàng của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái và xem lại các đơn hàng đã đặt.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã đơn hàng"
              aria-label="Tìm theo mã đơn hàng"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {!token && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Bạn đang xem các đơn demo trong phiên này. Đăng nhập để xem đơn hàng thực tế.
          </p>
        )}

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Lọc đơn hàng theo trạng thái">
          {orderStatuses.map((status) => (
            <button
              key={status.value || 'all'}
              type="button"
              role="tab"
              aria-selected={selectedStatus === status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                selectedStatus === status.value
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4" aria-label="Đang tải đơn hàng">
            {[1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
          </div>
        ) : visibleOrders.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {error ? <ClipboardList className="h-8 w-8" /> : <ShoppingBag className="h-8 w-8" />}
            </div>
            <h2 className="mt-4 text-lg font-bold">{error ? 'Chưa thể hiển thị đơn hàng' : 'Chưa có đơn hàng phù hợp'}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {error ? 'Kiểm tra kết nối rồi tải lại trang.' : 'Các đơn hàng của bạn sẽ xuất hiện tại đây sau khi đặt mua.'}
            </p>
            <Link to="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              Khám phá sản phẩm
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            <p className="text-sm text-slate-500" aria-live="polite">
              Có <strong className="text-slate-800">{visibleOrders.length}</strong> đơn hàng
            </p>
            {visibleOrders.map((order) => {
              const status = order.status?.toUpperCase() ?? '';
              const items = order.items ?? [];
              return (
                <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <p className="text-sm font-bold text-slate-900">
                        Đơn hàng <span className="text-blue-700">#{order.orderCode || order.id}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusStyles[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                      {statusLabels.get(status) ?? (status ? status.replaceAll('_', ' ') : 'Chưa cập nhật')}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 px-5">
                    {items.length > 0 ? items.slice(0, 3).map((item, index) => (
                      <div key={item.id ?? item.sku ?? index} className="flex items-center gap-3 py-4">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-14 w-14 rounded-lg border border-slate-100 object-contain p-1" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <PackageCheck className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.productName || item.name || 'Sản phẩm'}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.sku ? `SKU: ${item.sku} · ` : ''}Số lượng: {item.quantity ?? '—'}</p>
                        </div>
                        <strong className="shrink-0 text-sm text-slate-700">{formatCurrency(item.lineTotal ?? (item.unitPrice !== undefined && item.quantity !== undefined ? item.unitPrice * item.quantity : undefined))}</strong>
                      </div>
                    )) : (
                      <p className="py-5 text-sm text-slate-500">Chi tiết sản phẩm chưa có.</p>
                    )}
                    {items.length > 3 && <p className="pb-3 text-xs text-slate-500">và {items.length - 3} sản phẩm khác</p>}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">
                      Tổng tiền <strong className="ml-2 text-lg font-extrabold text-red-600">{formatCurrency(order.grandTotal)}</strong>
                    </p>
                    <Link to={`/profile/orders/${encodeURIComponent(order.id)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-600 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
                      Xem đơn hàng
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
