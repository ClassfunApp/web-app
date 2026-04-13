// Enums
export type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'teacher' | 'staff' | 'parent';
export type TenantStatus = 'trial' | 'active' | 'suspended';
export type BillingRegion = 'nigeria' | 'overseas';
export type ChildStatus = 'active' | 'suspended' | 'inactive';
export type CenterStatus = 'active' | 'inactive' | 'archived';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type AttendanceMethod = 'qr' | 'manual';
export type FeeStatus = 'pending' | 'paid' | 'overdue';
export type GuardianRelationship = 'mother' | 'father' | 'guardian' | 'other';
export type NotificationType = 'whatsapp' | 'push' | 'email';
export type NotificationStatus = 'sent' | 'delivered' | 'failed';
export type VerificationStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type IdType = 'nin' | 'passport' | 'drivers_license' | 'voters_card' | 'ssn' | 'other';

// Entities
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  subscriptionPlan: 'monthly' | 'annual';
  subscriptionStatus: TenantStatus;
  billingRegion: BillingRegion;
  billingCurrency: string;
  gracePeriodDays: number;
  trialEndsAt: string | null;
  businessVerificationStatus: VerificationStatus;
  businessVerifiedAt: string | null;
  businessRejectionReason: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  centerId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  roles?: UserRole[];
  isActive: boolean;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  kycStatus: VerificationStatus;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  kycRejectionReason: string | null;
  createdAt: string;
}

export interface Center {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  operatingHours: Record<string, unknown> | null;
  coverPhotoUrl: string | null;
  qrCodeUrl: string | null;
  qrCodeSecret: string | null;
  status: CenterStatus;
  createdAt: string;
}

export interface Family {
  id: string;
  tenantId: string;
  familyName: string;
  guardians?: Guardian[];
  children?: Child[];
  createdAt: string;
}

export interface Guardian {
  id: string;
  familyId: string;
  fullName: string;
  phone: string;
  email: string | null;
  relationship: GuardianRelationship;
  userId: string | null;
  createdAt: string;
}

export interface Child {
  id: string;
  tenantId: string;
  familyId: string | null;
  fullName: string;
  dob: string | null;
  gender: string | null;
  photoUrl: string | null;
  medicalNotes: string | null;
  allergies: string | null;
  status: ChildStatus;
  subscriptionStartDate: string | null;
  gracePeriodEndDate: string | null;
  family?: Family;
  enrollments?: Enrollment[];
  createdAt: string;
}

export interface Activity {
  id: string;
  tenantId: string;
  centerId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  feeAmount: number;
  feeCurrency: string;
  schedule: Record<string, unknown> | null;
  isActive: boolean;
  center?: Center;
  classLevels?: ClassLevel[];
  createdAt: string;
}

export interface ClassLevel {
  id: string;
  activityId: string;
  name: string;
  orderIndex: number;
  capacity: number | null;
  teacherIds: string[];
  createdAt: string;
}

export interface Enrollment {
  id: string;
  childId: string;
  activityId: string;
  classLevelId: string | null;
  enrolledAt: string;
  status: EnrollmentStatus;
  child?: Child;
  activity?: Activity;
  classLevel?: ClassLevel;
  createdAt: string;
}

export interface Attendance {
  id: string;
  enrollmentId: string;
  centerId: string;
  date: string;
  signedInAt: string | null;
  signedOutAt: string | null;
  signedInBy: string | null;
  method: AttendanceMethod;
  enrollment?: Enrollment;
  center?: Center;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  childId: string;
  tenantId: string;
  description: string | null;
  amount: number;
  currency: string;
  dueDate: string;
  status: FeeStatus;
  paymentLinkUrl: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  gatewayReference: string | null;
  child?: Child;
  createdAt: string;
}

export interface PickupCode {
  id: string;
  childId: string;
  generatedBy: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt: string | null;
  usedBy: string | null;
  child?: Child;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  tenantId: string;
  recipientId: string;
  type: NotificationType;
  template: string | null;
  status: NotificationStatus;
  sentAt: string;
  createdAt: string;
}

export interface UserVerification {
  id: string;
  userId: string;
  tenantId: string;
  bvnSsn: string | null;
  idType: IdType | null;
  idImageUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  proofOfAddressUrl: string | null;
  status: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface TenantVerification {
  id: string;
  tenantId: string;
  businessRegNumber: string | null;
  taxIdNumber: string | null;
  registrationCertificateUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  proofOfAddressUrl: string | null;
  status: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// API response wrapper
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

// Dashboard stats
export interface DashboardStats {
  tenant: {
    id: string;
    name: string;
    subscriptionStatus: TenantStatus;
    billingRegion: BillingRegion;
  };
  stats: {
    totalCenters: number;
    totalChildren: number;
    totalStaff: number;
  };
}
