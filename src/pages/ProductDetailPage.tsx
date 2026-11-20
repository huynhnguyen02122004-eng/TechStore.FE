import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  catalogService,
  type ProductImageResponse,
  type ProductResponse,
  type ProductVariantResponse,
  type VariantSpecificationResponse,
} from '../services/catalogService';
import { MOCK_PRODUCT_ID, mockProductDetail } from '../mocks/productDetailMock';
import { demoCartService } from '../services/demoCartService';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [images, setImages] = useState<ProductImageResponse[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);
  const [specificationResult, setSpecificationResult] = useState<{
    variantId: string;
    items: VariantSpecificationResponse[];
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const isLoading = Boolean(id) && loadedProductId !== id;
  const isLoadingSpecifications = Boolean(selectedVariantId) && specificationResult?.variantId !== selectedVariantId;
  const specifications = specificationResult?.variantId === selectedVariantId ? specificationResult.items : [];
  const specificationError =
    specificationResult?.variantId === selectedVariantId ? specificationResult.error ?? null : null;

  useEffect(() => {
    if (!id) return;
    let active = true;

    const loadProduct = id === MOCK_PRODUCT_ID
      ? Promise.resolve([
          mockProductDetail.product,
          mockProductDetail.variants,
          mockProductDetail.images,
        ] as const)
      : Promise.all([
          catalogService.getProductById(id),
          catalogService.getVariants(id),
          catalogService.getProductImages(id),
        ]);

    loadProduct
      .then(([productData, variantData, imageData]) => {
        if (!active) return;
        setError(null);
        setProduct(productData);
        setVariants(variantData.filter((variant) => !variant.status || variant.status.toUpperCase() === 'ACTIVE'));
        setSelectedVariantId(
          variantData.find((variant) => !variant.status || variant.status.toUpperCase() === 'ACTIVE')?.id ?? '',
        );
        setSelectedImageIndex(0);
        setImages(
          [...imageData].sort(
            (a, b) =>
              Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
              (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
          ),
        );
      })
      .catch(() => {
        if (active) setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoadedProductId(id);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!selectedVariantId) return;
    let active = true;

    const mockSpecifications = Object.entries(mockProductDetail.specifications).find(
      ([variantId]) => variantId === selectedVariantId,
    )?.[1];
    const loadSpecifications = mockSpecifications
      ? Promise.resolve(mockSpecifications)
      : catalogService.getVariantSpecifications(selectedVariantId);

    loadSpecifications
      .then((data) => {
        if (active) {
          setSpecificationResult({
            variantId: selectedVariantId,
            items: [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
          });
        }
      })
      .catch(() => {
        if (active) {
          setSpecificationResult({
            variantId: selectedVariantId,
            items: [],
            error: 'Không thể tải thông số của cấu hình này.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedVariantId]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId),
    [variants, selectedVariantId],
  );
  const selectedImage = images[selectedImageIndex]?.imageUrl;

  const moveImage = (direction: -1 | 1) => {
    if (images.length < 2) return;
    setSelectedImageIndex((current) => (current + direction + images.length) % images.length);
  };

  const addMockItemToCart = () => {
    if (!selectedVariant || id !== MOCK_PRODUCT_ID) return;
    demoCartService.addItem({
      productId: MOCK_PRODUCT_ID,
      variantId: selectedVariant.id,
      productName: product?.name ?? mockProductDetail.product.name,
      variantLabel: selectedVariant.attributesSummary,
      sku: selectedVariant.sku,
      unitPrice: selectedVariant.price,
      imageUrl: selectedImage ?? mockProductDetail.images[0].imageUrl,
      quantity: 1,
    });
    setCartMessage('Đã thêm sản phẩm mẫu vào giỏ hàng.');
  };

  const buyMockNow = () => {
    if (id !== MOCK_PRODUCT_ID || !selectedVariant) return;
    addMockItemToCart();
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] bg-[#f5f7fb] px-4 py-8">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="h-5 w-64 rounded bg-slate-200" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
            <div className="h-[540px] rounded-2xl bg-white" />
            <div className="h-[540px] rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-[#f5f7fb] px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">{error || 'Không tìm thấy sản phẩm'}</h1>
          <Link to="/" className="mt-5 inline-flex h-11 items-center rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-28 text-slate-800">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3 text-sm sm:px-6">
          <Link to="/" className="text-slate-500 hover:text-blue-600">Trang chủ</Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {product.categoryName && (
            <>
              <span className="text-slate-500">{product.categoryName}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </>
          )}
          <span className="truncate font-medium text-slate-700">{product.name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] px-4 pb-8 pt-5 sm:px-6">
        {id === MOCK_PRODUCT_ID && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-800">
            Đây là dữ liệu minh họa để xem giao diện MH-04; không phải thông tin sản phẩm thực tế.
          </div>
        )}
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">{product.name}</h1>
          {product.brandName && <span className="text-sm text-slate-500">Thương hiệu: <strong>{product.brandName}</strong></span>}
          <a href="#specifications" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Xem thông số <span aria-hidden="true">⌄</span>
          </a>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
          <section aria-label="Thư viện ảnh sản phẩm" className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="relative flex h-[360px] items-center justify-center sm:h-[500px]">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 text-slate-400">
                  <PackageCheck className="h-16 w-16" />
                  <p className="mt-3 text-sm">Chưa có hình ảnh sản phẩm</p>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveImage(-1)}
                    className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Ảnh trước"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(1)}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Ảnh tiếp theo"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={image.id || image.imageUrl}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Xem ảnh ${index + 1}`}
                    aria-pressed={index === selectedImageIndex}
                    className={`h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 transition ${
                      index === selectedImageIndex ? 'border-blue-500' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={image.imageUrl} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" aria-label="Chọn cấu hình sản phẩm">
            {variants.length > 0 ? (
              <>
                <fieldset>
                  <legend className="mb-3 text-sm font-bold text-slate-800">Chọn cấu hình phù hợp</legend>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        aria-pressed={selectedVariantId === variant.id}
                        className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          selectedVariantId === variant.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {variant.attributesSummary}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-7 border-t border-slate-100 pt-5">
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    Giá sản phẩm
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                      <MapPin className="h-4 w-4" />
                      Toàn quốc
                    </span>
                  </p>
                  {selectedVariant ? (
                    <>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-red-600">
                        {formatCurrency(selectedVariant.price)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Mã sản phẩm: <strong className="text-slate-700">{selectedVariant.sku}</strong>
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Chọn cấu hình để xem giá.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Sản phẩm hiện chưa có cấu hình để lựa chọn.
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-blue-300 bg-blue-50/80">
                <div className="flex items-center justify-between gap-3 border-b border-blue-100 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    </span>
                    Sản phẩm chính hãng
                  </span>
                  <span className="text-sm font-bold text-slate-800">Đã chọn</span>
                </div>
                <p className="px-4 py-3 text-sm text-slate-600">
                  Bảo hành theo nhà sản xuất{product.warrantyMonths ? ` · ${product.warrantyMonths} tháng` : ''}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-600">
                  <Truck className="h-4 w-4 shrink-0 text-blue-600" />
                  Giao hàng toàn quốc
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-600">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  Hỗ trợ bảo hành chính hãng
                </div>
              </div>
              {cartMessage && (
                <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {cartMessage}{' '}
                  <Link to="/cart" className="font-bold underline">Xem giỏ hàng</Link>
                </p>
              )}
            </div>
          </section>
        </div>

        <section id="specifications" className="mt-6 scroll-mt-32 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-800">Thông số kỹ thuật</h2>
            {selectedVariant && <p className="mt-1 text-xs text-slate-500">{selectedVariant.attributesSummary}</p>}
          </div>
          {isLoadingSpecifications ? (
            <div className="space-y-3 p-5" aria-live="polite">
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : specificationError ? (
            <p role="alert" className="px-5 py-4 text-sm text-red-700">{specificationError}</p>
          ) : specifications.length > 0 ? (
            <dl className="divide-y divide-slate-100">
              {specifications.map((spec, index) => (
                <div key={spec.id || `${spec.specKey}-${index}`} className="grid grid-cols-[40%_60%] px-5 py-3 text-sm even:bg-slate-50">
                  <dt className="font-medium text-slate-500">{spec.specKey}</dt>
                  <dd className="text-slate-800">{spec.specValue}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="px-5 py-4 text-sm text-slate-500">
              {selectedVariant ? 'Chưa có thông số cho cấu hình này.' : 'Chưa có thông số sản phẩm.'}
            </p>
          )}
        </section>

        {product.description && (
          <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-800">Mô tả sản phẩm</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {selectedImage && (
              <img src={selectedImage} alt="" className="hidden h-14 w-14 rounded-lg border border-slate-200 object-contain sm:block" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{product.name}</p>
              <p className="mt-1 text-xs text-slate-500">{selectedVariant?.attributesSummary ?? 'Chưa chọn cấu hình'}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-500">Tạm tính</p>
              <p className="mt-0.5 text-lg font-extrabold text-red-600">
                {selectedVariant ? formatCurrency(selectedVariant.price) : '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={addMockItemToCart}
              disabled={id !== MOCK_PRODUCT_ID || !selectedVariant}
              title={id === MOCK_PRODUCT_ID ? 'Thêm cấu hình mẫu vào giỏ hàng demo' : 'Cần API giỏ hàng để thêm sản phẩm thật'}
              className="flex h-12 items-center justify-center rounded-xl border border-blue-500 px-3 text-xs font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Thêm giỏ</span>
              <span className="hidden sm:inline">Thêm vào giỏ</span>
            </button>
            <button
              type="button"
              onClick={buyMockNow}
              disabled={id !== MOCK_PRODUCT_ID || !selectedVariant}
              title={id === MOCK_PRODUCT_ID ? 'Thêm sản phẩm mẫu và chuyển đến thanh toán demo' : 'Cần API giỏ hàng để mua sản phẩm thật'}
              className="h-12 rounded-xl bg-[#1b64c7] px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
