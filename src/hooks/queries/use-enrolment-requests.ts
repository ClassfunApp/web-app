import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { EnrolmentRequest, EnrolmentRequestStatus } from '../../types';

export function useEnrolmentRequests(status?: EnrolmentRequestStatus) {
  return useQuery({
    queryKey: ['enrolment-requests', status ?? 'all'],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const res = await api.get('/enrolment-requests', { params });
      return res.data.data as EnrolmentRequest[];
    },
  });
}

export function useApproveEnrolmentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      activityId,
      classLevelId,
    }: {
      id: string;
      activityId?: string;
      classLevelId?: string;
    }) => {
      const res = await api.patch(`/enrolment-requests/${id}/approve`, {
        activityId,
        classLevelId,
      });
      return res.data.data as EnrolmentRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolment-requests'] });
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['children'] });
    },
  });
}

export function useRejectEnrolmentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.patch(`/enrolment-requests/${id}/reject`, { reason });
      return res.data.data as EnrolmentRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrolment-requests'] });
    },
  });
}
