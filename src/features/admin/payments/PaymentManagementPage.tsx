import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  Search,
  WalletCards,
  X,
} from 'lucide-react';
import {
  checkoutService,
  type PaymentOrderResponse,
} from '../../../services/checkoutService';
import { demoPaymentService } from '../../../services/demoPaymentService';
import { shouldUseDemoServices } from '../../../shared/api/serviceMode';

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

const normalizeStatus = (status?: string) => status?.toUpperCase() ?? '';

const statusLabel = (status?: string) => {
  const value = normalizeStatus(status);
  if (value === 'PAID' || value === 'SUCCESS' || value === 'COMPLETED') return 'Đã thu tiền';
  if (value === 'PENDING') return 'Chờ thu tiền';
  if (value === 'FAILED') return 'Thất bại';
  if (value === 'CANCELLED') return 'Đã hủy';
  return status || 'Chưa cập nhật';
};

const statusStyle = (status?: string) => {
  const value = normalizeStatus(status);
  if (value === 'PAID' || value === 'SUCCESS' || value === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
  if (value === 'PENDING') return 'bg-amber-50 text-amber-700';
  if (value === 'FAILED' || value === 'CANCELLED') return 'bg-red-50 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const isCod = (payment: PaymentOrderResponse) => {
  const method = String(payment.paymentMethod ?? '').toUpperCase();
  return method === 'COD' || method === '1';
};

const methodLabel = (payment: PaymentOrderResponse) => {
  if (isCod(payment)) return 'Thanh toán khi nhận hàng (COD)';
  if (String(payment.paymentMethod ?? '').toUpperCase() === 'VNPAY' ||
      String(payment.paymentMethod ?? '') === '2') return 'VNPay';
  return String(payment.paymentMethod ?? '—');
};

export function PaymentManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const isDemo = shouldUseDemoServices(token);
  const [payments, setPayments] = useState<PaymentOrderResponse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detailTarget, setDetailTarget] = useState<PaymentOrderResponse | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PaymentOrderResponse | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let active = true;
    const request = token
      ? checkoutService.getAdminPayments(token)
      : Promise.resolve().then(() => demoPaymentService.getAll());
    request
      .then((data) => {
        if (!active) return;
        setPayments(data);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const visiblePayments = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return payments;
    return payments.filter((payment) =>
      (payment.id ?? '').toLocaleLowerCase().includes(normalized) ||
      (payment.orderCode ?? payment.orderId ?? '').toLocaleLowerCase().includes(normalized) ||
      (payment.customerName ?? '').toLocaleLowerCase().includes(normalized),
    );
  }, [payments, search]);

  const openDetail = async (payment: PaymentOrderResponse) => {
    setDetailTarget(payment);
    if (isDemo || !payment.id) return;
    try {
      setDetailTarget(await checkoutService.getPaymentById(token, payment.id));
    } catch (detailError: unknown) {
      setError(getApiError(detailError));
    }
  };

  const confirmPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmTarget) return;
    setIsConfirming(true);
    setConfirmError(null);
    setNotice(null);
    try {
      if (normalizeStatus(confirmTarget.status) === 'PAID') {
        throw new Error('Giao dịch này đã được xác nhận thu tiền, không thể thu trùng.');
      }
      if (!isCod(confirmTarget)) {
        throw new Error('Chỉ có thể xác nhận thu tiền đối với giao dịch COD.');
      }
      if (!isDemo) {
        if (!confirmTarget.id) throw new Error('Không tìm thấy mã thanh toán.');
        await checkoutService.confirmCodPayment(token, confirmTarget.id);
      } else {
        if (!confirmTarget.id) throw new Error('Không tìm thấy mã thanh toán.');
        setPayments(demoPaymentService.confirmCod(confirmTarget.id));
      }
      setPayments((current) =>
        current.map((payment) =>
          payment.id === confirmTarget.id
            ? { ...payment, status: 'PAID', paidAt: new Date().toISOString() }
            : payment,
        ),
      );
      setConfirmTarget(null);
      setNotice(`Đã xác nhận thu tiền cho thanh toán ${confirmTarget.id}.`);
    } catch (confirmFailure: unknown) {
      setConfirmError(getApiError(confirmFailure));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-extrabold">Quản lý thanh toán</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi giao dịch và xác nhận thu tiền COD.</p>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: dữ liệu thanh toán và xác nhận thu tiền chỉ được lưu trên trình duyệt.
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
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Danh sách thanh toán</h2>
                <p className="mt-0.5 text-xs text-slate-500">{visiblePayments.length} giao dịch</p>
              </div>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Mã thanh toán, mã đơn hoặc khách hàng"
                aria-label="Tìm thanh toán"
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {!loaded ? (
            <div className="space-y-3 p-5" aria-label="Đang tải thanh toán">
              {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : visiblePayments.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <WalletCards className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 font-semibold">Không tìm thấy thanh toán</h3>
              <p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Mã thanh toán</th>
                    <th scope="col" className="px-5 py-3">Mã đơn hàng</th>
                    <th scope="col" className="px-5 py-3">Tên khách hàng</th>
                    <th scope="col" className="px-5 py-3">Số tiền</th>
                    <th scope="col" className="px-5 py-3">Phương thức</th>
                    <th scope="col" className="px-5 py-3">Trạng thái</th>
                    <th scope="col" className="px-5 py-3">Thời gian</th>
                    <th scope="col" className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePayments.map((payment) => {
                    const paid = normalizeStatus(payment.status) === 'PAID';
                    return (
                      <tr key={payment.id ?? payment.orderId} className="transition hover:bg-blue-50/40">
                        <td className="px-5 py-4 text-sm font-bold text-blue-700">#{payment.id ?? '—'}</td>
                        <td className="px-5 py-4 text-sm font-semibold">#{payment.orderCode ?? payment.orderId ?? '—'}</td>
                        <td className="px-5 py-4 text-sm">{payment.customerName ?? 'Khách hàng'}</td>
                        <td className="px-5 py-4 text-sm font-bold text-red-600">{formatCurrency(payment.amount ?? payment.grandTotal)}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            {methodLabel(payment)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle(payment.status)}`}>
                            {statusLabel(payment.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            {formatDate(payment.paidAt ?? payment.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openDetail(payment)} aria-label={`Xem chi tiết thanh toán ${payment.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                              <Eye className="h-4 w-4" />
                              Chi tiết
                            </button>
                            {isCod(payment) && (
                              <button type="button" onClick={() => {
                                setConfirmTarget(payment);
                                setConfirmError(null);
                              }} disabled={paid} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
                                <CheckCircle2 className="h-4 w-4" />
                                {paid ? 'Đã thu tiền' : 'Xác nhận COD'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {detailTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="payment-detail-title" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Chi tiết thanh toán</p>
                <h2 id="payment-detail-title" className="mt-1 break-all text-lg font-bold">#{detailTarget.id ?? '—'}</h2>
              </div>
              <button type="button" onClick={() => setDetailTarget(null)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Mã đơn hàng</p><p className="mt-1 font-bold">#{detailTarget.orderCode ?? detailTarget.orderId ?? '—'}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Khách hàng</p><p className="mt-1 font-bold">{detailTarget.customerName ?? 'Khách hàng'}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Số tiền</p><p className="mt-1 font-bold text-red-600">{formatCurrency(detailTarget.amount ?? detailTarget.grandTotal)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Phương thức</p><p className="mt-1 font-bold">{methodLabel(detailTarget)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Trạng thái</p><p className="mt-1 font-bold">{statusLabel(detailTarget.status)}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Thời gian thanh toán</p><p className="mt-1 font-bold">{formatDate(detailTarget.paidAt ?? detailTarget.createdAt)}</p></div>
            </div>
          </section>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isConfirming) setConfirmTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-cod-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="confirm-cod-title" className="text-lg font-bold">Xác nhận thu tiền COD</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Thanh toán #{confirmTarget.id} · {formatCurrency(confirmTarget.amount ?? confirmTarget.grandTotal)}</p>
              </div>
              <button type="button" onClick={() => setConfirmTarget(null)} disabled={isConfirming} aria-label="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            {confirmError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{confirmError}</p>}
            <form onSubmit={confirmPayment} className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmTarget(null)} disabled={isConfirming} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Hủy
              </button>
              <button type="submit" disabled={isConfirming} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                <CheckCircle2 className="h-4 w-4" />
                {isConfirming ? 'Đang xác nhận...' : 'Xác nhận đã thu'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
