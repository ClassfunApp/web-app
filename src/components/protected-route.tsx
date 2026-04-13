import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { PageLoading } from './ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Set to false for routes that only require login (e.g. /verify-contact) */
  requireContactVerified?: boolean;
}

export function ProtectedRoute({ children, requireContactVerified = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isContactVerified } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  // Parents have their own portal — block them from the business dashboard
  if (user?.roles?.length === 1 && user?.roles?.includes('parent')) return <Navigate to="/login" replace />;

  // If contact (email/phone) not yet verified, redirect to the verify page
  if (requireContactVerified && !isContactVerified) {
    return <Navigate to="/verify-contact" replace />;
  }

  return <>{children}</>;
}
