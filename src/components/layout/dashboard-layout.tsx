import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function DashboardLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#f0f3f9]">
      <Sidebar />
      <div className="flex flex-col min-h-screen lg:ml-64 pt-16 lg:pt-0">
        <Header />
        {/* key forces re-mount → page-enter animation fires on every route change */}
        <main key={pathname} className="flex-1 p-4 lg:p-6 xl:p-7 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
