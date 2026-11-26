import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Laptop,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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

const bannerSlides = [
  {
    eyebrow: 'TECHSTORE · ƯU ĐÃI MỖI NGÀY',
    title: 'Công nghệ trong tầm tay',
    description: 'Sản phẩm chính hãng – Giá tốt mỗi ngày.',
    image: '/banners/phones.jpg',
    imageAlt: 'Điện thoại và tai nghe không dây',
    productLink: '',
  },
  {
    eyebrow: 'HIỆU NĂNG CHO MỌI HÀNH TRÌNH',
    title: 'Bứt phá giới hạn cùng laptop mới',
    description: 'Chọn thiết bị mạnh mẽ cho học tập, công việc và sáng tạo.',
    image: '/banners/laptops.jpg',
    imageAlt: 'Laptop hiện đại trên bàn làm việc',
    productLink: '',
  },
  {
    eyebrow: 'ÂM THANH · PHỤ KIỆN',
    title: 'Đắm chìm trong chất âm riêng',
    description: 'Phụ kiện công nghệ tinh tế, nâng tầm từng khoảnh khắc.',
    image: '/banners/audio.jpg',
    imageAlt: 'Tai nghe chụp tai màu đen',
    productLink: '',
  },
  {
    eyebrow: 'THIẾT BỊ · PHỤ KIỆN CHÍNH HÃNG',
    title: 'Nâng cấp góc công nghệ của bạn',
    description: 'Khám phá thiết bị phù hợp với phong cách và nhu cầu mỗi ngày.',
    image: '/banners/gadgets.jpg',
    imageAlt: 'Laptop, điện thoại và tai nghe trên nền sáng',
    productLink: '',
  },
  {
    eyebrow: 'MUA SẮM THÔNG MINH TẠI TECHSTORE',
    title: 'Chọn đúng thiết bị, sẵn sàng bứt phá',
    description: 'Sản phẩm chính hãng, tư vấn tận tâm và giá tốt mỗi ngày.',
    image: '/banners/work-setup.jpg',
    imageAlt: 'Nhiều thiết bị công nghệ trên bàn làm việc',
    productLink: '',
  },
];

