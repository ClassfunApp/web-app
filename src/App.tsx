import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/use-auth';
import { ThemeProvider } from './hooks/use-theme';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './components/layout/dashboard-layout';

// Auth pages
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import VerifyContactPage from './pages/auth/verify-contact';

// Dashboard pages
import DashboardPage from './pages/dashboard';
import CentersPage from './pages/centers/index';
import ChildrenPage from './pages/children/index';
import ChildDetailPage from './pages/children/detail';
import ActivitiesPage from './pages/activities/index';
import FamiliesPage from './pages/families/index';
import FamilyDetailPage from './pages/families/detail';
import EnrollmentsPage from './pages/enrollments/index';
import AttendancePage from './pages/attendance/index';
import PaymentsPage from './pages/payments/index';
import StaffPage from './pages/staff/index';
import PickupCodesPage from './pages/pickup-codes/index';
import NotificationsPage from './pages/notifications/index';
import VerificationPage from './pages/verification/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Requires login but NOT contact verification */}
            <Route
              path="/verify-contact"
              element={
                <ProtectedRoute requireContactVerified={false}>
                  <VerifyContactPage />
                </ProtectedRoute>
              }
            />

            {/* Protected dashboard routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="centers" element={<CentersPage />} />
              <Route path="children" element={<ChildrenPage />} />
              <Route path="children/:id" element={<ChildDetailPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="families" element={<FamiliesPage />} />
              <Route path="families/:id" element={<FamilyDetailPage />} />
              <Route path="enrollments" element={<EnrollmentsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="pickup-codes" element={<PickupCodesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="verification" element={<VerificationPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
