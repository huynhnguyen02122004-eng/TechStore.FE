import type { InventoryAdjustPayload, InventoryItem } from './inventoryService';

const STORAGE_KEY = 'techstore-demo-inventory';

const initialItems: InventoryItem[] = [
  { variantId: 'mock-variant-256-black', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '256 GB · Đen', sku: 'TP-PRO-256-BLK', stockQuantity: 24, lowStockThreshold: 10 },
  { variantId: 'mock-variant-256-silver', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '256 GB · Bạc', sku: 'TP-PRO-256-SLV', stockQuantity: 8, lowStockThreshold: 10 },
  { variantId: 'mock-variant-512-black', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '512 GB · Đen', sku: 'TP-PRO-512-BLK', stockQuantity: 3, lowStockThreshold: 5 },
  { variantId: 'mock-variant-1tb-burgundy', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '1 TB · Đỏ Burgundy', sku: 'TP-PRO-1TB-BRG', stockQuantity: 0, lowStockThreshold: 5 },
  { variantId: 'demo-variant-laptop', productId: 'demo-product-laptop', productCode: 'SP-002', productName: 'Laptop Pro 14', variantName: '16 GB · 512 GB', sku: 'LP-PRO-14-512', stockQuantity: 14, lowStockThreshold: 5 },
];

const save = (items: InventoryItem[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
};

export const demoInventoryService = {
  getAll(): InventoryItem[] {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return save(initialItems);
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Dữ liệu tồn kho demo không hợp lệ.');
    return parsed as InventoryItem[];
  },
  getLowStock(): InventoryItem[] {
    return demoInventoryService.getAll().filter((item) => item.stockQuantity <= item.lowStockThreshold);
  },
  adjust(payload: InventoryAdjustPayload): InventoryItem[] {
    const items = demoInventoryService.getAll();
    const target = items.find((item) => item.variantId === payload.variantId);
    if (!target) throw new Error('Không tìm thấy biến thể tồn kho.');
    if (!Number.isInteger(payload.quantity) || payload.quantity < 0) throw new Error('Số lượng điều chỉnh không hợp lệ.');
    const nextQuantity = payload.mode === 'SET'
      ? payload.quantity
      : payload.mode === 'ADD'
        ? target.stockQuantity + payload.quantity
        : target.stockQuantity - payload.quantity;
    if (nextQuantity < 0) throw new Error('Số lượng tồn kho không thể nhỏ hơn 0.');
    return save(items.map((item) => item.variantId === payload.variantId ? { ...item, stockQuantity: nextQuantity } : item));
  },
  updateThreshold(variantId: string, threshold: number): InventoryItem[] {
    if (!Number.isInteger(threshold) || threshold < 0) throw new Error('Ngưỡng cảnh báo không hợp lệ.');
    const items = demoInventoryService.getAll();
    if (!items.some((item) => item.variantId === variantId)) throw new Error('Không tìm thấy biến thể tồn kho.');
    return save(items.map((item) => item.variantId === variantId ? { ...item, lowStockThreshold: threshold } : item));
  },
};
