import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/app/RootLayout.tsx';
import { HomePage } from '@/features/home/pages/HomePage.tsx';
import { NotFoundPage } from '@/features/home/pages/NotFoundPage.tsx';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
