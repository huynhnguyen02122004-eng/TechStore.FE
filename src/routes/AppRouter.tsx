import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StorefrontLayout } from '../shared/layouts/StorefrontLayout';
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
          {adminRoutes}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
