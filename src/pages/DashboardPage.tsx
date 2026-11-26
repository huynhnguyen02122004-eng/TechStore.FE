import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { checkoutService } from '../services/checkoutService';
import { catalogService } from '../services/catalogService';
import { inventoryService } from '../services/inventoryService';
import { demoOrderService } from '../services/demoOrderService';
import { demoProductService } from '../services/demoProductService';
import { demoCategoryService } from '../services/demoCategoryService';
import { demoInventoryService } from '../services/demoInventoryService';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export function DashboardPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const isDemo = !token;
  const [loaded, setLoaded] = useState(false);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Array<{ status?: string; grandTotal?: number; customerName?: string; orderCode?: string }>>([]);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [inventory, setInventory] = useState<Array<{ productName: string; variantName: string; stockQuantity: number; lowStockThreshold: number }>>([]);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setError(null);

    const load = isDemo
      ? Promise.resolve({
          orders: demoOrderService.getAll().map((item) => item.order),
          products: demoProductService.getAll(),
          productCount: demoProductService.getAll().length,
          categories: demoCategoryService.getAll(),
          inventory: demoInventoryService.getAll(),
        })
      : Promise.all([
          checkoutService.getAllOrders(token),
          catalogService.getProducts({ pageIndex: 1, pageSize: 1 }),
          catalogService.getCategories(token),
          inventoryService.getAll(token),
        ]).then(([orderData, productData, categoryData, inventoryData]) => ({
          orders: orderData,
          products: productData.items,
          productCount: productData.totalCount,
          categories: categoryData,
          inventory: inventoryData,
        }));

    load
      .then((data: any) => {
        if (!active) return;
        setOrders(data.orders);
        setProductCount(data.productCount ?? data.products.length);
        setCategoryCount(data.categories.length);
        setInventory(data.inventory);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu tổng quan.');
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => { active = false; };
  }, [token, isDemo, reload]);

  const metrics = useMemo(() => {
    const completed = orders.filter((order) => order.status?.toUpperCase() === 'DELIVERED');
    const revenue = completed.reduce((sum, order) => sum + (order.grandTotal ?? 0), 0);
    const pending = orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status?.toUpperCase() ?? '')).length;
    const lowStock = inventory.filter((item) => item.stockQuantity <= item.lowStockThreshold);
    const outOfStock = inventory.filter((item) => item.stockQuantity === 0).length;
    const customers = new Set(orders.map((order) => order.customerName).filter(Boolean)).size;
    return { revenue, pending, lowStock, outOfStock, customers };
  }, [orders, inventory]);

  const statusRows = useMemo(() => {
    const labels: Record<string, string> = {
      PENDING_PAYMENT: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      PACKING: 'Đang chuẩn bị',
      READY_TO_SHIP: 'Chờ giao hàng',
      SHIPPED: 'Đang giao',
      DELIVERED: 'Đã giao',
      CANCELLED: 'Đã hủy',
    };
    const counts = new Map<string, number>();
    orders.forEach((order) => {
      const status = order.status?.toUpperCase() || 'CHUA_CAP_NHAT';
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
    return [...counts.entries()].map(([status, count]) => ({
      status,
      label: labels[status] ?? 'Chưa cập nhật',
      count,
    }));
  }, [orders]);

  const cards = [
    { label: 'Doanh thu đã giao', value: formatCurrency(metrics.revenue), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Tổng sản phẩm', value: String(productCount), icon: Package, color: 'bg-blue-50 text-blue-700' },
    { label: 'Đơn đang xử lý', value: String(metrics.pending), icon: ClipboardList, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Khách hàng', value: String(metrics.customers), icon: Users, color: 'bg-violet-50 text-violet-700' },
  ];

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-extrabold">Bảng tổng quan</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi doanh thu, đơn hàng, sản phẩm và tồn kho.</p>
          </div>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: số liệu tổng hợp từ dữ liệu đơn hàng, sản phẩm và tồn kho lưu trong trình duyệt.
          </p>
        )}
        {error && (
          <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!loaded ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(({ label, value, icon: Icon, color }) => (
                <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
                  <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
                </article>
              ))}
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Trạng thái đơn hàng</h2>
                    <p className="mt-1 text-xs text-slate-500">Phân bố tất cả đơn hàng hiện có.</p>
                  </div>
                  <Link to="/admin/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">Xem đơn hàng →</Link>
                </div>
                <div className="mt-5 space-y-3">
                  {statusRows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">Chưa có đơn hàng.</p>
                  ) : statusRows.map((row) => (
                    <div key={row.status} className="grid grid-cols-[140px_1fr_40px] items-center gap-3 text-sm">
                      <span className="truncate text-slate-600">{row.label}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(8, (row.count / Math.max(orders.length, 1)) * 100)}%` }} />
                      </div>
                      <strong className="text-right">{row.count}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="h-5 w-5" /></div>
                  <div>
                    <h2 className="font-bold">Cảnh báo tồn kho</h2>
                    <p className="text-xs text-slate-500">{metrics.lowStock.length} biến thể cần nhập thêm</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {metrics.lowStock.slice(0, 5).map((item) => (
                    <div key={`${item.productName}-${item.variantName}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{item.productName}</p>
                        <p className="truncate text-[11px] text-slate-500">{item.variantName}</p>
                      </div>
                      <span className={`ml-3 rounded-full px-2 py-1 text-[10px] font-bold ${item.stockQuantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        Còn {item.stockQuantity}
                      </span>
                    </div>
                  ))}
                  {metrics.lowStock.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Tồn kho đang ổn định.</p>}
                </div>
                <Link to="/admin/inventory" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  Quản lý tồn kho
                </Link>
              </article>
            </section>

            <section className="mt-5 grid gap-4 sm:grid-cols-3">
              <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Boxes className="h-5 w-5 text-blue-600" /><div><p className="text-xs text-slate-500">Danh mục</p><p className="text-lg font-extrabold">{categoryCount}</p></div></article>
              <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><AlertTriangle className="h-5 w-5 text-amber-600" /><div><p className="text-xs text-slate-500">Sắp hết hàng</p><p className="text-lg font-extrabold">{metrics.lowStock.length}</p></div></article>
              <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Package className="h-5 w-5 text-red-600" /><div><p className="text-xs text-slate-500">Hết hàng</p><p className="text-lg font-extrabold">{metrics.outOfStock}</p></div></article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
