import { useState, type FC, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Laptop,
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Smartphone,
  Headphones,
} from 'lucide-react';
import { authService, type LoginRequest } from '../services/authService';

export const LoginPage: FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginRequest, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoginRequest, string>> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginRequest]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authService.login(formData);

      if (rememberMe) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        sessionStorage.setItem('accessToken', response.accessToken);
        sessionStorage.setItem('user', JSON.stringify(response.user));
      }

      navigate('/');
    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          setServerError('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.');
        } else if (status === 404) {
          setServerError('Tài khoản không tồn tại. Vui lòng đăng ký tài khoản mới.');
        } else {
          setServerError(data?.detail || 'Đã xảy ra lỗi trong quá trình xác thực.');
        }
      } else {
        setServerError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Mesh & Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none translate-y-1/3"></div>
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="max-w-5xl w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800 relative z-10">
        {/* Left Column: TechStore Brand Showcase */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-indigo-950 p-10 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
          {/* Subtle Radial Glow inside column */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                <Laptop className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
                  TechStore
                </span>
                <span className="text-[10px] uppercase tracking-widest text-blue-300/80 font-semibold">
                  Official Electronics
                </span>
              </div>
            </Link>

            <div className="mt-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Chào mừng bạn trở lại!
              </div>
              <h2 className="text-3xl font-extrabold leading-tight text-white tracking-tight">
                Không gian mua sắm công nghệ đẳng cấp
              </h2>
              <p className="text-slate-300/80 text-sm leading-relaxed">
                Đăng nhập để theo dõi đơn hàng thời gian thực, lưu sản phẩm yêu thích và nhận thông báo ưu đãi độc quyền.
              </p>
            </div>
          </div>

          {/* Middle Interactive Mini Cards */}
          <div className="relative z-10 my-8 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/60 flex items-center justify-between hover:bg-slate-800/80 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">iPhone 16 Pro Max</p>
                  <p className="text-[11px] text-slate-400">Đang có sẵn hàng tại kho</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                -15%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/60 flex items-center justify-between hover:bg-slate-800/80 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Sony WH-1000XM5</p>
                  <p className="text-[11px] text-slate-400">Chống ồn chủ động đỉnh cao</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                Freeship
              </span>
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bảo hành chính hãng 1 đổi 1 trong 30 ngày</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Giao hàng hỏa tốc trong 2 giờ nội thành</span>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-slate-900/60">
          {/* Header & Switch Tabs */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/70">
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm"
                >
                  Đăng nhập
                </button>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Đăng ký
                </Link>
              </div>
              <Link to="/" className="text-xs text-slate-400 hover:text-blue-400 transition flex items-center gap-1">
                Về trang chủ <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Đăng nhập tài khoản</h1>
            <p className="text-sm text-slate-400 mt-1">
              Nhập email và mật khẩu của bạn để truy cập hệ thống TechStore
            </p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.79 1.06-1.88.94-2.98-.95.04-2.14.64-2.81 1.43-.59.68-1.11 1.79-.97 2.87 1.06.08 2.18-.54 2.84-1.32z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-slate-800"></div>
            <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider relative z-10">
              hoặc qua email
            </span>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs shadow-sm animate-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Địa chỉ email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-500/80 bg-red-950/20 focus:ring-red-500/30'
                      : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400 font-medium">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Mật khẩu <span className="text-red-400">*</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Tính năng khôi phục mật khẩu đang được tích hợp qua email.');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-500/80 bg-red-950/20 focus:ring-red-500/30'
                      : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition focus:outline-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400 font-medium">{errors.password}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-300 cursor-pointer select-none">
                Ghi nhớ đăng nhập trên thiết bị này
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="mt-8 text-center text-xs text-slate-400">
            Chưa có tài khoản TechStore?{' '}
            <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
