export interface InventoryItem {
  variantId: string;
  productId: string;
  productCode?: string;
  productName: string;
  variantName: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface InventoryAdjustPayload {
  variantId: string;
  quantity: number;
  reason?: string;
  mode: 'SET' | 'ADD' | 'REMOVE';
}

export interface InventoryTransaction {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  changeQuantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  createdAt?: string;
  performedBy?: string;
  orderCode?: string;
  orderId?: string;
}

export interface InventoryReservation {
  id: string;
  orderId?: string;
  orderCode?: string;
  productId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  status: 'ACTIVE' | 'RELEASED' | 'COMMITTED' | 'CANCELLED' | string;
  expiresAt?: string;
  createdAt?: string;
}
