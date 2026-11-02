import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { News } from './pages/News';
import { ArticleDetail } from './pages/ArticleDetail';
import { Discover } from './pages/Discover';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { BottomNav } from './components/BottomNav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Mobile-first centred shell */}
        <div className="min-h-screen bg-[var(--color-bg)] flex justify-center">
          <div className="w-full max-w-[430px] relative bg-[var(--color-bg)]">
            <Routes>
              <Route path="/" element={<News />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
