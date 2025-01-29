import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSessionContext } from '@supabase/auth-helpers-react';
import { LoadingSkeleton } from "../loading/LoadingSkeleton";

const Index = lazy(() => import("@/pages/Index"));
const LandingPage = lazy(() => import("@/components/LandingPage").then(module => ({ default: module.LandingPage })));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const EpisodePage = lazy(() => import("@/pages/EpisodePage").then(module => ({ default: module.EpisodePage })));
const UniversityPage = lazy(() => import("@/pages/UniversityPage"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, session } = useSessionContext();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  const { isLoading: isLoadingSession, session } = useSessionContext();
  const location = useLocation();

  if (isLoadingSession) {
    return <LoadingSkeleton />;
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          session ? <Navigate to="/app" replace state={{ from: location }} /> : <AuthPage />
        } />
        <Route path="/signup" element={
          session ? <Navigate to="/app" replace state={{ from: location }} /> : <AuthPage />
        } />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/university"
          element={
            <ProtectedRoute>
              <UniversityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/university/:folderId"
          element={
            <ProtectedRoute>
              <UniversityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/episode/:episodeId"
          element={
            <ProtectedRoute>
              <EpisodePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};