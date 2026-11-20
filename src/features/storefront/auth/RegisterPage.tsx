import { useState, type FC, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Laptop,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Check,
  Tag,
  Truck,
} from 'lucide-react';
import { authService, saveAuthSession, type RegisterRequest } from '../../../services/authService';

export const RegisterPage: FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest | 'terms', string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tính toán tiêu chí mật khẩu
  const hasMinLength = formData.password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[@$!%*?&#]/.test(formData.password);

  const calculatePasswordStrength = (): number => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;
    return score;
  };

  const passwordStrength = calculatePasswordStrength();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterRequest | 'terms', string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Họ và tên tối đa 100 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Địa chỉ email không được để trống';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    if (formData.phone && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải gồm 10 chữ số chuẩn Việt Nam';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Cần tối thiểu 6 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Bạn cần đồng ý với Điều khoản dịch vụ & Chính sách bảo mật';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterRequest]) {
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
      const payload: RegisterRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone?.trim() ? formData.phone.trim() : undefined,
      };

      const response = await authService.register(payload);

      saveAuthSession(response, true);

      navigate('/');
    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 409) {
          setServerError(data?.detail || 'Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        } else if (status === 400) {
          setServerError(data?.detail || 'Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại.');
        } else {
          setServerError('Đã xảy ra sự cố từ máy chủ. Vui lòng thử lại sau.');
        }
      } else {
        setServerError('Không thể kết nối đến máy chủ API. Vui lòng kiểm tra mạng.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Mesh & Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none translate-y-1/3"></div>
      <div className="absolute top-1/2 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="max-w-5xl w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-800 relative z-10">
        {/* Left Column: Brand & VIP Perks Banner */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-indigo-950 p-10 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
          {/* Subtle Radial Glow */}
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
                Đặc quyền thành viên mới
              </div>
              <h2 className="text-3xl font-extrabold leading-tight text-white tracking-tight">
                Gia nhập cộng đồng yêu công nghệ
              </h2>
              <p className="text-slate-300/80 text-sm leading-relaxed">
                Đăng ký tài khoản trong 30 giây để nhận ngay voucher giảm 15% cho đơn hàng đầu tiên cùng vô vàn ưu đãi độc quyền.
              </p>
            </div>
          </div>

          {/* Middle Perk Badges */}
          <div className="relative z-10 my-6 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/60 flex items-center gap-3.5 hover:bg-slate-800/80 transition-all duration-300">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Voucher 15% Chào bạn mới</p>
                <p className="text-[11px] text-slate-400">Áp dụng cho mọi sản phẩm laptop, mobile, phụ kiện</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/60 flex items-center gap-3.5 hover:bg-slate-800/80 transition-all duration-300">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Chính Hãng 100%</p>
                <p className="text-[11px] text-slate-400">Bảo hành 1 đổi 1 & hỗ trợ kỹ thuật trọn đời</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700/60 flex items-center gap-3.5 hover:bg-slate-800/80 transition-all duration-300">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Giao Hàng Siêu Tốc 2H</p>
                <p className="text-[11px] text-slate-400">Miễn phí vận chuyển cho đơn hàng từ 500.000đ</p>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-500 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">A</div>
                <div className="w-6 h-6 rounded-full bg-indigo-500 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">B</div>
                <div className="w-6 h-6 rounded-full bg-purple-500 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">C</div>
              </div>
              <span>50,000+ thành viên tin dùng</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <span>★ 4.9/5</span>
            </div>
          </div>
        </div>

        {/* Right Column: Register Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-slate-900/60">
          {/* Header & Switch Tabs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/70">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Đăng nhập
                </Link>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm"
                >
                  Đăng ký
                </button>
              </div>
              <Link to="/" className="text-xs text-slate-400 hover:text-blue-400 transition flex items-center gap-1">
                Về trang chủ <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Tạo tài khoản mới</h1>
            <p className="text-sm text-slate-400 mt-1">
              Điền thông tin bên dưới để trở thành thành viên chính thức của TechStore
            </p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3 mb-5">
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
          <div className="relative flex items-center justify-center mb-5">
            <div className="w-full border-t border-slate-800"></div>
            <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider relative z-10">
              hoặc đăng ký bằng email
            </span>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs shadow-sm animate-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-fullName"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
              >
                Họ và tên <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="reg-fullName"
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-red-500/80 bg-red-950/20 focus:ring-red-500/30'
                      : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-400 font-medium">{errors.fullName}</p>}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
                >
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500/80 bg-red-950/20 focus:ring-red-500/30'
                        : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
                >
                  Số điện thoại
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0912345678"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? 'border-red-500/80 bg-red-950/20 focus:ring-red-500/30'
                        : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-400 font-medium">{errors.phone}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
              >
                Mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
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

              {/* Password Strength Meter & Interactive Checklist */}
              {formData.password && (
                <div className="mt-2 space-y-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Độ an toàn mật khẩu:</span>
                    <span
                      className={`font-semibold ${
                        passwordStrength <= 1
                          ? 'text-red-400'
                          : passwordStrength <= 2
                          ? 'text-amber-400'
                          : passwordStrength <= 3
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {passwordStrength <= 1
                        ? 'Yếu'
                        : passwordStrength <= 2
                        ? 'Trung bình'
                        : passwordStrength <= 3
                        ? 'Khá'
                        : 'Mạnh & An toàn'}
                    </span>
                  </div>

                  {/* Progress bars */}
                  <div className="flex gap-1.5 h-1.5 w-full">
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= 1 ? 'bg-red-500' : 'bg-slate-700'
                      }`}
                    ></div>
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= 2 ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                    ></div>
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= 3 ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    ></div>
                    <div
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= 4 ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    ></div>
                  </div>

                  {/* Checklist criteria */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <Check className={`w-3 h-3 ${hasMinLength ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span>Tối thiểu 6 ký tự</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <Check className={`w-3 h-3 ${hasUpperCase ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span>Chữ hoa (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <Check className={`w-3 h-3 ${hasNumber ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span>Chữ số (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <Check className={`w-3 h-3 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span>Ký tự đặc biệt (@$!%*?&#)</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.password && <p className="mt-1 text-xs text-red-400 font-medium">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1"
              >
                Xác nhận mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="reg-confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-500/80 bg-red-950/20 focus:ring-red-500/30'
                      : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition focus:outline-none"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="pt-1">
              <div className="flex items-start gap-2">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/30 cursor-pointer shrink-0"
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-400 cursor-pointer select-none leading-relaxed">
                  Tôi đồng ý với{' '}
                  <a href="#terms" className="text-blue-400 hover:underline">
                    Điều khoản dịch vụ
                  </a>{' '}
                  và{' '}
                  <a href="#privacy" className="text-blue-400 hover:underline">
                    Chính sách bảo mật
                  </a>{' '}
                  của TechStore.
                </label>
              </div>
              {errors.terms && <p className="mt-1 text-xs text-red-400 font-medium">{errors.terms}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
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
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký tài khoản TechStore</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Đã có tài khoản TechStore?{' '}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
