import type { InventoryReservation, InventoryTransaction } from './inventoryService';

const TRANSACTION_KEY = 'techstore-demo-inventory-transactions';
const RESERVATION_KEY = 'techstore-demo-inventory-reservations';

export const demoInventoryTransactionService = {
  getTransactions(): InventoryTransaction[] {
    const stored = window.localStorage.getItem(TRANSACTION_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as InventoryTransaction[];
    }
    const initial: InventoryTransaction[] = [
      { id: 'TXN-2026-001', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '256 GB · Đen', sku: 'TP-PRO-256-BLK', type: 'IN', changeQuantity: 20, quantityBefore: 4, quantityAfter: 24, createdAt: '2026-11-20T08:15:00.000Z', performedBy: 'Nguyễn Quản Trị', orderCode: undefined },
      { id: 'TXN-2026-002', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '256 GB · Bạc', sku: 'TP-PRO-256-SLV', type: 'OUT', changeQuantity: -3, quantityBefore: 11, quantityAfter: 8, createdAt: '2026-11-20T09:30:00.000Z', performedBy: 'Hệ thống', orderCode: 'TS-2026-002' },
      { id: 'TXN-2026-003', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '512 GB · Đen', sku: 'TP-PRO-512-BLK', type: 'ADJUST', changeQuantity: 2, quantityBefore: 1, quantityAfter: 3, createdAt: '2026-11-19T16:40:00.000Z', performedBy: 'Lê Kho Hàng', orderCode: undefined },
      { id: 'TXN-2026-004', productId: 'demo-product-laptop', productCode: 'SP-002', productName: 'Laptop Pro 14', variantName: '16 GB · 512 GB', sku: 'LP-PRO-14-512', type: 'OUT', changeQuantity: -1, quantityBefore: 15, quantityAfter: 14, createdAt: '2026-11-19T14:10:00.000Z', performedBy: 'Hệ thống', orderCode: 'TS-2026-003' },
      { id: 'TXN-2026-005', productId: 'demo-product-phone', productCode: 'SP-001', productName: 'TechPhone Pro', variantName: '1 TB · Đỏ Burgundy', sku: 'TP-PRO-1TB-BRG', type: 'ADJUST', changeQuantity: -2, quantityBefore: 2, quantityAfter: 0, createdAt: '2026-11-18T11:25:00.000Z', performedBy: 'Nguyễn Quản Trị', orderCode: undefined },
    ];
    window.localStorage.setItem(TRANSACTION_KEY, JSON.stringify(initial));
    return initial;
  },
  getReservations(): InventoryReservation[] {
    const stored = window.localStorage.getItem(RESERVATION_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as InventoryReservation[];
    }
    const initial: InventoryReservation[] = [
      { id: 'RES-2026-001', orderId: 'DEMO-ORD-001', orderCode: 'TS-2026-001', productId: 'demo-product-phone', productName: 'TechPhone Pro', variantName: '256 GB · Đen', sku: 'TP-PRO-256-BLK', quantity: 1, status: 'ACTIVE', createdAt: '2026-11-20T08:30:00.000Z', expiresAt: '2026-11-21T08:30:00.000Z' },
      { id: 'RES-2026-002', orderId: 'DEMO-ORD-002', orderCode: 'TS-2026-002', productId: 'demo-product-laptop', productName: 'Laptop Pro 14', variantName: '16 GB · 512 GB', sku: 'LP-PRO-14-512', quantity: 1, status: 'COMMITTED', createdAt: '2026-11-19T21:15:00.000Z' },
      { id: 'RES-2026-003', orderId: 'DEMO-ORD-003', orderCode: 'TS-2026-003', productId: 'demo-product-phone', productName: 'TechPhone Pro', variantName: '512 GB · Đen', sku: 'TP-PRO-512-BLK', quantity: 2, status: 'CANCELLED', createdAt: '2026-11-18T10:00:00.000Z' },
    ];
    window.localStorage.setItem(RESERVATION_KEY, JSON.stringify(initial));
    return initial;
  },
};
