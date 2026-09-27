import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import UnrollProvider from '../unroll/UnrollProvider';

// Pages are code-split; the landing installation only loads with the landing page.
const Landing = lazy(() => import('../pages/Landing/Landing'));
const CaseStudy = lazy(() => import('../pages/CaseStudy/CaseStudy'));
const About = lazy(() => import('../pages/About/About'));
const LooseEnds = lazy(() => import('../pages/LooseEnds/LooseEnds'));
const NotFound = lazy(() => import('../pages/NotFound/NotFound'));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* the unroll overlay sits outside Suspense so it survives the route change */}
      <UnrollProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/work/:slug" element={<CaseStudy />} />
            <Route path="/about" element={<About />} />
            <Route path="/loose-ends" element={<LooseEnds />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </UnrollProvider>
    </BrowserRouter>
  );
}
