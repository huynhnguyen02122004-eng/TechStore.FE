import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import {
  catalogService,
  type BrandResponse,
  type CategoryResponse,
  type ProductMutation,
  type ProductResponse,
  type ProductVariantMutation,
  type ProductVariantResponse,
  type ProductImageResponse,
} from '../../../services/catalogService';
import { demoBrandService } from '../../../services/demoBrandService';
import { demoCategoryService } from '../../../services/demoCategoryService';
import { demoProductService } from '../../../services/demoProductService';
import { demoVariantService } from '../../../services/demoVariantService';
import { mockProductDetail, MOCK_PRODUCT_ID } from '../../../mocks/productDetailMock';
import { shouldUseDemoServices } from '../../../shared/api/serviceMode';

const PAGE_SIZE = 10;

const emptyProduct: ProductMutation = {
  name: '',
  categoryId: '',
  brandId: '',
  description: '',
  warrantyMonths: 12,
  status: 'ACTIVE',
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string; title?: string }>(error)) {
    return error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.title ||
      'Yêu cầu chưa hoàn tất. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
};

const flattenCategories = (items: CategoryResponse[]): CategoryResponse[] => {
  const result: CategoryResponse[] = [];
  const visit = (categories: CategoryResponse[], parentId?: string | null) => {
    categories.forEach((item) => {
      result.push({ ...item, parentId: item.parentId ?? parentId ?? null });
      if (item.children?.length) visit(item.children, item.id);
    });
  };
  visit(items);
  return result;
};

