import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useState, type FormEvent } from 'react';
import { ChevronDown, MapPin, Menu, Search, ShoppingBag, UserRound } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutResultPage } from './pages/CheckoutResultPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProfileAddressesPage } from './pages/ProfileAddressesPage';
import { ShipmentTrackingPage } from './pages/ShipmentTrackingPage';
import { demoCartService, demoCartUpdatedEvent } from './services/demoCartService';
import { useEffect } from 'react';

const CategoryManagementPage = lazy(() =>
  import('./pages/CategoryManagementPage').then(({ CategoryManagementPage: page }) => ({ default: page })),
);
const BrandManagementPage = lazy(() =>
  import('./pages/BrandManagementPage').then(({ BrandManagementPage: page }) => ({ default: page })),
);
const ProductManagementPage = lazy(() =>
  import('./pages/ProductManagementPage').then(({ ProductManagementPage: page }) => ({ default: page })),
);
const OrderManagementPage = lazy(() =>
  import('./pages/OrderManagementPage').then(({ OrderManagementPage: page }) => ({ default: page })),
);
const PaymentManagementPage = lazy(() =>
  import('./pages/PaymentManagementPage').then(({ PaymentManagementPage: page }) => ({ default: page })),
);
const ShipmentManagementPage = lazy(() =>
  import('./pages/ShipmentManagementPage').then(({ ShipmentManagementPage: page }) => ({ default: page })),
);
const InventoryManagementPage = lazy(() =>
  import('./pages/InventoryManagementPage').then(({ InventoryManagementPage: page }) => ({ default: page })),
);
const InventoryTransactionPage = lazy(() =>
  import('./pages/InventoryTransactionPage').then(({ InventoryTransactionPage: page }) => ({ default: page })),
);

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [headerSearch, setHeaderSearch] = useState(
    () => new URLSearchParams(location.search).get('searchTerm') ?? '',
  );
  const [cartCount, setCartCount] = useState(() => demoCartService.getItemCount());
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const updateCartCount = () => setCartCount(demoCartService.getItemCount());
    window.addEventListener(demoCartUpdatedEvent, updateCartCount);
    return () => window.removeEventListener(demoCartUpdatedEvent, updateCartCount);
  }, []);

  const submitHeaderSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);
    if (headerSearch.trim()) params.set('searchTerm', headerSearch.trim());
    else params.delete('searchTerm');
    navigate({ pathname: '/', search: params.toString() ? `?${params}` : '' });
  };

  if (isAuthPage) return null;

  if (location.pathname.startsWith('/product/')) {
    return (
      <header className="sticky top-0 z-50 border-b border-blue-700 bg-[#0f56bd] text-white shadow-sm">
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center gap-3 px-3 sm:gap-5 sm:px-6">
          <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1556bd] shadow-sm" aria-label="Mở danh mục">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="shrink-0 text-[19px] font-black italic leading-none tracking-tight sm:text-[24px]" aria-label="TechStore - Trang chủ">
            <span className="block">techstore</span>
            <span className="mt-1 block text-center text-[8px] font-bold uppercase not-italic tracking-[0.3em]">tech for everyone</span>
          </Link>

          <form onSubmit={submitHeaderSearch} className="relative mx-auto w-full max-w-[440px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              className="h-11 w-full rounded-xl border-0 bg-white pl-11 pr-14 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
              placeholder="Tìm điện thoại, laptop, phụ kiện..."
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
              Tìm
            </button>
          </form>

          <Link to="/login" className="hidden shrink-0 items-center gap-2 text-sm font-semibold sm:flex">
            <UserRound className="h-5 w-5" />
            <span className="hidden lg:inline">Đăng nhập</span>
          </Link>
          <Link to="/cart" className="flex shrink-0 items-center gap-2 text-sm font-semibold" aria-label="Giỏ hàng">
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden lg:inline">Giỏ hàng</span>
            {cartCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
          </Link>
          <button type="button" className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium hover:bg-white/20 xl:flex">
            <MapPin className="h-4 w-4" />
            Chọn khu vực
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="h-8 bg-[#1649a7] text-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 text-[11px] sm:px-6 lg:px-8">
          <span className="font-medium">Miễn phí giao hàng đơn từ 1 triệu</span>
          <div className="hidden items-center gap-4 md:flex">
            <span>Hotline: <strong>1800 6868</strong></span>
            <span>Hệ thống cửa hàng</span>
            <Link to="/profile/orders" className="hover:text-blue-100">Đơn hàng của tôi</Link>
            <Link to="/tracking" className="hover:text-blue-100">Tra cứu vận đơn</Link>
            <Link to="/profile/addresses" className="hover:text-blue-100">Sổ địa chỉ</Link>
            <Link to="/admin/categories" className="hover:text-blue-100">Quản lý danh mục</Link>
            <Link to="/admin/brands" className="hover:text-blue-100">Quản lý thương hiệu</Link>
            <Link to="/admin/products" className="hover:text-blue-100">Quản lý sản phẩm</Link>
            <Link to="/admin/orders" className="hover:text-blue-100">Quản lý đơn hàng</Link>
            <Link to="/admin/payments" className="hover:text-blue-100">Quản lý thanh toán</Link>
            <Link to="/admin/shipments" className="hover:text-blue-100">Quản lý vận đơn</Link>
            <Link to="/admin/inventory" className="hover:text-blue-100">Quản lý tồn kho</Link>
            <Link to="/admin/inventory/transactions" className="hover:text-blue-100">Lịch sử & Giữ hàng</Link>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/80 bg-[#0f56bd]">
        <div className="mx-auto grid h-[74px] max-w-7xl grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:grid-cols-[180px_minmax(180px,1fr)_auto] sm:gap-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-white" aria-label="TechStore - Trang chủ">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white shadow-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1b63c6]">
                <ChevronDown className="h-4 w-4 -rotate-90 text-white" />
              </div>
            </div>
            <div>
              <span className="block text-[20px] font-extrabold leading-none tracking-tight">techstore</span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.28em] text-blue-100">Tech for everyone</span>
            </div>
          </Link>

          <form onSubmit={submitHeaderSearch} className="relative mx-auto w-full max-w-[480px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              className="h-11 w-full rounded-lg border-0 bg-white pl-11 pr-14 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Bạn muốn tìm gì hôm nay?"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-400" aria-label="Tìm kiếm">
              Tìm
            </button>
          </form>

          <div className="flex items-center gap-5 text-white">
            <Link to="/login" className="hidden items-center gap-2 lg:flex">
              <UserRound className="h-6 w-6" />
              <div className="text-[12px] leading-tight">
                <strong className="block">Tài khoản</strong>
                <span className="text-[10px] text-blue-100">Đăng nhập / Đăng ký</span>
              </div>
            </Link>
            <Link to="/cart" className="flex items-center gap-2" aria-label="Giỏ hàng">
              <ShoppingBag className="h-6 w-6" />
              <div className="hidden text-[12px] leading-tight md:block">
                <strong className="block">Giỏ hàng</strong>
                <span className="text-[10px] text-blue-100">{cartCount} sản phẩm</span>
              </div>
              {cartCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-100 bg-white text-slate-700">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 text-[12px] sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <button type="button" className="flex items-center gap-2 font-semibold text-slate-700">
              <Menu className="h-4 w-4" />
              Danh mục sản phẩm
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <Link to="/" className="hidden hover:text-[#1556bd] md:block">Sản phẩm mới</Link>
            <Link to="/" className="hidden hover:text-[#1556bd] md:block">Laptop</Link>
            <Link to="/" className="hidden hover:text-[#1556bd] md:block">Điện thoại</Link>
            <Link to="/" className="hidden hover:text-[#1556bd] md:block">Máy tính bảng</Link>
            <Link to="/" className="hidden hover:text-[#1556bd] lg:block">Phụ kiện</Link>
            <Link to="/" className="hidden hover:text-[#1556bd] lg:block">Khuyến mãi</Link>
          </div>
          <Link to="/register" className="hidden items-center gap-1.5 font-semibold text-[#1556bd] sm:flex">
            Ưu đãi thành viên <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/result" element={<CheckoutResultPage />} />
        <Route path="/profile/orders" element={<MyOrdersPage />} />
        <Route path="/profile/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/profile/addresses" element={<ProfileAddressesPage />} />
        <Route path="/tracking" element={<ShipmentTrackingPage />} />
        <Route
          path="/admin/categories"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <CategoryManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/brands"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <BrandManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/products"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <ProductManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/orders"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <OrderManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/payments"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <PaymentManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/shipments"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <ShipmentManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/inventory"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <InventoryManagementPage />
            </Suspense>
          )}
        />
        <Route
          path="/admin/inventory/transactions"
          element={(
            <Suspense fallback={<main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />}>
              <InventoryTransactionPage />
            </Suspense>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
