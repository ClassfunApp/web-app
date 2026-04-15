import { useDashboard } from './queries/use-tenants';
import type { BusinessType } from '../types';

/**
 * Returns the tenant's business type and a set of terminology helpers
 * so every component can adapt its copy without duplicating logic.
 */
export function useBusinessType() {
  const { data: dashboard } = useDashboard();
  const businessType: BusinessType = dashboard?.tenant.businessType ?? 'activity_center';
  const isSchool = businessType === 'school';

  return {
    businessType,
    isSchool,
    isActivityCenter: !isSchool,

    // Terminology helpers
    terms: {
      // Singular / plural for the main programme unit
      activity: isSchool ? 'Classroom' : 'Activity',
      activities: isSchool ? 'Classrooms' : 'Activities',

      // Sub-level within a programme
      classLevel: isSchool ? 'Subject' : 'Class Level',
      classLevels: isSchool ? 'Subjects' : 'Class Levels',

      // Locations
      center: isSchool ? 'Campus' : 'Center',
      centers: isSchool ? 'Campuses' : 'Centers',

      // People
      child: isSchool ? 'Student' : 'Child',
      children: isSchool ? 'Students' : 'Children',

      // Dashboard stat labels
      totalCenters: isSchool ? 'Total Campuses' : 'Total Centers',
      totalChildren: isSchool ? 'Active Students' : 'Active Children',
      totalStaff: isSchool ? 'Teachers & Staff' : 'Staff Members',
    },
  };
}
