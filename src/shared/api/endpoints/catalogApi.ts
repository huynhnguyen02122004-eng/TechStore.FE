import { httpClient as axiosInstance } from '../httpClient';
import type {
  BrandMutation,
  BrandResponse,
  CategoryMutation,
  CategoryResponse,
  PagedResult,
  ProductImageMutation,
  ProductImageResponse,
  ProductMutation,
  ProductQuery,
  ProductResponse,
  ProductVariantMutation,
  ProductVariantResponse,
  VariantSpecificationResponse,
} from '../dto/catalog.dto';

export type {
  BrandMutation,
  BrandResponse,
  CategoryMutation,
  CategoryResponse,
  PagedResult,
  ProductImageMutation,
  ProductImageResponse,
  ProductMutation,
  ProductQuery,
  ProductResponse,
  ProductVariantMutation,
  ProductVariantResponse,
  VariantSpecificationResponse,
} from '../dto/catalog.dto';

interface ProductPagePayload {
  items?: ProductResponse[];
  pageNumber?: number;
  pageIndex?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

const unwrapArray = <T,>(data: T[] | { items?: T[] }): T[] =>
  Array.isArray(data) ? data : data.items ?? [];

const withToken = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const catalogService = {
  getCategories: async (token?: string): Promise<CategoryResponse[]> => {
    const response = await axiosInstance.get<CategoryResponse[] | { items: CategoryResponse[] }>(
      '/categories',
      {
        params: { pageSize: 100 },
        ...(token ? withToken(token) : {}),
      },
    );
    return unwrapArray(response.data);
  },

  createCategory: async (token: string, category: CategoryMutation): Promise<CategoryResponse> => {
    const response = await axiosInstance.post<CategoryResponse>('/categories', category, withToken(token));
    return response.data;
  },

  updateCategory: async (token: string, categoryId: string, category: CategoryMutation): Promise<void> => {
    await axiosInstance.put(`/categories/${encodeURIComponent(categoryId)}`, category, withToken(token));
  },

  deleteCategory: async (token: string, categoryId: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${encodeURIComponent(categoryId)}`, withToken(token));
  },

  getBrands: async (token?: string): Promise<BrandResponse[]> => {
    const response = await axiosInstance.get<BrandResponse[] | { items: BrandResponse[] }>(
      '/brands',
      {
        params: { pageSize: 100 },
        ...(token ? withToken(token) : {}),
      },
    );
    return unwrapArray(response.data);
  },

  createBrand: async (token: string, brand: BrandMutation): Promise<BrandResponse> => {
    const response = await axiosInstance.post<BrandResponse>('/brands', brand, withToken(token));
    return response.data;
  },

  updateBrand: async (token: string, brandId: string, brand: BrandMutation): Promise<void> => {
    await axiosInstance.put(`/brands/${encodeURIComponent(brandId)}`, brand, withToken(token));
  },

  deleteBrand: async (token: string, brandId: string): Promise<void> => {
    await axiosInstance.delete(`/brands/${encodeURIComponent(brandId)}`, withToken(token));
  },

  getProducts: async (query: ProductQuery): Promise<PagedResult<ProductResponse>> => {
    const response = await axiosInstance.get<ProductPagePayload>('/products', {
      params: {
        pageNumber: query.pageNumber ?? query.pageIndex ?? 1,
        pageSize: query.pageSize ?? 12,
        categoryId: query.categoryId || undefined,
        brandId: query.brandId || undefined,
        searchTerm: query.searchTerm?.trim() || undefined,
        sortBy: query.sortBy || undefined,
        isDescending: query.isDescending ?? false,
      },
    });
    const data = response.data;
    const items = data.items ?? [];
    const totalCount = data.totalCount ?? items.length;
    const pageSize = query.pageSize ?? 12;
    const pageIndex = data.pageNumber ?? data.pageIndex ?? query.pageNumber ?? query.pageIndex ?? 1;
    const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));
    return {
      pageIndex,
      pageNumber: pageIndex,
      pageSize: data.pageSize ?? pageSize,
      totalPages,
      totalCount,
      hasPreviousPage: data.hasPreviousPage ?? pageIndex > 1,
      hasNextPage: data.hasNextPage ?? pageIndex < totalPages,
      items,
    };
  },

  createProduct: async (token: string, product: ProductMutation): Promise<ProductResponse> => {
    const response = await axiosInstance.post<ProductResponse>('/products', product, withToken(token));
    return response.data;
  },

  updateProduct: async (token: string, productId: string, product: ProductMutation): Promise<void> => {
    await axiosInstance.put(`/products/${encodeURIComponent(productId)}`, product, withToken(token));
  },

  deleteProduct: async (token: string, productId: string): Promise<void> => {
    await axiosInstance.delete(`/products/${encodeURIComponent(productId)}`, withToken(token));
  },

  getProductById: async (id: string): Promise<ProductResponse> => {
    const response = await axiosInstance.get<ProductResponse>(`/products/${id}`);
    return response.data;
  },

  getVariants: async (productId: string): Promise<ProductVariantResponse[]> => {
    const response = await axiosInstance.get<ProductVariantResponse[] | { items: ProductVariantResponse[] }>(
      '/product-variants',
      { params: { productId } },
    );
    return unwrapArray(response.data);
  },

  getProductImages: async (productId: string): Promise<ProductImageResponse[]> => {
    const response = await axiosInstance.get<ProductImageResponse[] | { items: ProductImageResponse[] }>(
      '/product-images',
      { params: { productId } },
    );
    return unwrapArray(response.data);
  },

  getVariantSpecifications: async (variantId: string): Promise<VariantSpecificationResponse[]> => {
    const response = await axiosInstance.get<VariantSpecificationResponse[] | { items: VariantSpecificationResponse[] }>(
      '/variant-specifications',
      { params: { variantId } },
    );
    return unwrapArray(response.data);
  },

  createVariant: async (token: string, variant: ProductVariantMutation): Promise<ProductVariantResponse> => {
    const response = await axiosInstance.post<ProductVariantResponse>('/product-variants', variant, withToken(token));
    return response.data;
  },

  updateVariant: async (token: string, variantId: string, variant: ProductVariantMutation): Promise<void> => {
    await axiosInstance.put(`/product-variants/${encodeURIComponent(variantId)}`, variant, withToken(token));
  },

  deleteVariant: async (token: string, variantId: string): Promise<void> => {
    await axiosInstance.delete(`/product-variants/${encodeURIComponent(variantId)}`, withToken(token));
  },

  createProductImage: async (token: string, image: ProductImageMutation): Promise<ProductImageResponse> => {
    const response = await axiosInstance.post<ProductImageResponse>('/product-images', image, withToken(token));
    return response.data;
  },

  updateProductImage: async (token: string, imageId: string, image: ProductImageMutation): Promise<void> => {
    await axiosInstance.put(`/product-images/${encodeURIComponent(imageId)}`, image, withToken(token));
  },

  deleteProductImage: async (token: string, imageId: string): Promise<void> => {
    await axiosInstance.delete(`/product-images/${encodeURIComponent(imageId)}`, withToken(token));
  },
};
