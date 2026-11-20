import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { AlertCircle, Plus, RefreshCw, Search, Truck } from 'lucide-react';
import { checkoutService, type OrderDetailsResponse } from '../../../services/checkoutService';
import { demoOrderService } from '../../../services/demoOrderService';
import { demoShipmentService, type DemoShipment } from '../../../services/demoShipmentService';
import { shouldUseDemoServices } from '../../../shared/api/serviceMode';

const statuses = [
  ['CREATED', 'Đã tạo vận đơn'], ['PENDING', 'Chờ lấy hàng'], ['PICKEDUP', 'Shipper đã lấy hàng'],
  ['INTRANSIT', 'Đang trên đường giao'], ['DELIVERING', 'Đang phát hàng'],
  ['DELIVERED', 'Giao hàng thành công'], ['CANCELLED', 'Đã hủy vận đơn'],
] as const;

const getError = (error: unknown) => axios.isAxiosError<{ detail?: string; message?: string }>(error)
  ? error.response?.data?.detail || error.response?.data?.message || 'Yêu cầu chưa hoàn tất.'
  : error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const addressText = (address?: OrderDetailsResponse['shippingAddress']) => {
  if (!address) return '—';
  if (typeof address === 'string') return address;
  return [address.streetAddress, address.ward, address.district, address.province].filter(Boolean).join(', ');
};

