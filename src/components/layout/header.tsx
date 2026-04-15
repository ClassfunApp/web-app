import { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, Search, HelpCircle, ChevronDown, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useTheme } from '../../hooks/use-theme';

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
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path),
  )?.[1] ?? 'Dashboard';

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 lg:px-6 h-[65px] shadow-[0_1px_0_0#f1f5f9] dark:shadow-[0_1px_0_0#1e293b]">
      {/* Page Title */}
      <h1 className="text-lg lg:text-[22px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h1>

      {/* Search - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 w-72 text-sm text-slate-400 dark:text-slate-400 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
        <Search size={15} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <span className="flex-1 text-slate-400 dark:text-slate-500 text-[13px]">Search children, families…</span>
        <kbd className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 lg:gap-2">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <HelpCircle size={18} />
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        {/* Mobile search icon */}
        <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Search size={18} />
        </button>

        {/* User Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 lg:gap-2.5 ml-1 pl-2 lg:pl-3 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-none">{user?.fullName}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 sm:hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.fullName}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
