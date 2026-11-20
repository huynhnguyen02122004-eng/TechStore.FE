import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { AlertCircle, AlertTriangle, PackageCheck, Search, SlidersHorizontal, X } from 'lucide-react';
import type { InventoryAdjustPayload, InventoryItem } from '../../../services/inventoryService';
import { inventoryService } from '../../../services/inventoryService';
import { demoInventoryService } from '../../../services/demoInventoryService';
import { shouldUseDemoServices } from '../../../shared/api/serviceMode';

const getError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
};

const stockStatus = (item: InventoryItem) => {
  if (item.stockQuantity === 0) return { label: 'Hết hàng', style: 'bg-red-50 text-red-700' };
  if (item.stockQuantity <= item.lowStockThreshold) return { label: 'Sắp hết hàng', style: 'bg-amber-50 text-amber-700' };
  return { label: 'Còn hàng', style: 'bg-emerald-50 text-emerald-700' };
};

export function InventoryManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const isDemo = shouldUseDemoServices(token);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [thresholdTarget, setThresholdTarget] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'SET' | 'ADD' | 'REMOVE'>('SET');
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isDemo) return showLowStock ? demoInventoryService.getLowStock() : demoInventoryService.getAll();
      return showLowStock ? inventoryService.getLowStock(token) : inventoryService.getAll(token);
    };
    load()
      .then((data) => { if (active) { setItems(data); setError(null); } })
      .catch((reason) => { if (active) setError(getError(reason)); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [token, isDemo, showLowStock, reload]);

  const visible = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      item.productName.toLowerCase().includes(value) ||
      item.variantName.toLowerCase().includes(value) ||
      item.sku.toLowerCase().includes(value) ||
      (item.productCode ?? '').toLowerCase().includes(value),
    );
  }, [items, search]);

  const openAdjust = (item: InventoryItem) => {
    setAdjustTarget(item);
    setAdjustMode('SET');
    setAdjustQuantity(item.stockQuantity);
    setFormError(null);
  };

  const submitAdjust = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjustTarget) return;
    if (!Number.isInteger(adjustQuantity) || adjustQuantity < 0) {
      setFormError('Số lượng điều chỉnh phải là số nguyên không âm.');
      return;
    }
    const nextQuantity = adjustMode === 'SET'
      ? adjustQuantity
      : adjustMode === 'ADD'
        ? adjustTarget.stockQuantity + adjustQuantity
        : adjustTarget.stockQuantity - adjustQuantity;
    if (nextQuantity < 0) {
      setFormError('Số lượng tồn kho không thể nhỏ hơn 0.');
      return;
    }
    setWorking(true);
    setFormError(null);
    setNotice(null);
    try {
      const payload: InventoryAdjustPayload = {
        variantId: adjustTarget.variantId,
        quantity: adjustQuantity,
        mode: adjustMode,
      };
      if (isDemo) {
        setItems(demoInventoryService.adjust(payload));
      } else {
        await inventoryService.adjust(token, payload);
        setItems((current) => current.map((item) =>
          item.variantId === adjustTarget.variantId ? { ...item, stockQuantity: nextQuantity } : item,
        ));
      }
      setAdjustTarget(null);
      setNotice(`Đã điều chỉnh tồn kho cho ${adjustTarget.productName} - ${adjustTarget.variantName}.`);
    } catch (reason) {
      setFormError(getError(reason));
    } finally {
      setWorking(false);
    }
  };

  const openThreshold = (item: InventoryItem) => {
    setThresholdTarget(item);
    setThreshold(item.lowStockThreshold);
    setFormError(null);
  };

  const submitThreshold = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!thresholdTarget) return;
    if (!Number.isInteger(threshold) || threshold < 0) {
      setFormError('Ngưỡng cảnh báo phải là số nguyên không âm.');
      return;
    }
    setWorking(true);
    setFormError(null);
    setNotice(null);
    try {
      if (isDemo) {
        setItems(demoInventoryService.updateThreshold(thresholdTarget.variantId, threshold));
      } else {
        await inventoryService.updateThreshold(token, thresholdTarget.variantId, threshold);
        setItems((current) => current.map((item) =>
          item.variantId === thresholdTarget.variantId ? { ...item, lowStockThreshold: threshold } : item,
        ));
      }
      setThresholdTarget(null);
      setNotice(`Đã cập nhật ngưỡng cảnh báo cho ${thresholdTarget.variantName}.`);
    } catch (reason) {
      setFormError(getError(reason));
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p><h1 className="mt-1 text-2xl font-extrabold">Quản lý tồn kho</h1><p className="mt-1 text-sm text-slate-500">Theo dõi tồn kho và thiết lập ngưỡng cảnh báo.</p></div>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Tải lại</button>
        </div>
        {isDemo && <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">Chế độ demo: tồn kho và ngưỡng cảnh báo chỉ được lưu trên trình duyệt.</p>}
        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" /><span>{error}</span></div>}
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><PackageCheck className="h-5 w-5" /></div>
              <div><h2 className="font-bold">Danh sách tồn kho</h2><p className="text-xs text-slate-500">{visible.length} biến thể</p></div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLowStock(false)} className={`h-10 rounded-xl px-3 text-xs font-bold ${showLowStock ? 'border border-slate-200 bg-white text-slate-600' : 'bg-blue-600 text-white'}`}>Tất cả</button>
              <button type="button" onClick={() => setShowLowStock(true)} className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${showLowStock ? 'bg-amber-500 text-white' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}><AlertTriangle className="h-4 w-4" />Sắp hết hàng</button>
              <label className="relative block w-56"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm hoặc SKU" className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm" /></label>
            </div>
          </div>
          {!loaded ? (
            <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : visible.length === 0 ? (
            <div className="px-5 py-14 text-center"><PackageCheck className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-semibold">Không có dữ liệu tồn kho</h3></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-3">Mã sản phẩm</th><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Biến thể</th><th className="px-5 py-3">Tồn kho</th><th className="px-5 py-3">Ngưỡng</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((item) => {
                    const status = stockStatus(item);
                    return (
                      <tr key={item.variantId} className="hover:bg-blue-50/40">
                        <td className="px-5 py-4 text-sm font-bold text-blue-700">#{item.productCode ?? item.productId}</td>
                        <td className="px-5 py-4"><p className="text-sm font-semibold">{item.productName}</p><p className="mt-0.5 font-mono text-[11px] text-slate-400">{item.sku}</p></td>
                        <td className="px-5 py-4 text-sm">{item.variantName}</td>
                        <td className="px-5 py-4 text-lg font-extrabold">{item.stockQuantity}</td>
                        <td className="px-5 py-4 text-sm font-semibold">{item.lowStockThreshold}</td>
                        <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.style}`}>{status.label}</span></td>
                        <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openAdjust(item)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"><SlidersHorizontal className="h-4 w-4" />Điều chỉnh</button><button type="button" onClick={() => openThreshold(item)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ngưỡng</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {adjustTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Điều chỉnh tồn kho</h2><p className="mt-1 text-sm text-slate-500">{adjustTarget.productName} - {adjustTarget.variantName}</p></div><button type="button" onClick={() => setAdjustTarget(null)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500"><X className="h-5 w-5" /></button></div>
            <form onSubmit={submitAdjust} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">Cách điều chỉnh<select value={adjustMode} onChange={(event) => setAdjustMode(event.target.value as 'SET' | 'ADD' | 'REMOVE')} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal"><option value="SET">Đặt số lượng</option><option value="ADD">Nhập thêm</option><option value="REMOVE">Xuất/giảm</option></select></label>
              <label className="block text-sm font-semibold">Số lượng<input required type="number" min={0} step={1} value={adjustQuantity} onChange={(event) => setAdjustQuantity(Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setAdjustTarget(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold">Hủy</button><button type="submit" disabled={working} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">{working ? 'Đang lưu...' : 'Lưu tồn kho'}</button></div>
            </form>
          </section>
        </div>
      )}

      {thresholdTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Ngưỡng cảnh báo tồn kho</h2><p className="mt-1 text-sm text-slate-500">{thresholdTarget.variantName}</p></div><button type="button" onClick={() => setThresholdTarget(null)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500"><X className="h-5 w-5" /></button></div>
            <form onSubmit={submitThreshold} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">Số lượng tối thiểu<input required type="number" min={0} step={1} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal" /></label>
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setThresholdTarget(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold">Hủy</button><button type="submit" disabled={working} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">{working ? 'Đang lưu...' : 'Cập nhật ngưỡng'}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

