import { useState } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, User, Building2 } from 'lucide-react';
import { useMyUserVerification, useMyTenantVerification } from '../../hooks/queries/use-verification';
import { useAuth } from '../../hooks/use-auth';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { UserKycForm } from './user-kyc-form';
import { TenantKycForm } from './tenant-kyc-form';
import { formatDate } from '../../lib/utils';
import type { VerificationStatus } from '../../types';

const STATUS_ICON: Record<VerificationStatus, React.ReactNode> = {
  pending: <AlertCircle size={20} className="text-yellow-500" />,
  submitted: <Clock size={20} className="text-blue-500" />,
  approved: <CheckCircle size={20} className="text-green-500" />,
  rejected: <XCircle size={20} className="text-red-500" />,
};

const STATUS_MESSAGE: Record<VerificationStatus, string> = {
  pending: 'Not submitted yet. Please complete and submit your information.',
  submitted: 'Under review. We\'ll notify you once it\'s been reviewed.',
  approved: 'Verified! Your information has been approved.',
  rejected: 'Rejected. Please review the reason below and resubmit.',
};

function StatusBanner({ status, rejectionReason }: { status: VerificationStatus; rejectionReason?: string | null }) {
  const colors: Record<VerificationStatus, string> = {
    pending: 'bg-yellow-50 border-yellow-200',
    submitted: 'bg-blue-50 border-blue-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
  };
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${colors[status]}`}>
      {STATUS_ICON[status]}
      <div>
        <p className="text-sm font-medium text-gray-800">{STATUS_MESSAGE[status]}</p>
        {status === 'rejected' && rejectionReason && (
          <p className="text-sm text-red-600 mt-1">Reason: {rejectionReason}</p>
        )}
      </div>
    </div>
  );
}

type Tab = 'personal' | 'business';

export default function VerificationPage() {
  const { user } = useAuth();
  const { data: userVerification, isLoading: loadingUser } = useMyUserVerification();
  const { data: tenantVerification, isLoading: loadingTenant } = useMyTenantVerification();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [successMsg, setSuccessMsg] = useState('');

  const isBusinessOwner = user?.role === 'business_owner';

  const userStatus: VerificationStatus = userVerification?.status ?? user?.kycStatus ?? 'pending';
  const tenantStatus: VerificationStatus = tenantVerification?.status ?? 'pending';

  if (loadingUser || loadingTenant) return <Loading />;

  const canEditPersonal = userStatus === 'pending' || userStatus === 'rejected';
  const canEditBusiness = tenantStatus === 'pending' || tenantStatus === 'rejected';

  const tabs = [
    { id: 'personal' as Tab, label: 'Personal KYC', icon: User, status: userStatus },
    ...(isBusinessOwner
      ? [{ id: 'business' as Tab, label: 'Business Verification', icon: Building2, status: tenantStatus }]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Verification</h1>
        <p className="text-gray-500 mt-1">
          Complete your verification to unlock all features. Both personal and business verification are required.
        </p>
      </div>

      {/* Overall status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <User size={20} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Personal KYC</p>
              <div className="flex items-center gap-2 mt-0.5">
                {STATUS_ICON[userStatus]}
                <Badge status={userStatus} />
              </div>
            </div>
          </CardContent>
        </Card>
        {isBusinessOwner && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Building2 size={20} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Business Verification</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {STATUS_ICON[tenantStatus]}
                  <Badge status={tenantStatus} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSuccessMsg(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <Badge status={tab.status} />
            </button>
          ))}
        </nav>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle size={18} className="text-green-500" />
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Personal KYC tab */}
      {activeTab === 'personal' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Personal Identity Verification</h2>
                {userVerification?.submittedAt && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Last submitted: {formatDate(userVerification.submittedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <StatusBanner
                status={userStatus}
                rejectionReason={userVerification?.rejectionReason ?? user?.kycRejectionReason}
              />
              {canEditPersonal ? (
                <UserKycForm
                  existing={userVerification ?? null}
                  onSuccess={() => setSuccessMsg('Personal KYC submitted successfully! We\'ll review it shortly.')}
                />
              ) : (
                <VerificationSummary
                  items={[
                    { label: 'ID Type', value: userVerification?.idType?.replace('_', ' ') },
                    { label: 'BVN / SSN', value: userVerification?.bvnSsn ? '••••••' : undefined },
                    { label: 'Address', value: userVerification?.addressLine1 },
                    { label: 'City', value: userVerification?.city },
                    { label: 'State', value: userVerification?.state },
                    { label: 'Country', value: userVerification?.country },
                  ]}
                  imageUrls={[
                    { label: 'ID Image', url: userVerification?.idImageUrl },
                    { label: 'Proof of Address', url: userVerification?.proofOfAddressUrl },
                  ]}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business verification tab */}
      {activeTab === 'business' && isBusinessOwner && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Business Verification</h2>
              {tenantVerification?.submittedAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last submitted: {formatDate(tenantVerification.submittedAt)}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <StatusBanner
                status={tenantStatus}
                rejectionReason={tenantVerification?.rejectionReason}
              />
              {canEditBusiness ? (
                <TenantKycForm
                  existing={tenantVerification ?? null}
                  onSuccess={() => setSuccessMsg('Business verification submitted successfully! We\'ll review it shortly.')}
                />
              ) : (
                <VerificationSummary
                  items={[
                    { label: 'Registration Number', value: tenantVerification?.businessRegNumber },
                    { label: 'Tax ID (TIN)', value: tenantVerification?.taxIdNumber },
                    { label: 'Address', value: tenantVerification?.addressLine1 },
                    { label: 'City', value: tenantVerification?.city },
                    { label: 'State', value: tenantVerification?.state },
                    { label: 'Country', value: tenantVerification?.country },
                  ]}
                  imageUrls={[
                    { label: 'Registration Certificate', url: tenantVerification?.registrationCertificateUrl },
                    { label: 'Proof of Address', url: tenantVerification?.proofOfAddressUrl },
                  ]}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VerificationSummary({
  items,
  imageUrls,
}: {
  items: { label: string; value?: string | null }[];
  imageUrls: { label: string; url?: string | null }[];
}) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
        {items.filter((i) => i.value).map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</dt>
            <dd className="text-sm font-medium text-gray-900 mt-0.5 capitalize">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-4 pt-2">
        {imageUrls.filter((i) => i.url).map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-xs text-gray-500">{item.label}</p>
            {item.url?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
              <img src={item.url} alt={item.label} className="h-20 w-auto rounded border border-gray-200 object-cover" />
            ) : (
              <a
                href={item.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 underline"
              >
                View document
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
