import { Outlet } from 'react-router-dom';
import { StorefrontNavigation } from './StorefrontNavigation';

export function StorefrontLayout() {
  return (
    <>
      <StorefrontNavigation />
      <Outlet />
    </>
  );
}
