export interface CategoryResponse {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  children?: CategoryResponse[];
}

export interface CategoryMutation {
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface BrandResponse {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | string;
}

export interface BrandMutation {
  name: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  categoryId?: string;
  brandId?: string;
  description?: string;
  categoryName?: string;
  brandName?: string;
  warrantyMonths?: number;
  status?: string;
  imageUrl?: string;
  primaryImageUrl?: string;
}

export interface ProductMutation {
  categoryId: string;
  brandId: string;
  name: string;
  description?: string;
  warrantyMonths: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ProductQuery {
  pageNumber?: number;
  pageIndex?: number;
  pageSize?: number;
  categoryId?: string;
  brandId?: string;
  searchTerm?: string;
  sortBy?: string;
  isDescending?: boolean;
}

export interface ProductVariantResponse {
  id: string;
  productId?: string;
  sku: string;
  /** Backend field: human-readable variant name (e.g. "256GB · Đen") */
  variantName: string;
  price: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariantMutation {
  productId: string;
  sku: string;
  variantName: string;
  price: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ProductImageMutation {
  productId: string;
  imageUrl: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface ProductImageResponse {
  id?: string;
  productId?: string;
  imageUrl: string;
  isPrimary?: boolean;
  displayOrder?: number;
  sortOrder?: number;
}

export interface VariantSpecificationResponse {
  id?: string;
  variantId?: string;
  /** Backend field name */
  specName: string;
  specValue: string;
  unit?: string;
}
