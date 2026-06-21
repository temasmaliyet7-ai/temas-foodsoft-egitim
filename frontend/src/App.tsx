import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { LibraryPage } from './pages/LibraryPage';
import { TrainingViewerPage } from './pages/TrainingViewerPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminTrainingsPage } from './pages/admin/AdminTrainingsPage';
import { Spinner } from './components/Spinner';
import type { ReactNode } from 'react';

function RequireAuth({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner label="Yükleniyor..." />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? <FullScreenLoader /> : user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<LibraryPage />} />
        <Route path="/egitim/:id" element={<TrainingViewerPage />} />
        <Route
          path="/admin/kullanicilar"
          element={
            <RequireAuth adminOnly>
              <AdminUsersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/egitimler"
          element={
            <RequireAuth adminOnly>
              <AdminTrainingsPage />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