function ProductWarrantyLabel({ productId }: { productId: string }) {
  const [label, setLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    catalogService
      .getVariants(productId)
      .then((variants) => {
        const variant = variants.find((item) => !item.status || item.status.toUpperCase() === 'ACTIVE');
        return variant ? catalogService.getVariantSpecifications(variant.id) : [];
      })
      .then((specifications) => {
        if (!active) return;
        const warranty = specifications.find((specification) =>
          /bảo hành|warranty/i.test(specification.specName),
        );
        setLabel(
          warranty
            ? [warranty.specName.trim(), warranty.specValue.trim(), warranty.unit?.trim()]
                .filter(Boolean)
                .join(' ')
            : null,
        );
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      {isLoading ? 'Đang tải bảo hành…' : hasError ? 'Không thể tải bảo hành' : label ?? 'Thông tin bảo hành đang cập nhật'}
    </span>
  );
}

export function HomePage() {
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [products, setProducts] = useState<PagedResult<ProductResponse>>(emptyPage);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState('');
  const [isDescending, setIsDescending] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isBannerAutoplayEnabled, setIsBannerAutoplayEnabled] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [error, setError] = useState<string | null>(null);
  const activeBanner = bannerSlides[activeBannerIndex];

  useEffect(() => {
    if (!isBannerAutoplayEnabled) return;
    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % bannerSlides.length);
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [isBannerAutoplayEnabled]);

  const showBanner = (index: number) => {
    setActiveBannerIndex((index + bannerSlides.length) % bannerSlides.length);
    setIsBannerAutoplayEnabled(false);
  };

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
        setCategories(categoryData.filter((category) => category.status?.toUpperCase() === 'ACTIVE'));
        setBrands(brandData.filter((brand) => brand.status?.toUpperCase() === 'ACTIVE'));
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
      .getProducts({
        pageNumber: pageIndex,
        pageSize,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        searchTerm,
        sortBy: sortBy || undefined,
        isDescending,
      })
      .then((data) => {
        if (!active) return;
        setProducts({
          ...data,
          items: data.items.filter((product) => product.status?.toUpperCase() === 'ACTIVE'),
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
  }, [pageIndex, pageSize, categoryId, brandId, searchTerm, sortBy, isDescending]);

  const activeFilterCount = useMemo(
    () => Number(Boolean(categoryId)) + Number(Boolean(brandId)) + Number(Boolean(searchTerm)),
    [categoryId, brandId, searchTerm],
  );
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const brandNames = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand.name])),
    [brands],
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

  const handleSort = (event: ChangeEvent<HTMLSelectElement>) => {
    const [nextSortBy, direction] = event.target.value.split(':');
    setSortBy(nextSortBy);
    setIsDescending(direction === 'desc');
    setPageIndex(1);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      <section className="bg-[#f5f7fb] pb-6 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="relative isolate min-h-[440px] overflow-hidden rounded-[28px] bg-[#061B36] shadow-[0_24px_70px_-30px_rgba(15,23,42,0.65)] sm:min-h-[420px]"
            role="region"
            aria-roledescription="carousel"
            aria-label="Ưu đãi nổi bật của TechStore"
            onMouseEnter={() => setIsBannerAutoplayEnabled(false)}
            onFocusCapture={() => setIsBannerAutoplayEnabled(false)}
          >
            <img
              key={activeBanner.image}
              src={activeBanner.image}
              alt={activeBanner.imageAlt}
              className="absolute inset-0 h-full w-full animate-[banner-slide-enter_500ms_ease-out] object-cover object-center md:left-[39%] md:w-[61%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061B36] via-[#061B36]/80 to-[#061B36]/10 md:bg-gradient-to-r md:from-[#061B36] md:via-[#061B36]/90 md:to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_15%,rgba(56,189,248,0.35),transparent_32%)]" />

            <div
              key={activeBanner.title}
              className="banner-slide-enter relative z-10 flex min-h-[440px] flex-col justify-center px-6 pb-20 pt-10 sm:px-12 md:min-h-[420px] md:w-[68%] md:px-14 md:pb-16"
              role="group"
              aria-roledescription="slide"
              aria-label={`${activeBannerIndex + 1} trên ${bannerSlides.length}`}
            >
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100 backdrop-blur-md sm:text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                {activeBanner.eyebrow}
              </div>
              <p className="mb-2 text-sm font-semibold tracking-wide text-sky-200">TECHSTORE — CÔNG NGHỆ TRONG TẦM TAY</p>
              <h1 className="max-w-[13ch] text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-[54px]">
                {activeBanner.title}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-blue-100 sm:text-base">
                {activeBanner.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (activeBanner.productLink) navigate(activeBanner.productLink);
                }}
                className="mt-7 inline-flex h-12 w-fit items-center gap-3 rounded-xl bg-white px-6 text-sm font-extrabold tracking-wide text-[#075985] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/60"
                aria-label={`Mua ngay: ${activeBanner.title}`}
              >
                MUA NGAY <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="absolute bottom-4 left-5 right-5 z-20 flex items-center justify-between sm:bottom-6 sm:left-12 sm:right-12 md:left-auto md:right-8">
              <div className="flex items-center gap-2" aria-label="Chọn banner">
                {bannerSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => showBanner(index)}
                    className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      activeBannerIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
                    }`}
                    aria-label={`Hiển thị banner ${index + 1}`}
                    aria-current={activeBannerIndex === index ? 'true' : undefined}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBannerAutoplayEnabled((current) => !current)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label={isBannerAutoplayEnabled ? 'Tạm dừng chuyển banner' : 'Tiếp tục chuyển banner'}
                >
                  {isBannerAutoplayEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => showBanner(activeBannerIndex - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Banner trước"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => showBanner(activeBannerIndex + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Banner tiếp theo"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
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
          <div role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="flex min-w-5 h-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] text-blue-700">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="text-xs text-slate-500 transition hover:text-blue-700">
                  Xóa hết
                </button>
              )}
            </div>

            {isLoadingFilters ? (
              <div className="space-y-3" aria-label="Đang tải bộ lọc">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
              </div>
            ) : (
              <>
                <fieldset className="border-b border-slate-100 pb-5">
                  <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục</legend>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {categories.map((category) => (
                      <label key={category.id} className="flex cursor-pointer items-center gap-3 py-1 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={categoryId === category.id}
                          onChange={() => {
                            setCategoryId(categoryId === category.id ? '' : category.id);
                            setPageIndex(1);
                          }}
                          className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="pt-5">
                  <legend className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Thương hiệu</legend>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex cursor-pointer items-center gap-3 py-1 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={brandId === brand.id}
                          onChange={() => {
                            setBrandId(brandId === brand.id ? '' : brand.id);
                            setPageIndex(1);
                          }}
                          className="h-4 w-4 rounded border-slate-300 accent-blue-600"
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
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600" aria-live="polite">
                Tìm thấy <strong className="text-slate-950">{products.totalCount}</strong> sản phẩm phù hợp
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  Sắp xếp
                  <span className="relative">
                    <select
                      value={sortBy ? `${sortBy}:${isDescending ? 'desc' : 'asc'}` : ''}
                      onChange={handleSort}
                      className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      aria-label="Sắp xếp sản phẩm"
                    >
                      <option value="">Mặc định</option>
                      <option value="CreatedAt:desc">Mới nhất</option>
                      <option value="Name:asc">Tên A–Z</option>
                      <option value="Name:desc">Tên Z–A</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  Hiển thị
                  <span className="relative">
                  <select
                    value={pageSize}
                    onChange={handlePageSize}
                    className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    aria-label="Số sản phẩm mỗi trang"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </span>
                </label>
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                ))}
              </div>
            ) : products.items.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 text-center">
                <Laptop className="mb-3 h-10 w-10 text-slate-300" />
                <h2 className="text-lg font-bold text-slate-900">Không tìm thấy sản phẩm</h2>
                <p className="mt-1 text-sm text-slate-500">Hãy thay đổi từ khóa hoặc bỏ một bộ lọc.</p>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={clearFilters} className="mt-4 h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700">
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
                      className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60"
                    >
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/60">
                        {(product.primaryImageUrl || product.imageUrl) && (
                          <img
                            src={product.primaryImageUrl || product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        {(product.categoryName || (product.categoryId && categoryNames.get(product.categoryId))) && (
                          <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {product.categoryName || (product.categoryId && categoryNames.get(product.categoryId))}
                          </span>
                        )}
                        {(product.brandName || (product.brandId && brandNames.get(product.brandId))) && (
                          <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                            {product.brandName || (product.brandId && brandNames.get(product.brandId))}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h2 className="min-h-12 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700">
                          {product.name}
                        </h2>
                        <div className="mt-4 flex min-h-10 items-center justify-between border-t border-slate-100 pt-3">
                          <ProductWarrantyLabel productId={product.id} />
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-600" aria-hidden="true" />
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
                      className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Trước
                    </button>
                    <span className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600">
                      Trang <strong className="mx-1 text-slate-950">{products.pageIndex}</strong> / {products.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!products.hasNextPage}
                      onClick={() => setPageIndex((current) => current + 1)}
                      className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
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
