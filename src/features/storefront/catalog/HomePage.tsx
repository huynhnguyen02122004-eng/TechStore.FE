import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Laptop,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  PackageCheck,
} from 'lucide-react';
import {
  catalogService,
  type BrandResponse,
  type CategoryResponse,
  type PagedResult,
  type ProductResponse,
} from '../../../services/catalogService';

const emptyPage: PagedResult<ProductResponse> = {
  items: [],
  pageIndex: 1,
  totalPages: 0,
  totalCount: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export function HomePage() {
  const [urlParams] = useSearchParams();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [products, setProducts] = useState<PagedResult<ProductResponse>>(emptyPage);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlSearch = urlParams.get('searchTerm') ?? '';
    setSearchInput(urlSearch);
    setSearchTerm(urlSearch);
  }, [urlParams]);

  useEffect(() => {
    let active = true;

    Promise.all([catalogService.getCategories(), catalogService.getBrands()])
      .then(([categoryData, brandData]) => {
        if (!active) return;
        setCategories(categoryData);
        setBrands(brandData);
      })
      .catch(() => {
        if (active) setError('Không thể tải danh mục và thương hiệu.');
      })
      .finally(() => {
        if (active) setIsLoadingFilters(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setIsLoadingProducts(true);
    setError(null);

    catalogService
      .getProducts({ pageIndex, pageSize, categoryId: categoryId || undefined, brandId: brandId || undefined, searchTerm })
      .then((data) => {
        if (!active) return;
        setProducts({
          ...data,
          items: data.items.filter((product) => !product.status || product.status.toUpperCase() === 'ACTIVE'),
        });
      })
      .catch(() => {
        if (active) setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setIsLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [pageIndex, pageSize, categoryId, brandId, searchTerm]);

  const activeFilterCount = useMemo(
    () => Number(Boolean(categoryId)) + Number(Boolean(brandId)) + Number(Boolean(searchTerm)),
    [categoryId, brandId, searchTerm],
  );

  const clearFilters = () => {
    setCategoryId('');
    setBrandId('');
    setSearchInput('');
    setSearchTerm('');
    setPageIndex(1);
  };

  const handlePageSize = (event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setPageIndex(1);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      <section className="bg-[#f5f7fb] pt-10 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative min-h-[370px] overflow-hidden rounded-2xl bg-[#1b64c7]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_45%,rgba(88,151,255,0.75),transparent_28%)]" />
            <div className="relative z-10 grid min-h-[370px] grid-cols-1 items-center lg:grid-cols-[48%_52%]">
              <div className="px-8 py-12 sm:px-14">
                <div className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                  Tech Week · Ưu đãi độc quyền
                </div>
                <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-[46px]">
                  Công nghệ mới.
                  <span className="block">Giá hời hơn.</span>
                </h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                  Nâng cấp trải nghiệm mới ngày với những thiết bị công nghệ chính hãng, tuyển chọn dành riêng cho bạn.
                </p>
                <div className="mt-7 flex items-center gap-4">
                  <Link to="/" className="inline-flex h-12 items-center rounded-lg bg-white px-6 text-sm font-bold text-[#1b64c7] shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5">
                    Khám phá ngay <span className="ml-2">→</span>
                  </Link>
                  <div className="hidden items-center sm:flex">
                    <div className="ml-[-10px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#7ca7df] text-[10px] font-bold first:ml-0">B</div>
                    <div className="ml-[-8px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#4d7dca] text-[10px] font-bold">M</div>
                    <div className="ml-[-8px] mr-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#85abc9] text-[10px] font-bold">A</div>
                    <span className="text-[10px] leading-tight text-blue-100"><strong className="block text-white">12,000+</strong>khách hàng tin chọn</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block">
                <div className="absolute inset-y-6 left-12 right-[-40px] rotate-[-4deg] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/30 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1100&q=85"
                    alt="Laptop công nghệ"
                    className="h-full w-full object-cover opacity-90"
                  />
                </div>
                <div className="absolute bottom-10 right-14 flex min-w-[210px] items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-800 shadow-xl">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1b64c7]">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div className="text-xs">
                    <strong className="block">MacBook Air M3</strong>
                    <span className="text-[10px] text-slate-400">Hiệu năng vượt trội</span>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-red-500">-11%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Truck, 'Giao nhanh 2H', 'Nội thành TP.HCM'],
              [ShieldCheck, 'Chính hãng 100%', 'Cấp bảo 10-6 tháng'],
              [PackageCheck, 'Bảo hành uy tín', 'Đổi mới trong 30 ngày'],
              [PackageCheck, 'Trả góp 0%', 'Thủ tục đơn giản nhanh chóng'],
            ].map(([Icon, title, description]) => (
              <div key={String(title)} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#1b64c7]">
                  {typeof Icon !== 'string' && <Icon className="h-5 w-5" />}
                </div>
                <div>
                  <strong className="block text-xs text-slate-800">{String(title)}</strong>
                  <span className="mt-1 block text-[10px] text-slate-400">{String(description)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div role="alert" className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
          <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 font-bold">
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-[11px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="text-xs text-slate-400 hover:text-white">
                  Xóa hết
                </button>
              )}
            </div>

            {isLoadingFilters ? (
              <div className="space-y-3" aria-label="Đang tải bộ lọc">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-8 rounded-lg bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <>
                <fieldset className="pb-5 border-b border-slate-800">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Danh mục</legend>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center gap-3 py-1 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoryId === category.id}
                          onChange={() => {
                            setCategoryId(categoryId === category.id ? '' : category.id);
                            setPageIndex(1);
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-600"
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="pt-5">
                  <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Thương hiệu</legend>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center gap-3 py-1 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={brandId === brand.id}
                          onChange={() => {
                            setBrandId(brandId === brand.id ? '' : brand.id);
                            setPageIndex(1);
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-600"
                        />
                        {brand.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
          </aside>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <p className="text-sm text-slate-400" aria-live="polite">
                Tìm thấy <strong className="text-white">{products.totalCount}</strong> sản phẩm phù hợp
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                Hiển thị
                <span className="relative">
                  <select
                    value={pageSize}
                    onChange={handlePageSize}
                    className="h-10 appearance-none rounded-xl border border-slate-700 bg-slate-900 pl-3 pr-9 text-sm text-white outline-none focus:border-blue-500"
                    aria-label="Số sản phẩm mỗi trang"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                </span>
              </label>
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, index) => (
                  <div key={index} className="h-72 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
                ))}
              </div>
            ) : products.items.length === 0 ? (
              <div className="min-h-72 rounded-2xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center px-6">
                <Laptop className="w-10 h-10 text-slate-600 mb-3" />
                <h2 className="text-lg font-bold">Không tìm thấy sản phẩm</h2>
                <p className="mt-1 text-sm text-slate-400">Hãy thay đổi từ khóa hoặc bỏ một bộ lọc.</p>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={clearFilters} className="mt-4 h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.items.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                        {product.primaryImageUrl || product.imageUrl ? (
                          <img
                            src={product.primaryImageUrl || product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Laptop className="w-16 h-16 text-slate-600 group-hover:text-blue-400 transition-colors" aria-hidden="true" />
                        )}
                        {product.categoryName && (
                          <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-300">
                            {product.categoryName}
                          </span>
                        )}
                        {product.brandName && (
                          <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                            {product.brandName}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h2 className="font-bold text-base leading-snug line-clamp-2 min-h-12 group-hover:text-blue-300 transition-colors">
                          {product.name}
                        </h2>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Bảo hành {product.warrantyMonths ?? 0} tháng
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {products.totalPages > 1 && (
                  <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Phân trang sản phẩm">
                    <button
                      type="button"
                      disabled={!products.hasPreviousPage}
                      onClick={() => setPageIndex((current) => Math.max(1, current - 1))}
                      className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 hover:border-slate-600"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Trước
                    </button>
                    <span className="h-10 px-4 rounded-xl border border-slate-800 bg-slate-900/70 text-sm flex items-center">
                      Trang <strong className="mx-1 text-white">{products.pageIndex}</strong> / {products.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!products.hasNextPage}
                      onClick={() => setPageIndex((current) => current + 1)}
                      className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 hover:border-slate-600"
                    >
                      Sau
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
