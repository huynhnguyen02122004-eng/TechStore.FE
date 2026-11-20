import type {
  ProductImageResponse,
  ProductVariantMutation,
  ProductVariantResponse,
} from './catalogService';

const variantKey = (productId: string) => `techstore-demo-variants:${productId}`;
const imageKey = (productId: string) => `techstore-demo-images:${productId}`;

export const demoVariantService = {
  getVariants(productId: string): ProductVariantResponse[] {
    const parsed = JSON.parse(window.localStorage.getItem(variantKey(productId)) || '[]') as unknown;
    return Array.isArray(parsed) ? parsed as ProductVariantResponse[] : [];
  },
  saveVariants(productId: string, variants: ProductVariantResponse[]) {
    window.localStorage.setItem(variantKey(productId), JSON.stringify(variants));
  },
  createVariant(productId: string, variant: ProductVariantMutation): ProductVariantResponse[] {
    const created: ProductVariantResponse = {
      id: `demo-variant-${Date.now()}`,
      sku: variant.sku,
      price: variant.price,
      attributesSummary: variant.attributesSummary,
      status: variant.status ?? 'ACTIVE',
      stockQuantity: variant.stockQuantity,
    };
    const variants = [...demoVariantService.getVariants(productId), created];
    demoVariantService.saveVariants(productId, variants);
    return variants;
  },
  updateVariant(productId: string, variantId: string, variant: ProductVariantMutation): ProductVariantResponse[] {
    const variants = demoVariantService.getVariants(productId).map((item) =>
      item.id === variantId
        ? { ...item, sku: variant.sku, price: variant.price, attributesSummary: variant.attributesSummary, status: variant.status ?? 'ACTIVE', stockQuantity: variant.stockQuantity }
        : item,
    );
    demoVariantService.saveVariants(productId, variants);
    return variants;
  },
  deleteVariant(productId: string, variantId: string): ProductVariantResponse[] {
    const variants = demoVariantService.getVariants(productId).filter((item) => item.id !== variantId);
    demoVariantService.saveVariants(productId, variants);
    return variants;
  },
  getImages(productId: string): ProductImageResponse[] {
    const parsed = JSON.parse(window.localStorage.getItem(imageKey(productId)) || '[]') as unknown;
    return Array.isArray(parsed) ? parsed as ProductImageResponse[] : [];
  },
  saveImages(productId: string, images: ProductImageResponse[]) {
    window.localStorage.setItem(imageKey(productId), JSON.stringify(images));
  },
  addImage(productId: string, imageUrl: string, isPrimary: boolean): ProductImageResponse[] {
    const current = demoVariantService.getImages(productId);
    const next = isPrimary ? current.map((item) => ({ ...item, isPrimary: false })) : current;
    const created: ProductImageResponse = {
      id: `demo-image-${Date.now()}`,
      imageUrl,
      isPrimary: isPrimary || next.length === 0,
      displayOrder: next.length + 1,
    };
    const images = [...next, created];
    demoVariantService.saveImages(productId, images);
    return images;
  },
  setPrimaryImage(productId: string, imageId: string): ProductImageResponse[] {
    const images = demoVariantService.getImages(productId).map((item) => ({
      ...item,
      isPrimary: item.id === imageId,
    }));
    demoVariantService.saveImages(productId, images);
    return images;
  },
  deleteImage(productId: string, imageId: string): ProductImageResponse[] {
    const images = demoVariantService.getImages(productId).filter((item) => item.id !== imageId);
    if (images.length > 0 && !images.some((item) => item.isPrimary)) {
      images[0] = { ...images[0], isPrimary: true };
    }
    demoVariantService.saveImages(productId, images);
    return images;
  },
};