export function ShipmentManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const isDemo = shouldUseDemoServices(token);
  const [orders, setOrders] = useState<OrderDetailsResponse[]>([]);
  const [shipments, setShipments] = useState<DemoShipment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [provider, setProvider] = useState('GHN');
  const [trackingCode, setTrackingCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isDemo) {
        setOrders(demoOrderService.getAll().map((result) => result.order));
        setShipments(demoShipmentService.getAll());
      } else {
        setOrders(await checkoutService.getAllOrders(token));
      }
    };
    load()
      .then(() => active && setError(null))
      .catch((reason) => active && setError(getError(reason)))
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, [token, isDemo, reload]);

  const visible = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return shipments;
    return shipments.filter((item) =>
      (item.trackingCode ?? '').toLowerCase().includes(value) ||
      (item.orderCode ?? item.orderId).toLowerCase().includes(value) ||
      (item.customerName ?? '').toLowerCase().includes(value),
    );
  }, [shipments, search]);

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const order = orders.find((item) => item.id === selectedOrderId);
    if (!order) return setFormError('Vui lòng chọn đơn hàng.');
    setFormError(null);
    setNotice(null);
    try {
      if (isDemo) {
        setShipments(demoShipmentService.create(order, provider, trackingCode));
      } else {
        const created = await checkoutService.createShipment(token!, {
          orderId: selectedOrderId,
          provider,
          trackingCode: trackingCode.trim() || undefined,
        });
        setShipments((current) => [{
          ...created,
          orderId: selectedOrderId,
          orderCode: order.orderCode,
          customerName: order.customerName ??
            (typeof order.shippingAddress === 'object' ? order.shippingAddress.recipientName : undefined),
          shippingAddress: order.shippingAddress,
          createdAt: created.createdAt ?? new Date().toISOString(),
        }, ...current]);
      }
      setTrackingCode('');
      setNotice(`Đã tạo vận đơn cho đơn ${order.orderCode ?? order.id}.`);
    } catch (reason) {
      setFormError(getError(reason));
    }
  };

  const updateStatus = async (shipment: DemoShipment, status: string) => {
    setError(null);
    setNotice(null);
    try {
      if (isDemo) setShipments(demoShipmentService.updateStatus(shipment.id!, status));
      else {
        await checkoutService.updateShipmentStatus(token!, shipment.id!, status);
        setShipments((current) => current.map((item) =>
          item.id === shipment.id ? { ...item, status } : item,
        ));
      }
      setNotice(`Đã cập nhật trạng thái vận đơn ${shipment.trackingCode ?? shipment.id}.`);
    } catch (reason) {
      setError(getError(reason));
    }
  };

  const cancelShipment = async (shipment: DemoShipment) => {
    if (!window.confirm(`Hủy vận đơn ${shipment.trackingCode ?? shipment.id}?`)) return;
    setError(null);
    setNotice(null);
    try {
      if (isDemo) setShipments(demoShipmentService.cancel(shipment.id!));
      else {
        await checkoutService.cancelShipment(token!, shipment.id!);
        setShipments((current) => current.map((item) =>
          item.id === shipment.id ? { ...item, status: 'CANCELLED' } : item,
        ));
      }
      setNotice(`Đã hủy vận đơn ${shipment.trackingCode ?? shipment.id}.`);
    } catch (reason) {
      setError(getError(reason));
    }
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-extrabold">Quản lý vận đơn</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo, theo dõi, cập nhật trạng thái và hủy vận đơn.</p>
          </div>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Tải lại</button>
        </div>
        {isDemo && <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">Chế độ demo: vận đơn và thay đổi trạng thái chỉ được lưu trên trình duyệt.</p>}
        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" /><span>{error}</span></div>}
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <form onSubmit={submitCreate} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_180px_minmax(220px,1fr)_auto]">
          <select required value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="" disabled>Chọn đơn hàng</option>{orders.filter((order) => order.status?.toUpperCase() !== 'CANCELLED').map((order) => <option key={order.id} value={order.id}>#{order.orderCode ?? order.id}</option>)}</select>
          <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="GHN">GHN</option><option value="GHTK">GHTK</option><option value="VTP">VNPost</option><option value="MANUAL">Nội bộ</option></select>
          <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="Mã vận đơn (không bắt buộc)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" />
          <button type="submit" disabled={!loaded || orders.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Tạo vận đơn</button>
          {formError && <p role="alert" className="md:col-span-4 text-sm text-red-700">{formError}</p>}
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Truck className="h-5 w-5" /></div><div><h2 className="font-bold">Danh sách vận đơn</h2><p className="text-xs text-slate-500">{visible.length} vận đơn</p></div></div>
            <label className="relative block w-72"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã vận đơn, mã đơn hoặc khách hàng" className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm" /></label>
          </div>
          {!loaded ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div> : visible.length === 0 ? <div className="px-5 py-14 text-center"><Truck className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-semibold">Chưa có vận đơn</h3></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-3">Mã vận đơn</th><th className="px-5 py-3">Mã đơn hàng</th><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Địa chỉ nhận</th><th className="px-5 py-3">Đơn vị vận chuyển</th><th className="px-5 py-3">Ngày tạo</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-blue-50/40">
                      <td className="px-5 py-4 text-sm font-bold text-blue-700">#{shipment.trackingCode ?? shipment.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold">#{shipment.orderCode ?? shipment.orderId}</td>
                      <td className="px-5 py-4 text-sm">{shipment.customerName ?? 'Khách hàng'}</td>
                      <td className="max-w-[220px] px-5 py-4 text-xs text-slate-600">{addressText(shipment.shippingAddress)}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{shipment.provider ?? '—'}</td>
                      <td className="px-5 py-4 text-xs">{formatDate(shipment.createdAt)}</td>
                      <td className="px-5 py-4">
                        <select value={shipment.status ?? 'CREATED'} disabled={['CANCELLED', 'DELIVERED'].includes(shipment.status?.toUpperCase() ?? '')} onChange={(event) => updateStatus(shipment, event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold disabled:opacity-50">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                      </td>
                      <td className="px-5 py-4 text-right"><button type="button" disabled={['CANCELLED', 'DELIVERED'].includes(shipment.status?.toUpperCase() ?? '')} onClick={() => cancelShipment(shipment)} className="h-9 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 disabled:opacity-40">Hủy vận đơn</button></td>
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
