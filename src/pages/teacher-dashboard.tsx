import { Link } from 'react-router-dom';
import { CalendarDays, CalendarCheck, GraduationCap, FileText } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { Card } from '../components/ui/card';

const links = [
  { to: '/timetable', label: 'My timetable', icon: CalendarDays },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/grades', label: 'Grades', icon: GraduationCap },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">Your teaching workspace</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map(({ to, label, icon: Icon }) => <Link key={to} to={to}>
        <Card className="flex items-center gap-4 p-5 hover:border-indigo-300 dark:hover:border-indigo-700">
          <Icon size={22} className="text-indigo-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        </Card>
      </Link>)}
    </div>
  </div>;
}
