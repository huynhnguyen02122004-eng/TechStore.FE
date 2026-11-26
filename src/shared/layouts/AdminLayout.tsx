import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bell,
  Boxes,
  ChevronRight,
  CreditCard,
  FolderTree,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Store,
  Tags,
  Truck,
  UserRound,
  Warehouse,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  authService,
  clearAuthSession,
  getSavedUserProfile,
  retryWithRefreshedSession,
  type UserProfile,
} from '../../services/authService';

type AdminRole = 'OWNER' | 'WAREHOUSE_STAFF';

interface AdminMenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface AdminMenuGroup {
  label: string;
  items: AdminMenuItem[];
}

const warehouseAllowedPaths = new Set([
  '/admin/inventory',
  '/admin/inventory/transactions',
  '/admin/shipments',
  '/admin/products',
  '/admin/orders',
]);

const menuGroups: AdminMenuGroup[] = [
  {
    label: 'Hàng hóa',
    items: [
      { to: '/admin/categories', label: 'Quản lý danh mục', icon: FolderTree },
      { to: '/admin/brands', label: 'Quản lý thương hiệu', icon: Tags },
      { to: '/admin/products', label: 'Quản lý sản phẩm', icon: Package },
    ],
  },
  {
    label: 'Bán hàng',
    items: [
      { to: '/admin/orders', label: 'Quản lý đơn hàng', icon: ReceiptText },
      { to: '/admin/payments', label: 'Thanh toán', icon: CreditCard },
      { to: '/admin/shipments', label: 'Vận đơn', icon: Truck },
    ],
  },
  {
    label: 'Kho vận',
    items: [
      { to: '/admin/inventory', label: 'Quản lý tồn kho', icon: Warehouse },
      { to: '/admin/inventory/transactions', label: 'Lịch sử & Giữ hàng', icon: Boxes },
    ],
  },
];

const breadcrumbLabels: Record<string, string> = {
  admin: 'Quản trị',
  categories: 'Danh mục',
  brands: 'Thương hiệu',
  products: 'Sản phẩm',
  orders: 'Đơn hàng',
  payments: 'Thanh toán',
  shipments: 'Vận đơn',
  inventory: 'Tồn kho',
  transactions: 'Lịch sử & Giữ hàng',
};

function normalizeRoles(profile: UserProfile | null): string[] {
  return (profile?.roles ?? []).map((role) => role.trim().toUpperCase().replace(/[\s-]+/g, '_'));
}

function getAdminRole(profile: UserProfile | null, token: string): AdminRole | null {
  if (!token) return 'OWNER';
  const roles = normalizeRoles(profile);
  if (roles.includes('OWNER')) return 'OWNER';
  if (roles.includes('WAREHOUSE_STAFF')) return 'WAREHOUSE_STAFF';
  return null;
}

function filterMenuGroups(role: AdminRole | null): AdminMenuGroup[] {
  if (role === 'WAREHOUSE_STAFF') {
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => warehouseAllowedPaths.has(item.to)),
      }))
      .filter((group) => group.items.length > 0);
  }
  return role === 'OWNER' ? menuGroups : [];
}

function roleLabel(role: AdminRole | null, token: string): string {
  if (!token) return 'OWNER · Chế độ demo';
  if (role === 'OWNER') return 'OWNER';
  if (role === 'WAREHOUSE_STAFF') return 'WAREHOUSE_STAFF';
  return 'Không có quyền quản trị';
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || '';
  const [profile, setProfile] = useState<UserProfile | null>(() => getSavedUserProfile());
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = getAdminRole(profile, token);
  const visibleGroups = filterMenuGroups(role);

  useEffect(() => {
    if (!token) return;
    let active = true;
    retryWithRefreshedSession(token, authService.getCurrentUser)
      .then((user) => {
        if (!active) return;
        setProfile(user);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  if (token && role === null) return <Navigate to="/" replace />;
  if (role === 'WAREHOUSE_STAFF' && !warehouseAllowedPaths.has(location.pathname)) {
    return <Navigate to="/admin/inventory" replace />;
  }

  const logout = async () => {
    if (!window.confirm('Bạn có chắc muốn đăng xuất?')) return;
    setLoggingOut(true);
    try {
      if (token) await retryWithRefreshedSession(token, authService.logout);
    } catch (error) {
      if (!(axios.isAxiosError(error) && error.response?.status === 401)) return;
    } finally {
      clearAuthSession();
      navigate('/', { replace: true });
    }
  };

  const segments = location.pathname.split('/').filter(Boolean);
  const displayName = profile?.fullName || 'Quản trị viên';
  const sidebar = (
    <aside className="flex h-full w-[245px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[68px] items-center border-b border-slate-100 px-5">
        <Link to="/" className="flex items-center gap-3" aria-label="TechStore - Về cửa hàng">
          <img src="/techstore-mark.svg" alt="" className="h-9 w-9" />
          <span>
            <strong className="block text-[17px] leading-none text-slate-900">TechStore</strong>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin Center</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng quản trị">
        {visibleGroups.map((group) => (
          <section key={group.label} className="mb-5">
            <h2 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</h2>
            <ul className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg py-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? 'bg-blue-50 font-semibold text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <UserRound className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900" title={displayName}>{displayName}</p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{roleLabel(role, token)}</p>
          </div>
        </div>
        <Link to="/" className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
          <Store className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          Về cửa hàng
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="mt-1 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:flex">
      <div className="hidden h-screen sticky top-0 lg:block">{sidebar}</div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Đóng menu quản trị" className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <button type="button" aria-label="Đóng menu" onClick={() => setMobileMenuOpen(false)} className="absolute right-2 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Mở menu quản trị" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center text-sm">
              {segments.map((segment, index) => (
                <span key={`${segment}-${index}`} className="flex min-w-0 items-center">
                  {index > 0 && <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
                  <span className={index === segments.length - 1 ? 'truncate font-semibold text-slate-800' : 'truncate text-slate-500'}>
                    {breadcrumbLabels[segment] || segment}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" aria-label="Thông báo" className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />
            </button>
            <div className="hidden h-8 border-l border-slate-200 sm:block" />
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-36 truncate text-xs font-bold text-slate-900">{displayName}</p>
              <p className="mt-0.5 max-w-36 truncate text-[10px] font-medium text-slate-500">{roleLabel(role, token)}</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <UserRound className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
