import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/',
  headers: { 'Content-Type': 'application/json' },
});

export interface PublicTenantInfo {
  id: string;
  name: string;
  logoUrl: string | null;
  businessType: 'activity_center' | 'school';
}

export interface EnrollmentChild {
  fullName: string;
  dob?: string;
  gender?: string;
  medicalNotes?: string;
  allergies?: string;
}

export interface EnrollmentPayload {
  familyName: string;
  guardian: {
    fullName: string;
    phone: string;
    email?: string;
    relationship: 'mother' | 'father' | 'guardian' | 'other';
  };
  children: EnrollmentChild[];
}

export function useEnrollmentPage(tenantId: string) {
  return useQuery({
    queryKey: ['public-enrollment', tenantId],
    queryFn: async () => {
      const res = await publicApi.get(`/public/enroll/${tenantId}`);
      return res.data.data as PublicTenantInfo;
    },
    enabled: !!tenantId,
    retry: false,
  });
}

export function useSubmitEnrollment(tenantId: string) {
  return useMutation({
    mutationFn: async (payload: EnrollmentPayload) => {
      const res = await publicApi.post(`/public/enroll/${tenantId}`, payload);
      return res.data.data as { familyId: string; childrenCount: number; message: string };
    },
  });
}
