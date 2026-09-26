import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

// Pages are code-split; the landing installation only loads with the landing page.
const Landing = lazy(() => import('../pages/Landing/Landing'));
const NotFound = lazy(() => import('../pages/NotFound/NotFound'));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
