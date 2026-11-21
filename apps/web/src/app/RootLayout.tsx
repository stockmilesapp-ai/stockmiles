import { Outlet } from 'react-router';
import { AppStatusBar } from '@/shared/components/AppStatusBar.tsx';

export function RootLayout() {
  return (
    <>
      <AppStatusBar />
      <Outlet />
    </>
  );
}
