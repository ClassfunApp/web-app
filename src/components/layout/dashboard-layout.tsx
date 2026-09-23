import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAuth } from '../../hooks/use-auth';
import { isTeacherOnly, TEACHER_PATHS } from '../../lib/teacher-access';

export function DashboardLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  if (isTeacherOnly(user) && !TEACHER_PATHS.has(pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f0f3f9] dark:bg-slate-950 overflow-x-hidden">
      <Sidebar />
      <div className="flex flex-col min-h-screen lg:ml-64 pt-16 lg:pt-0">
        <Header />
        {/* key forces re-mount → page-enter animation fires on every route change */}
        <main key={pathname} className="flex-1 p-4 lg:p-6 xl:p-7 page-enter overflow-x-hidden min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
