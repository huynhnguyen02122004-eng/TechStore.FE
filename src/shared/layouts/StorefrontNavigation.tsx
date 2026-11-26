import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck, ChevronDown, ClipboardList, MapPin, Menu, Repeat2, Search, ShoppingBag, Store, Truck, UserRound } from 'lucide-react';
import { cartUpdatedEvent, getCartItemCount, getCurrentAccessToken } from '../../services/cartService';
import { authSessionUpdatedEvent, clearLegacyBrowserCarts, getSavedUserProfile, getSignedInUserName } from '../../services/authService';

export function StorefrontNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [headerSearch, setHeaderSearch] = useState(
    () => new URLSearchParams(location.search).get('searchTerm') ?? '',
  );
  const [cartCount, setCartCount] = useState(0);
  const [token, setToken] = useState(getCurrentAccessToken);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const userName = getSignedInUserName();
  const profile = getSavedUserProfile();
  const roles = (profile?.roles ?? []).map((role) =>
    role.trim().toUpperCase().replace(/[\s-]+/g, '_'),
  );
  const isOwner = roles.includes('OWNER');
  const isWarehouseStaff = roles.includes('WAREHOUSE_STAFF');
  const accountPath = isOwner
    ? '/admin/categories'
    : isWarehouseStaff
      ? '/admin/inventory'
      : userName
        ? '/profile/addresses'
        : '/login';
  const accountDescription = isOwner
    ? 'Trang quản trị'
    : isWarehouseStaff
      ? 'Khu vực kho vận'
      : userName
        ? 'Hồ sơ & sổ địa chỉ'
        : 'Đăng nhập / Đăng ký';
  const storeNoticeItems = <>
    <span className="flex items-center gap-2"><Truck aria-hidden="true" className="h-4 w-4" />Giao nhanh - Miễn phí cho đơn 1 Triệu</span>
    <span aria-hidden="true" className="text-white/50">•</span>
    <span className="flex items-center gap-2"><Repeat2 aria-hidden="true" className="h-4 w-4" />Thu cũ giá ngon - Lên đời tiết kiệm</span>
    <span aria-hidden="true" className="text-white/50">•</span>
    <span className="flex items-center gap-2"><BadgeCheck aria-hidden="true" className="h-4 w-4" />Sản phẩm chính hãng - Xuất VAT</span>
    <span aria-hidden="true" className="text-white/50">•</span>
    <Link to="/" className="flex items-center gap-2 hover:text-white/80"><Store aria-hidden="true" className="h-4 w-4" />Cửa hàng gần bạn</Link>
    <span aria-hidden="true" className="text-white/50">•</span>
    <Link to="/tracking" className="flex items-center gap-2 hover:text-white/80"><ClipboardList aria-hidden="true" className="h-4 w-4" />Tra cứu đơn hàng</Link>
    <span aria-hidden="true" className="text-white/50">•</span>
  </>;

  useEffect(() => {
    clearLegacyBrowserCarts();
    const refreshToken = () => setToken(getCurrentAccessToken());
    window.addEventListener(authSessionUpdatedEvent, refreshToken);
    window.addEventListener('storage', refreshToken);
    return () => {
      window.removeEventListener(authSessionUpdatedEvent, refreshToken);
      window.removeEventListener('storage', refreshToken);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const updateCartCount = async () => {
      if (!token) {
        setCartCount(0);
        return;
      }
      try {
        const count = await getCartItemCount(token);
        if (active) setCartCount(count);
      } catch {
        if (active) setCartCount(0);
      }
    };
    const handleCartUpdate = () => { void updateCartCount(); };
    void updateCartCount();
    window.addEventListener(cartUpdatedEvent, handleCartUpdate);
    return () => {
      active = false;
      window.removeEventListener(cartUpdatedEvent, handleCartUpdate);
    };
  }, [token]);

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
          <Link to="/" className="flex shrink-0 items-center gap-2 text-[19px] font-black leading-none tracking-tight sm:text-[24px]" aria-label="TechStore - Trang chủ">
            <img src="/techstore-mark.svg" alt="" className="h-10 w-10" />
            <span>
            <span className="block">TechStore</span>
            <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.2em] text-blue-100">công nghệ trong tầm tay</span>
            </span>
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

          <Link to={accountPath} aria-label={userName ?? 'Đăng nhập'} className="hidden shrink-0 items-center gap-2 text-sm font-semibold sm:flex">
            <UserRound className="h-5 w-5" />
            <span className="hidden max-w-28 truncate lg:inline-block" title={userName ?? undefined}>{userName ?? 'Đăng nhập'}</span>
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
      <div className="overflow-hidden bg-[#0f56bd] text-white" aria-label="Thông tin cửa hàng">
        <div className="flex min-h-10 items-center overflow-hidden">
          <div className="flex w-max animate-[storefront-marquee_34s_linear_infinite] items-center whitespace-nowrap text-xs font-bold motion-reduce:animate-none sm:text-sm">
            <div className="flex items-center gap-3 px-4">{storeNoticeItems}</div>
            <div aria-hidden="true" className="flex items-center gap-3 px-4">{storeNoticeItems}</div>
          </div>
        </div>
      </div>
      <div className="border-b border-slate-200/80 bg-[#0f56bd]">
        <div className="mx-auto grid min-h-[74px] max-w-7xl grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:grid-cols-[180px_minmax(0,1fr)_auto_auto] sm:gap-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-white" aria-label="TechStore - Trang chủ">
            <img src="/techstore-mark.svg" alt="" className="h-11 w-11 drop-shadow-md" />
            <div>
              <span className="block text-[20px] font-extrabold leading-none tracking-tight">TechStore</span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.2em] text-blue-100">Công nghệ trong tầm tay</span>
            </div>
          </Link>

          <form onSubmit={submitHeaderSearch} className="relative mx-auto w-full max-w-[480px] min-w-0">
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

          <a href="tel:18006868" className="hidden shrink-0 items-center text-xs font-semibold text-white xl:flex">Hotline: 1800 6868</a>

          <div className="flex items-center gap-5 text-white">
            <Link to={accountPath} className="hidden items-center gap-2 lg:flex">
              <UserRound className="h-6 w-6" />
              <div className="text-[12px] leading-tight">
                <strong className="block max-w-36 truncate" title={userName ?? undefined}>{userName ?? 'Tài khoản'}</strong>
                <span className="text-[10px] text-blue-100">{accountDescription}</span>
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

