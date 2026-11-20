import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Search, ShieldCheck } from 'lucide-react';
import {
  inventoryService,
  type InventoryReservation,
  type InventoryTransaction,
} from '../../../services/inventoryService';
import { demoInventoryTransactionService } from '../../../services/demoInventoryTransactionService';
import { shouldUseDemoServices } from '../../../shared/api/serviceMode';

const getError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const transactionLabel = (type: InventoryTransaction['type']) => {
  if (type === 'IN') return 'Nhập kho';
  if (type === 'OUT') return 'Xuất kho';
  return 'Điều chỉnh';
};

const transactionStyle = (type: InventoryTransaction['type']) => {
  if (type === 'IN') return 'bg-emerald-50 text-emerald-700';
  if (type === 'OUT') return 'bg-red-50 text-red-700';
  return 'bg-blue-50 text-blue-700';
};

const reservationLabel = (status: InventoryReservation['status']) => {
  const value = status.toUpperCase();
  if (value === 'ACTIVE') return 'Đang giữ';
  if (value === 'COMMITTED') return 'Đã xác nhận';
  if (value === 'RELEASED') return 'Đã giải phóng';
  if (value === 'CANCELLED') return 'Đã hủy';
  return status;
};

const reservationStyle = (status: InventoryReservation['status']) => {
  const value = status.toUpperCase();
  if (value === 'ACTIVE') return 'bg-amber-50 text-amber-700';
  if (value === 'COMMITTED') return 'bg-emerald-50 text-emerald-700';
  if (value === 'CANCELLED') return 'bg-red-50 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

export function InventoryTransactionPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const isDemo = shouldUseDemoServices(token);
  const [tab, setTab] = useState<'transactions' | 'reservations'>('transactions');
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [reservations, setReservations] = useState<InventoryReservation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isDemo) {
        setTransactions(demoInventoryTransactionService.getTransactions());
        setReservations(demoInventoryTransactionService.getReservations());
        return;
      }
      const [transactionData, reservationData] = await Promise.all([
        inventoryService.getTransactions(token),
        inventoryService.getReservations(token),
      ]);
      setTransactions(transactionData);
      setReservations(reservationData);
    };
    load()
      .then(() => { if (active) setError(null); })
      .catch((reason) => { if (active) setError(getError(reason)); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [token, isDemo, reload]);

  const visibleTransactions = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return transactions;
    return transactions.filter((item) =>
      item.id.toLowerCase().includes(value) ||
      (item.productCode ?? '').toLowerCase().includes(value) ||
      (item.productName ?? '').toLowerCase().includes(value) ||
      (item.variantName ?? '').toLowerCase().includes(value) ||
      (item.sku ?? '').toLowerCase().includes(value) ||
      (item.orderCode ?? '').toLowerCase().includes(value),
    );
  }, [transactions, search]);

  const visibleReservations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return reservations;
    return reservations.filter((item) =>
      item.id.toLowerCase().includes(value) ||
      (item.orderCode ?? item.orderId ?? '').toLowerCase().includes(value) ||
      (item.productName ?? '').toLowerCase().includes(value) ||
      (item.variantName ?? '').toLowerCase().includes(value) ||
      (item.sku ?? '').toLowerCase().includes(value),
    );
  }, [reservations, search]);

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị kho hàng</p>
            <h1 className="mt-1 text-2xl font-extrabold">Biến động kho & Giữ hàng</h1>
            <p className="mt-1 text-sm text-slate-500">Lịch sử nhập, xuất, điều chỉnh tồn kho và các đơn đang giữ hàng.</p>
          </div>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Tải lại</button>
        </div>
        {isDemo && <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">Chế độ demo: dữ liệu lịch sử kho được lưu trong trình duyệt.</p>}
        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" /><span>{error}</span></div>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={() => { setTab('transactions'); setSearch(''); }} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold ${tab === 'transactions' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}><ClipboardList className="h-4 w-4" />Lịch sử biến động</button>
              <button type="button" onClick={() => { setTab('reservations'); setSearch(''); }} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold ${tab === 'reservations' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}><ShieldCheck className="h-4 w-4" />Giữ hàng</button>
            </div>
            <label className="relative block w-full sm:w-72"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã, sản phẩm, đơn hàng..." className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm" /></label>
          </div>
          {!loaded ? (
            <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : tab === 'transactions' ? (
            visibleTransactions.length === 0 ? (
              <div className="px-5 py-14 text-center"><ClipboardList className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-semibold">Không có lịch sử biến động</h3></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-3">Mã giao dịch</th><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Biến thể</th><th className="px-5 py-3">Loại</th><th className="px-5 py-3">Thay đổi</th><th className="px-5 py-3">Trước / Sau</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Người thực hiện</th><th className="px-5 py-3">Đơn hàng</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleTransactions.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/40">
                        <td className="px-5 py-4 text-sm font-bold text-blue-700">#{item.id}</td>
                        <td className="px-5 py-4"><p className="text-sm font-semibold">{item.productName ?? '—'}</p><p className="mt-0.5 font-mono text-[11px] text-slate-400">{item.sku ?? item.productCode ?? '—'}</p></td>
                        <td className="px-5 py-4 text-sm">{item.variantName ?? '—'}</td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${transactionStyle(item.type)}`}>{item.type === 'IN' ? <ArrowDownToLine className="h-3.5 w-3.5" /> : item.type === 'OUT' ? <ArrowUpFromLine className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}{transactionLabel(item.type)}</span></td>
                        <td className={`px-5 py-4 text-sm font-extrabold ${item.changeQuantity >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{item.changeQuantity >= 0 ? '+' : ''}{item.changeQuantity}</td>
                        <td className="px-5 py-4 text-sm">{item.quantityBefore ?? '—'} <span className="text-slate-400">→</span> {item.quantityAfter ?? '—'}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDate(item.createdAt)}</td>
                        <td className="px-5 py-4 text-sm">{item.performedBy ?? '—'}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">{item.orderCode ? `#${item.orderCode}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : visibleReservations.length === 0 ? (
            <div className="px-5 py-14 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-semibold">Không có thông tin giữ hàng</h3></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-3">Mã giữ hàng</th><th className="px-5 py-3">Mã đơn hàng</th><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Biến thể</th><th className="px-5 py-3">Số lượng</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Tạo lúc</th><th className="px-5 py-3">Hết hạn</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleReservations.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40">
                      <td className="px-5 py-4 text-sm font-bold text-blue-700">#{item.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{item.orderCode ? `#${item.orderCode}` : item.orderId ?? '—'}</td>
                      <td className="px-5 py-4"><p className="text-sm font-semibold">{item.productName ?? '—'}</p><p className="mt-0.5 font-mono text-[11px] text-slate-400">{item.sku ?? '—'}</p></td>
                      <td className="px-5 py-4 text-sm">{item.variantName ?? '—'}</td>
                      <td className="px-5 py-4 text-sm font-extrabold">{item.quantity}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${reservationStyle(item.status)}`}>{reservationLabel(item.status)}</span></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDate(item.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
