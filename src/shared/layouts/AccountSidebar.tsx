import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, LogOut, Mail, MapPin, PackageCheck, Phone, Truck, UserRound } from 'lucide-react';
import { authService, clearAuthSession, getSignedInUserName, retryWithRefreshedSession, type UserProfile } from '../../services/authService';

const links = [
  { to: '/profile/addresses', label: 'Sổ địa chỉ nhận hàng', icon: MapPin },
  { to: '/profile/orders', label: 'Đơn hàng của tôi', icon: PackageCheck },
  { to: '/tracking', label: 'Tra cứu vận đơn', icon: Truck },
];

export function AccountSidebar() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('user') || localStorage.getItem('user');
      return saved ? JSON.parse(saved) as UserProfile : null;
    } catch {
      return null;
    }
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const roles = (profile?.roles ?? []).map((role) =>
    role.trim().toUpperCase().replace(/[\s-]+/g, '_'),
  );
  const adminPath = roles.includes('OWNER')
    ? '/admin/categories'
    : roles.includes('WAREHOUSE_STAFF')
      ? '/admin/inventory'
      : null;

  useEffect(() => {
    if (!token) return;
    let active = true;
    retryWithRefreshedSession(token, authService.getCurrentUser)
      .then((user) => { if (active) setProfile(user); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [token]);

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

  return (
    <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:sticky lg:top-28">
      <div className="p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-blue-50 bg-blue-100 text-blue-700"><UserRound className="h-6 w-6" /></div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-slate-950">{profile?.fullName || getSignedInUserName() || 'Khách hàng'}</h2>
            <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{profile?.roles?.join(', ') || (token ? 'CUSTOMER' : 'DEMO')}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
          <p className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><span className="break-all">{profile?.email || 'Chưa cập nhật email'}</span></p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-blue-600" />{profile?.phone || 'Chưa cập nhật số điện thoại'}</p>
        </div>
      </div>
      <nav aria-label="Điều hướng tài khoản" className="border-t border-slate-100 p-3">
        <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {adminPath && (
            <li className="shrink-0 lg:shrink">
              <NavLink to={adminPath} className="flex min-h-11 items-center gap-3 rounded-xl border-l-4 border-transparent px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700">
                <LayoutDashboard aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>Vào trang quản trị</span>
              </NavLink>
            </li>
          )}
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to} className="shrink-0 lg:shrink">
              <NavLink to={to} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl border-l-4 px-3 text-sm font-semibold transition ${isActive ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}>
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /><span>{label}</span>
              </NavLink>
            </li>
          ))}
          <li className="shrink-0 lg:mt-2 lg:shrink">
            <button type="button" onClick={logout} disabled={loggingOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
              <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
