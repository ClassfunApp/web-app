import { LogOut, Bell, Search, HelpCircle, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/centers': 'Centers',
  '/children': 'Children',
  '/families': 'Families',
  '/activities': 'Activities',
  '/enrollments': 'Enrollments',
  '/attendance': 'Attendance',
  '/payments': 'Payments',
  '/staff': 'Staff',
  '/pickup-codes': 'Pickup Codes',
  '/notifications': 'Notifications',
  '/verification': 'Verification',
};

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path),
  )?.[1] ?? 'Dashboard';

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-100 px-6 h-[65px] shadow-[0_1px_0_0_#f1f5f9]">
      {/* Page Title */}
      <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">{title}</h1>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 w-72 text-sm text-slate-400 cursor-pointer hover:border-slate-300 transition-colors">
        <Search size={15} className="shrink-0 text-slate-400" />
        <span className="flex-1 text-slate-400 text-[13px]">Search children, families…</span>
        <kbd className="text-[10px] text-slate-400 bg-slate-200 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <HelpCircle size={18} />
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
        </button>

        {/* User */}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 ml-1 pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[13px] font-semibold text-slate-800 leading-none">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
          <LogOut size={14} className="text-slate-400 ml-1" />
        </button>
      </div>
    </header>
  );
}
