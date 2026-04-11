import { AlertCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import type { VerificationStatus } from '../types';

function getBannerConfig(kycStatus: VerificationStatus, businessStatus?: VerificationStatus) {
  if (kycStatus === 'rejected' || businessStatus === 'rejected') {
    return {
      icon: <XCircle size={18} className="text-red-500 shrink-0" />,
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      message:
        kycStatus === 'rejected'
          ? 'Your personal verification was rejected. Please review and resubmit.'
          : 'Your business verification was rejected. Please review and resubmit.',
    };
  }
  if (kycStatus === 'submitted' || businessStatus === 'submitted') {
    return {
      icon: <Clock size={18} className="text-blue-500 shrink-0" />,
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      message: 'Your verification is under review. You can continue using the platform while we review.',
    };
  }
  // pending
  return {
    icon: <AlertCircle size={18} className="text-yellow-500 shrink-0" />,
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    message:
      'Your account is not yet verified. Complete verification to unlock all features.',
  };
}

export function VerificationBanner() {
  const { user } = useAuth();

  if (!user) return null;

  const kycStatus = user.kycStatus || 'pending';

  // Only show banner if not fully approved
  if (kycStatus === 'approved') return null;

  const { icon, bg, text, message } = getBannerConfig(kycStatus);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border dark:border-slate-700 px-3 sm:px-4 py-3 ${bg} dark:bg-opacity-20`}>
      <div className="flex items-start gap-2 sm:gap-3">
        {icon}
        <p className={`text-xs sm:text-sm flex-1 ${text} dark:text-slate-200`}>{message}</p>
      </div>
      <Link
        to="/verification"
        className={`flex items-center justify-center gap-1 text-xs sm:text-sm font-medium whitespace-nowrap ${text} dark:text-indigo-400 hover:underline bg-white/50 dark:bg-slate-800 sm:bg-transparent rounded-md px-3 py-1.5 sm:px-0 sm:py-0`}
      >
        Complete verification <ArrowRight size={14} />
      </Link>
    </div>
  );
}
