import { Route } from 'react-router-dom';
import { CartPage } from '../features/storefront/cart/CartPage';
import { CheckoutPage } from '../features/storefront/checkout/CheckoutPage';
import { CheckoutResultPage } from '../features/storefront/checkout/CheckoutResultPage';
import { MyOrdersPage } from '../features/storefront/orders/MyOrdersPage';
import { OrderDetailPage } from '../features/storefront/orders/OrderDetailPage';
import { ProfileAddressesPage } from '../features/storefront/profile/ProfileAddressesPage';
import { ShipmentTrackingPage } from '../features/storefront/shipments/ShipmentTrackingPage';

// Keep access checks in the existing pages so guest cart and demo checkout flows remain available.
export const clientRoutes = (
  <>
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/checkout/result" element={<CheckoutResultPage />} />
    <Route path="/profile/orders" element={<MyOrdersPage />} />
    <Route path="/profile/orders/:orderId" element={<OrderDetailPage />} />
    <Route path="/profile/addresses" element={<ProfileAddressesPage />} />
    <Route path="/tracking" element={<ShipmentTrackingPage />} />
  </>
);
