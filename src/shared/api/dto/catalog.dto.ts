export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
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
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ProductQuery {
  pageIndex?: number;
  pageSize?: number;
  categoryId?: string;
  brandId?: string;
  searchTerm?: string;
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
  imageUrl: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface VariantSpecificationResponse {
  id?: string;
  variantId?: string;
  /** Backend field name */
  specName: string;
  specValue: string;
  unit?: string;
}
