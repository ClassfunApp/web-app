import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Baby,
  Dumbbell,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  UserCog,
  QrCode,
  Bell,
  UsersRound,
  ShieldCheck,
  MapPin,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/use-auth';
import { useCenters } from '../../hooks/queries/use-centers';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/children', icon: Baby, label: 'Children' },
  { to: '/families', icon: UsersRound, label: 'Families' },
  { to: '/activities', icon: Dumbbell, label: 'Activities' },
  { to: '/enrollments', icon: ClipboardList, label: 'Enrollments' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
];

const managementNav = [
  { to: '/centers', icon: Building2, label: 'Centers', ownerOnly: true },
  { to: '/staff', icon: UserCog, label: 'Staff', ownerOnly: true },
  { to: '/pickup-codes', icon: QrCode, label: 'Pickup Codes' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  submitted: 'bg-indigo-400',
  rejected: 'bg-red-400',
};

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
  exact = false,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: React.ReactNode;
  exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative',
          'animate-slide-in-left opacity-0 [animation-fill-mode:forwards]',
          isActive
            ? 'text-indigo-600 bg-indigo-50/80'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
          )}
          <Icon
            size={18}
            className={cn(
              'shrink-0 transition-colors',
              isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
            )}
          />
          <span className="flex-1">{label}</span>
          {badge}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const kycStatus = user?.kycStatus || 'pending';
  const isVerified = kycStatus === 'approved';
  const isManager = user?.role === 'manager';
  const isOwner = user?.role === 'business_owner';

  const { data: centers = [] } = useCenters();
  const managerCenter = isManager && user.centerId
    ? centers.find((c) => c.id === user.centerId)
    : null;

  const isVerificationActive = location.pathname === '/verification';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm tracking-tight">CF</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[17px] font-bold text-slate-800 tracking-tight">Classfun</span>
          {isManager && managerCenter && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-500 font-medium">
              <MapPin size={9} />
              {managerCenter.name}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Main Menu */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Main Menu</span>
            <ChevronDown size={12} className="text-slate-300" />
          </div>
          <div className="space-y-0.5 stagger-children">
            {mainNav.map((item) => (
              <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} exact={item.to === '/'} />
            ))}
          </div>
        </div>

        {/* Management */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Management</span>
            <ChevronDown size={12} className="text-slate-300" />
          </div>
          <div className="space-y-0.5 stagger-children">
            {managementNav
              .filter((item) => !item.ownerOnly || isOwner)
              .map((item) => (
                <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
              ))}

            {/* Verification with status dot */}
            <NavLink
              to="/verification"
              className={cn(
                'group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                isVerificationActive
                  ? 'text-indigo-600 bg-indigo-50/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
              )}
            >
              {isVerificationActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
              <ShieldCheck
                size={18}
                className={cn(
                  'shrink-0',
                  isVerificationActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              <span className="flex-1">Verification</span>
              {!isVerified && (
                <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[kycStatus] || 'bg-amber-400')} />
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom promo */}
      <div className="px-4 pb-5">
        <div className="bg-indigo-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={14} className="text-indigo-200" />
            <span className="text-[13px] font-semibold">Pro Features</span>
          </div>
          <p className="text-[11px] text-indigo-200 leading-relaxed mb-3">
            Unlock advanced reports, bulk SMS, and API access.
          </p>
          <button className="w-full bg-white text-indigo-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}
