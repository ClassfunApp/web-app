import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useChild } from '../../hooks/queries/use-children';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loading } from '../../components/ui/loading';
import { formatDate } from '../../lib/utils';

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: child, isLoading } = useChild(id!);

  if (isLoading) return <Loading />;
  if (!child) return <p className="text-gray-500">Child not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/children" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Children
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
          {child.fullName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{child.fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge status={child.status} />
            {child.gender && <span className="text-sm text-gray-500">{child.gender}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Profile</h2></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Date of Birth</dt><dd>{formatDate(child.dob)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Family</dt><dd>{child.family?.familyName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Subscription Start</dt><dd>{formatDate(child.subscriptionStartDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Grace Period Ends</dt><dd>{formatDate(child.gracePeriodEndDate)}</dd></div>
              {child.medicalNotes && <div><dt className="text-gray-500 mb-1">Medical Notes</dt><dd className="text-gray-900">{child.medicalNotes}</dd></div>}
              {child.allergies && <div><dt className="text-gray-500 mb-1">Allergies</dt><dd className="text-gray-900">{child.allergies}</dd></div>}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Enrollments</h2></CardHeader>
          <CardContent>
            {!child.enrollments?.length ? (
              <p className="text-sm text-gray-500">No enrollments yet.</p>
            ) : (
              <div className="space-y-3">
                {child.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{e.activity?.name || 'Activity'}</span>
                    <Badge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