const formatWarranty = (months?: number) => months === undefined ? '—' : `${months} tháng`;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export function ProductManagementPage() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
  const isDemo = shouldUseDemoServices(token);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageIndex, setPageIndex] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [productsLoadedKey, setProductsLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductMutation>(emptyProduct);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [variantTarget, setVariantTarget] = useState<ProductResponse | null>(null);
  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [images, setImages] = useState<ProductImageResponse[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState<ProductVariantMutation>({
    productId: '',
    sku: '',
    price: 0,
    attributesSummary: '',
    status: 'ACTIVE',
    stockQuantity: 0,
  });
  const [imageUrl, setImageUrl] = useState('');
  const [managerError, setManagerError] = useState<string | null>(null);
  const [isLoadingManager, setIsLoadingManager] = useState(false);

  const productRequestKey = `${isDemo ? 'demo' : 'account'}:${pageIndex}:${searchTerm}`;
  const isLoadingProducts = productsLoadedKey !== productRequestKey;
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const brandNameById = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand.name])),
    [brands],
  );

  useEffect(() => {
    let active = true;
    const request = token
      ? Promise.all([catalogService.getCategories(token), catalogService.getBrands(token)])
      : Promise.resolve().then(() => [
          demoCategoryService.getAll(),
          demoBrandService.getAll(),
        ] as const);

    request
      .then(([categoryData, brandData]) => {
        if (!active) return;
        setCategories(flattenCategories(categoryData));
        setBrands(brandData);
        setResourcesError(null);
        setResourcesLoaded(true);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setResourcesError(`Không thể tải danh mục và thương hiệu cho biểu mẫu. ${getApiError(requestError)}`);
          setResourcesLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    const request = token
      ? catalogService.getProducts({
          pageIndex,
          pageSize: PAGE_SIZE,
          searchTerm: searchTerm || undefined,
        }).then((result) => ({
          items: result.items,
          totalCount: result.totalCount,
          totalPages: Math.max(1, result.totalPages || 1),
        }))
      : Promise.resolve().then(() => {
          const allProducts = demoProductService.getAll();
          const normalizedSearch = searchTerm.toLocaleLowerCase();
          const filtered = normalizedSearch
            ? allProducts.filter((product) =>
                product.name.toLocaleLowerCase().includes(normalizedSearch) ||
                product.slug.toLocaleLowerCase().includes(normalizedSearch) ||
                product.brandName?.toLocaleLowerCase().includes(normalizedSearch) ||
                product.categoryName?.toLocaleLowerCase().includes(normalizedSearch),
              )
            : allProducts;
          const start = (pageIndex - 1) * PAGE_SIZE;
          return {
            items: filtered.slice(start, start + PAGE_SIZE),
            totalCount: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
          };
        });

    request
      .then((result) => {
        if (!active) return;
        setProducts(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiError(requestError));
      })
      .finally(() => {
        if (active) setProductsLoadedKey(productRequestKey);
      });

    return () => {
      active = false;
    };
  }, [token, pageIndex, searchTerm, productRequestKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPageIndex(1);
      setSearchTerm(search.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const refreshProducts = async () => {
    if (!isDemo) {
      const result = await catalogService.getProducts({
        pageIndex,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
      });
      setProducts(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages || 1));
    } else {
      const allProducts = demoProductService.getAll();
      const normalizedSearch = searchTerm.toLocaleLowerCase();
      const filtered = normalizedSearch
        ? allProducts.filter((product) =>
            product.name.toLocaleLowerCase().includes(normalizedSearch) ||
            product.slug.toLocaleLowerCase().includes(normalizedSearch) ||
            product.brandName?.toLocaleLowerCase().includes(normalizedSearch) ||
            product.categoryName?.toLocaleLowerCase().includes(normalizedSearch),
          )
        : allProducts;
      const start = (pageIndex - 1) * PAGE_SIZE;
      setProducts(filtered.slice(start, start + PAGE_SIZE));
      setTotalCount(filtered.length);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
    }
  };

  const openCreateForm = () => {
    setEditingProductId(null);
    setFormData({
      ...emptyProduct,
      categoryId: categories[0]?.id ?? '',
      brandId: brands[0]?.id ?? '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (product: ProductResponse) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      categoryId: product.categoryId ?? categories.find((category) => category.name === product.categoryName)?.id ?? '',
      brandId: product.brandId ?? brands.find((brand) => brand.name === product.brandName)?.id ?? '',
      description: product.description ?? '',
      warrantyMonths: product.warrantyMonths ?? 0,
      status: product.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const updateFormField = <K extends keyof ProductMutation>(field: K, value: ProductMutation[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formData.name.trim();
    if (!name || name.length > 250) {
      setFormError('Tên sản phẩm phải có từ 1 đến 250 ký tự.');
      return;
    }
    if (!formData.categoryId || !formData.brandId) {
      setFormError('Vui lòng chọn danh mục và thương hiệu.');
      return;
    }
    if (!Number.isInteger(formData.warrantyMonths) || formData.warrantyMonths < 0) {
      setFormError('Thời gian bảo hành phải là số nguyên từ 0 trở lên.');
      return;
    }

    const payload: ProductMutation = {
      ...formData,
      name,
      description: formData.description?.trim() || undefined,
      status: formData.status ?? 'ACTIVE',
    };

    setIsSaving(true);
    setFormError(null);
    setError(null);
    setNotice(null);
    try {
      if (!isDemo) {
        if (editingProductId) {
          await catalogService.updateProduct(token, editingProductId, payload);
        } else {
          await catalogService.createProduct(token, payload);
        }
      } else if (editingProductId) {
        demoProductService.update(editingProductId, payload, categories, brands);
      } else {
        demoProductService.create(payload, categories, brands);
      }

      setIsFormOpen(false);
      setNotice(editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.');
      try {
        await refreshProducts();
      } catch (refreshError: unknown) {
        setError(`Đã lưu sản phẩm nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (saveError: unknown) {
      setFormError(getApiError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    setNotice(null);
    try {
      if (!isDemo) {
        await catalogService.deleteProduct(token, deleteTarget.id);
      } else {
        demoProductService.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      setNotice('Đã xóa sản phẩm.');
      try {
        await refreshProducts();
      } catch (refreshError: unknown) {
        setError(`Đã xóa sản phẩm nhưng không thể tải lại danh sách. ${getApiError(refreshError)}`);
      }
    } catch (deleteError: unknown) {
      setError(getApiError(deleteError));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openVariantManager = async (product: ProductResponse) => {
    setVariantTarget(product);
    setManagerError(null);
    setEditingVariantId(null);
    setVariantForm({
      productId: product.id,
      sku: '',
      price: 0,
      attributesSummary: '',
      status: 'ACTIVE',
      stockQuantity: 0,
    });
    setImageUrl('');
    setIsLoadingManager(true);
    try {
      if (isDemo && product.id === MOCK_PRODUCT_ID) {
        const storedVariants = demoVariantService.getVariants(product.id);
        const storedImages = demoVariantService.getImages(product.id);
        if (storedVariants.length === 0) demoVariantService.saveVariants(product.id, mockProductDetail.variants);
        if (storedImages.length === 0) demoVariantService.saveImages(product.id, mockProductDetail.images);
        setVariants(demoVariantService.getVariants(product.id));
        setImages(demoVariantService.getImages(product.id));
      } else if (isDemo) {
        setVariants(demoVariantService.getVariants(product.id));
        setImages(demoVariantService.getImages(product.id));
      } else {
        const [variantData, imageData] = await Promise.all([
          catalogService.getVariants(product.id),
          catalogService.getProductImages(product.id),
        ]);
        setVariants(variantData);
        setImages([...imageData].sort((a, b) =>
          Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
          (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
        ));
      }
    } catch (loadError: unknown) {
      setManagerError(getApiError(loadError));
      setVariants([]);
      setImages([]);
    } finally {
      setIsLoadingManager(false);
    }
  };

  const startEditVariant = (variant: ProductVariantResponse) => {
    if (!variantTarget) return;
    setEditingVariantId(variant.id);
    setVariantForm({
      productId: variantTarget.id,
      sku: variant.sku,
      price: variant.price,
      attributesSummary: variant.attributesSummary,
      status: variant.status?.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      stockQuantity: variant.stockQuantity ?? 0,
    });
  };

  const submitVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!variantTarget) return;
    const sku = variantForm.sku.trim();
    const attributesSummary = variantForm.attributesSummary.trim();
    if (!sku || !attributesSummary) {
      setManagerError('Vui lòng nhập SKU và cấu hình biến thể.');
      return;
    }
    if (!Number.isFinite(variantForm.price) || variantForm.price < 0) {
      setManagerError('Giá biến thể phải lớn hơn hoặc bằng 0.');
      return;
    }
    const payload: ProductVariantMutation = {
      ...variantForm,
      productId: variantTarget.id,
      sku,
      attributesSummary,
      stockQuantity: Number.isInteger(variantForm.stockQuantity) ? variantForm.stockQuantity : 0,
    };
    setIsLoadingManager(true);
    setManagerError(null);
    try {
      let next: ProductVariantResponse[];
      if (!isDemo) {
        if (editingVariantId) await catalogService.updateVariant(token, editingVariantId, payload);
        else await catalogService.createVariant(token, payload);
        next = await catalogService.getVariants(variantTarget.id);
      } else {
        next = editingVariantId
          ? demoVariantService.updateVariant(variantTarget.id, editingVariantId, payload)
          : demoVariantService.createVariant(variantTarget.id, payload);
      }
      setVariants(next);
      setEditingVariantId(null);
      setVariantForm({
        productId: variantTarget.id,
        sku: '',
        price: 0,
        attributesSummary: '',
        status: 'ACTIVE',
        stockQuantity: 0,
      });
    } catch (saveError: unknown) {
      setManagerError(getApiError(saveError));
    } finally {
      setIsLoadingManager(false);
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!variantTarget) return;
    setIsLoadingManager(true);
    setManagerError(null);
    try {
      if (!isDemo) {
        await catalogService.deleteVariant(token, variantId);
        setVariants(await catalogService.getVariants(variantTarget.id));
      } else {
        setVariants(demoVariantService.deleteVariant(variantTarget.id, variantId));
      }
    } catch (deleteError: unknown) {
      setManagerError(getApiError(deleteError));
    } finally {
      setIsLoadingManager(false);
    }
  };

  const addImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!variantTarget) return;
    const url = imageUrl.trim();
    if (!url) {
      setManagerError('Vui lòng nhập URL hình ảnh.');
      return;
    }
    setIsLoadingManager(true);
    setManagerError(null);
    try {
      let next: ProductImageResponse[];
      if (!isDemo) {
        await catalogService.createProductImage(token, {
          productId: variantTarget.id,
          imageUrl: url,
          isPrimary: images.length === 0,
          displayOrder: images.length + 1,
        });
        next = await catalogService.getProductImages(variantTarget.id);
      } else {
        next = demoVariantService.addImage(variantTarget.id, url, images.length === 0);
      }
      setImages(next);
      setImageUrl('');
    } catch (saveError: unknown) {
      setManagerError(getApiError(saveError));
    } finally {
      setIsLoadingManager(false);
    }
  };

  const setPrimaryImage = async (image: ProductImageResponse) => {
    if (!variantTarget || !image.id) return;
    setIsLoadingManager(true);
    setManagerError(null);
    try {
      if (!isDemo) {
        await catalogService.updateProductImage(token, image.id, {
          productId: variantTarget.id,
          imageUrl: image.imageUrl,
          isPrimary: true,
          displayOrder: image.displayOrder,
        });
        setImages(await catalogService.getProductImages(variantTarget.id));
      } else {
        setImages(demoVariantService.setPrimaryImage(variantTarget.id, image.id));
      }
    } catch (saveError: unknown) {
      setManagerError(getApiError(saveError));
    } finally {
      setIsLoadingManager(false);
    }
  };

  const deleteImage = async (image: ProductImageResponse) => {
    if (!variantTarget || !image.id) return;
    setIsLoadingManager(true);
    setManagerError(null);
    try {
      if (!isDemo) {
        await catalogService.deleteProductImage(token, image.id);
        setImages(await catalogService.getProductImages(variantTarget.id));
      } else {
        setImages(demoVariantService.deleteImage(variantTarget.id, image.id));
      }
    } catch (deleteError: unknown) {
      setManagerError(getApiError(deleteError));
    } finally {
      setIsLoadingManager(false);
    }
  };

  const getProductCategory = (product: ProductResponse) =>
    product.categoryName || categoryNameById.get(product.categoryId ?? '') || '—';
  const getProductBrand = (product: ProductResponse) =>
    product.brandName || brandNameById.get(product.brandId ?? '') || '—';

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-extrabold">Quản lý sản phẩm</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý thông tin cơ bản và trạng thái kinh doanh của sản phẩm.</p>
          </div>
          <button type="button" onClick={openCreateForm} disabled={!resourcesLoaded || categories.length === 0 || brands.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>

        {isDemo && (
          <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
            Chế độ demo: sản phẩm và thay đổi chỉ được lưu trên trình duyệt này, không gửi lên máy chủ.
          </p>
        )}
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {resourcesError && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{resourcesError}</span>
          </div>
        )}
        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Danh sách sản phẩm</h2>
                <p className="mt-0.5 text-xs text-slate-500">{totalCount} sản phẩm</p>
              </div>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên, danh mục, thương hiệu..."
                aria-label="Tìm sản phẩm"
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {isLoadingProducts ? (
            <div className="space-y-3 p-5" aria-label="Đang tải sản phẩm">
              {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 font-semibold">{error ? 'Chưa thể tải sản phẩm' : 'Không tìm thấy sản phẩm'}</h3>
              <p className="mt-1 text-sm text-slate-500">{error ? 'Kiểm tra kết nối hoặc quyền quản trị rồi thử lại.' : 'Thử từ khóa khác hoặc thêm sản phẩm mới.'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3">Sản phẩm</th>
                      <th scope="col" className="px-5 py-3">Danh mục</th>
                      <th scope="col" className="px-5 py-3">Thương hiệu</th>
                      <th scope="col" className="px-5 py-3">Bảo hành</th>
                      <th scope="col" className="px-5 py-3">Trạng thái</th>
                      <th scope="col" className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => {
                      const isActive = product.status?.toUpperCase() !== 'INACTIVE';
                      const image = product.primaryImageUrl || product.imageUrl;
                      return (
                        <tr key={product.id} className="transition hover:bg-blue-50/40">
                          <td className="px-5 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                {image
                                  ? <img src={image} alt="" className="h-full w-full object-contain p-1" />
                                  : <ImageIcon className="h-5 w-5 text-slate-400" />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{product.name}</p>
                                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{product.slug || product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600">{getProductCategory(product)}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600">{getProductBrand(product)}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600">{formatWarranty(product.warrantyMonths)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => openVariantManager(product)} aria-label={`Quản lý biến thể ${product.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                <Settings2 className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => openEditForm(product)} aria-label={`Sửa ${product.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => setDeleteTarget(product)} aria-label={`Xóa ${product.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">Trang {pageIndex} / {totalPages} · {totalCount} sản phẩm</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pageIndex <= 1} onClick={() => setPageIndex((page) => page - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </button>
                  <button type="button" disabled={pageIndex >= totalPages} onClick={() => setPageIndex((page) => page + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="product-form-title" className="text-lg font-bold">{editingProductId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</h2>
                <p className="mt-1 text-sm text-slate-500">Thông tin cấu hình, giá và ảnh được quản lý ở màn hình biến thể sản phẩm.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitProduct} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">Tên sản phẩm <span className="text-red-500">*</span>
                <input required minLength={1} maxLength={250} value={formData.name} onChange={(event) => updateFormField('name', event.target.value)} placeholder="Ví dụ: Điện thoại Pro 256GB" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Danh mục <span className="text-red-500">*</span>
                  <select required value={formData.categoryId} onChange={(event) => updateFormField('categoryId', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="" disabled>Chọn danh mục</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold">Thương hiệu <span className="text-red-500">*</span>
                  <select required value={formData.brandId} onChange={(event) => updateFormField('brandId', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="" disabled>Chọn thương hiệu</option>
                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Bảo hành (tháng) <span className="text-red-500">*</span>
                  <input required type="number" min={0} step={1} value={formData.warrantyMonths} onChange={(event) => updateFormField('warrantyMonths', Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block text-sm font-semibold">Trạng thái kinh doanh
                  <select value={formData.status ?? 'ACTIVE'} onChange={(event) => updateFormField('status', event.target.value as 'ACTIVE' | 'INACTIVE')} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="ACTIVE">Đang kinh doanh</option>
                    <option value="INACTIVE">Ngừng kinh doanh</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold">Mô tả
                <textarea rows={4} value={formData.description ?? ''} onChange={(event) => updateFormField('description', event.target.value)} placeholder="Nhập mô tả sản phẩm..." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving || categories.length === 0 || brands.length === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {isSaving ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {variantTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isLoadingManager) setVariantTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="variant-manager-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 id="variant-manager-title" className="text-lg font-bold">{variantTarget.name}</h2>
              </div>
              <button type="button" onClick={() => setVariantTarget(null)} aria-label="Đóng" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] sm:p-6">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">Biến thể sản phẩm</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{variants.length} cấu hình</p>
                  </div>
                </div>

                {managerError && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{managerError}</p>}
                {isLoadingManager ? (
                  <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ) : variants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">Chưa có biến thể nào.</div>
                ) : (
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div key={variant.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold">{variant.attributesSummary}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${variant.status?.toUpperCase() === 'INACTIVE' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
                              {variant.status?.toUpperCase() === 'INACTIVE' ? 'Ngừng' : 'Đang bán'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">SKU: <span className="font-mono">{variant.sku}</span></p>
                          <p className="mt-1 text-sm font-semibold text-blue-700">{formatCurrency(variant.price)}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => startEditVariant(variant)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700" aria-label={`Sửa biến thể ${variant.sku}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => deleteVariant(variant.id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Xóa biến thể ${variant.sku}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={submitVariant} className="mt-4 rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-bold">{editingVariantId ? 'Cập nhật biến thể' : 'Thêm biến thể mới'}</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold">Cấu hình
                      <input value={variantForm.attributesSummary} onChange={(event) => setVariantForm((current) => ({ ...current, attributesSummary: event.target.value }))} placeholder="Ví dụ: 256 GB · Đen" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500" />
                    </label>
                    <label className="text-xs font-semibold">SKU
                      <input value={variantForm.sku} onChange={(event) => setVariantForm((current) => ({ ...current, sku: event.target.value }))} placeholder="TP-PRO-256-BLK" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500" />
                    </label>
                    <label className="text-xs font-semibold">Giá (VNĐ)
                      <input type="number" min={0} step={1000} value={variantForm.price} onChange={(event) => setVariantForm((current) => ({ ...current, price: Number(event.target.value) }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500" />
                    </label>
                    <label className="text-xs font-semibold">Tồn kho
                      <input type="number" min={0} step={1} value={variantForm.stockQuantity ?? 0} onChange={(event) => setVariantForm((current) => ({ ...current, stockQuantity: Number(event.target.value) }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500" />
                    </label>
                    <label className="text-xs font-semibold sm:col-span-2">Trạng thái
                      <select value={variantForm.status} onChange={(event) => setVariantForm((current) => ({ ...current, status: event.target.value as 'ACTIVE' | 'INACTIVE' }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-blue-500">
                        <option value="ACTIVE">Đang bán</option>
                        <option value="INACTIVE">Ngừng bán</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    {editingVariantId && <button type="button" onClick={() => {
                      setEditingVariantId(null);
                      setVariantForm({ productId: variantTarget.id, sku: '', price: 0, attributesSummary: '', status: 'ACTIVE', stockQuantity: 0 });
                    }} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold">Hủy sửa</button>}
                    <button type="submit" disabled={isLoadingManager} className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                      {editingVariantId ? 'Cập nhật' : 'Thêm biến thể'}
                    </button>
                  </div>
                </form>
              </div>

              <aside>
                <div className="mb-3">
                  <h3 className="font-bold">Hình ảnh sản phẩm</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{images.length} hình ảnh</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image) => (
                    <div key={image.id ?? image.imageUrl} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <img src={image.imageUrl} alt="" className="h-24 w-full object-contain" />
                      {image.isPrimary && <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[9px] font-bold text-white">Ảnh chính</span>}
                      <div className="mt-2 flex gap-1">
                        {!image.isPrimary && image.id && <button type="button" onClick={() => setPrimaryImage(image)} className="h-8 flex-1 rounded-md border border-slate-200 text-[10px] font-semibold hover:bg-blue-50">Đặt chính</button>}
                        {image.id && <button type="button" onClick={() => deleteImage(image)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Xóa hình ảnh"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={addImage} className="mt-3">
                  <label className="text-xs font-semibold">Thêm URL hình ảnh
                    <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="/mock-phone-front.svg" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500" />
                  </label>
                  <button type="submit" disabled={isLoadingManager} className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                    <Plus className="h-3.5 w-3.5" /> Thêm hình ảnh
                  </button>
                </form>
              </aside>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setDeleteTarget(null);
        }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-product-title" className="text-lg font-bold">Xóa sản phẩm này?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{deleteTarget.name}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Nếu sản phẩm đang được tham chiếu bởi đơn hàng hoặc biến thể, máy chủ có thể từ chối yêu cầu xóa.</p>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} aria-label="Đóng" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Giữ lại
              </button>
              <button type="button" onClick={deleteProduct} disabled={isDeleting} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
                {!isDeleting && <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
