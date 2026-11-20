import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import {
  BrandManagementPage,
  CategoryManagementPage,
  InventoryManagementPage,
  InventoryTransactionPage,
  OrderManagementPage,
  PaymentManagementPage,
  ProductManagementPage,
  ShipmentManagementPage,
} from './AdminPageChunks';

const adminLoadingFallback = (
  <main className="min-h-[60vh] bg-[#f5f7fb]" aria-label="Đang tải màn hình quản trị" />
);

export const adminRoutes = (
  <>
    <Route path="/admin/categories" element={<Suspense fallback={adminLoadingFallback}><CategoryManagementPage /></Suspense>} />
    <Route path="/admin/brands" element={<Suspense fallback={adminLoadingFallback}><BrandManagementPage /></Suspense>} />
    <Route path="/admin/products" element={<Suspense fallback={adminLoadingFallback}><ProductManagementPage /></Suspense>} />
    <Route path="/admin/orders" element={<Suspense fallback={adminLoadingFallback}><OrderManagementPage /></Suspense>} />
    <Route path="/admin/payments" element={<Suspense fallback={adminLoadingFallback}><PaymentManagementPage /></Suspense>} />
    <Route path="/admin/shipments" element={<Suspense fallback={adminLoadingFallback}><ShipmentManagementPage /></Suspense>} />
    <Route path="/admin/inventory" element={<Suspense fallback={adminLoadingFallback}><InventoryManagementPage /></Suspense>} />
    <Route path="/admin/inventory/transactions" element={<Suspense fallback={adminLoadingFallback}><InventoryTransactionPage /></Suspense>} />
  </>
);
