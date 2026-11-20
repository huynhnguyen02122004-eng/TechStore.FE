import { Route } from 'react-router-dom';
import { HomePage } from '../features/storefront/catalog/HomePage';
import { ProductDetailPage } from '../features/storefront/catalog/ProductDetailPage';
import { LoginPage } from '../features/storefront/auth/LoginPage';
import { RegisterPage } from '../features/storefront/auth/RegisterPage';

export const publicRoutes = (
  <>
    <Route path="/" element={<HomePage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/product/:id" element={<ProductDetailPage />} />
  </>
);
