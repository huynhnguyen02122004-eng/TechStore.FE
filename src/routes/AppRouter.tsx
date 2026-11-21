import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StorefrontLayout } from '../shared/layouts/StorefrontLayout';
import { AdminLayout } from '../shared/layouts/AdminLayout';
import { adminRoutes } from './adminRoutes';
import { clientRoutes } from './clientRoutes';
import { publicRoutes } from './publicRoutes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StorefrontLayout />}>
          {publicRoutes}
          {clientRoutes}
        </Route>
        <Route element={<AdminLayout />}>
          {adminRoutes}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
