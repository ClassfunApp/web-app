import type { User } from '../types';

export const TEACHER_PATHS = new Set([
  '/', '/timetable', '/attendance', '/grades', '/reports',
  '/cbt-grading', '/cbt-authoring', '/verification',
]);

export function isTeacherOnly(user: User | null): boolean {
  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  return roles.includes('teacher') && !roles.some((role) =>
    role === 'super_admin' || role === 'business_owner' || role === 'manager',
  );
}
