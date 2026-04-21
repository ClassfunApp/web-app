import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Baby,
  Dumbbell,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  Wallet,
  UserCog,
  QrCode,
  Bell,
  UsersRound,
  ShieldCheck,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Settings,
  Receipt,
  FileText,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/use-auth";
import { useBusinessType } from "../../hooks/use-business-type";
import { useCenters } from "../../hooks/queries/use-centers";
import { ClassfunLogo } from "../ui/classfun-logo";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  submitted: "bg-indigo-400",
  rejected: "bg-red-400",
};

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
  exact = false,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: React.ReactNode;
  exact?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative",
          "animate-slide-in-left opacity-0 [animation-fill-mode:forwards]",
          isActive
            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
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
              "shrink-0 transition-colors",
              isActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSchool, terms } = useBusinessType();

  const mainNav = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/children", icon: Baby, label: isSchool ? "Students" : "Children" },
    { to: "/families", icon: UsersRound, label: "Families" },
    { to: "/activities", icon: Dumbbell, label: terms.activities },
    { to: "/enrollments", icon: ClipboardList, label: "Enrollments" },
    { to: "/attendance", icon: CalendarCheck, label: "Attendance" },
    { to: "/payments", icon: CreditCard, label: "Payments" },
    { to: "/wallet", icon: Wallet, label: "Wallet" },
    { to: "/reports", icon: FileText, label: "Reports" },
    { to: "/grades", icon: GraduationCap, label: "Grades" },
    { to: "/settings/branding", icon: Settings, label: "Settings" },
  ];

  const ownerNav = [
    { to: "/subscription", icon: Receipt, label: "Subscription" },
  ];

  const managementNav = [
    { to: "/centers", icon: Building2, label: isSchool ? "Campuses" : "Centers", ownerOnly: true },
    { to: "/staff", icon: UserCog, label: isSchool ? "Staff & Teachers" : "Staff", ownerOnly: true },
    { to: "/permissions", icon: ShieldCheck, label: "Permissions" },
    { to: "/pickup-codes", icon: QrCode, label: "Pickup Codes" },
    { to: "/notifications", icon: Bell, label: "Notifications" },
  ];

  const kycStatus = user?.kycStatus || "pending";
  const isVerified = kycStatus === "approved";
  const isManager = user?.roles?.includes("manager") || false;
  const isOwner = user?.roles?.includes("business_owner") || false;

  const { data: centers = [] } = useCenters();
  const managerCenter =
    isManager && user?.centerId
      ? centers.find((c) => c.id === user?.centerId)
      : null;

  const isVerificationActive = location.pathname === "/verification";

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4">
        <ClassfunLogo variant="full" size="sm" animated />
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col shadow-sm",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <ClassfunLogo variant="full" size="sm" animated />
          {isManager && managerCenter && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-500 font-medium ml-auto">
              <MapPin size={9} />
              {managerCenter.name}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Menu */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Main Menu
              </span>
              <ChevronDown size={12} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div className="space-y-0.5 stagger-children">
              {mainNav.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  exact={item.to === "/"}
                  onClick={closeMobileMenu}
                />
              ))}
            </div>
          </div>

          {/* Management */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Management
              </span>
              <ChevronDown size={12} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div className="space-y-0.5 stagger-children">
              {managementNav
                .filter((item) => !item.ownerOnly || isOwner)
                .map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    onClick={closeMobileMenu}
                  />
                ))}

              {/* Verification with status dot */}
              <NavLink
                to="/verification"
                onClick={closeMobileMenu}
                className={cn(
                  "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                  isVerificationActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                {isVerificationActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                )}
                <ShieldCheck
                  size={18}
                  className={cn(
                    "shrink-0",
                    isVerificationActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
                  )}
                />
                <span className="flex-1 dark:text-slate-200">Verification</span>
                {!isVerified && (
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      STATUS_DOT[kycStatus] || "bg-amber-400",
                    )}
                  />
                )}
              </NavLink>
            </div>
          </div>

          {/* Billing — owner only */}
          {isOwner && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Billing
                </span>
                <ChevronDown size={12} className="text-slate-300 dark:text-slate-600" />
              </div>
              <div className="space-y-0.5 stagger-children">
                {ownerNav.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    onClick={closeMobileMenu}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
