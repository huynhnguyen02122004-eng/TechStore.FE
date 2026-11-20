import { lazy } from 'react';

export const CategoryManagementPage = lazy(() =>
  import('../features/admin/catalog/CategoryManagementPage').then(({ CategoryManagementPage: page }) => ({ default: page })),
);
export const BrandManagementPage = lazy(() =>
  import('../features/admin/catalog/BrandManagementPage').then(({ BrandManagementPage: page }) => ({ default: page })),
);
export const ProductManagementPage = lazy(() =>
  import('../features/admin/catalog/ProductManagementPage').then(({ ProductManagementPage: page }) => ({ default: page })),
);
export const OrderManagementPage = lazy(() =>
  import('../features/admin/orders/OrderManagementPage').then(({ OrderManagementPage: page }) => ({ default: page })),
);
export const PaymentManagementPage = lazy(() =>
  import('../features/admin/payments/PaymentManagementPage').then(({ PaymentManagementPage: page }) => ({ default: page })),
);
export const ShipmentManagementPage = lazy(() =>
  import('../features/admin/shipments/ShipmentManagementPage').then(({ ShipmentManagementPage: page }) => ({ default: page })),
);
export const InventoryManagementPage = lazy(() =>
  import('../features/admin/inventory/InventoryManagementPage').then(({ InventoryManagementPage: page }) => ({ default: page })),
);
export const InventoryTransactionPage = lazy(() =>
  import('../features/admin/inventory/InventoryTransactionPage').then(({ InventoryTransactionPage: page }) => ({ default: page })),
);
