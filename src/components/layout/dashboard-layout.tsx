import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function DashboardLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#f0f3f9]">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header />
        {/* key forces re-mount → page-enter animation fires on every route change */}
        <main key={pathname} className="flex-1 p-6 lg:p-7 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
