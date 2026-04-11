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
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${bg}`}>
      {icon}
      <p className={`text-sm flex-1 ${text}`}>{message}</p>
      <Link
        to="/verification"
        className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap ${text} hover:underline`}
      >
        Complete verification <ArrowRight size={14} />
      </Link>
    </div>
  );
}
