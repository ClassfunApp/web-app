import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Report, ReportStatus } from '../../types';

interface ReportFilters {
  childId?: string;
  enrollmentId?: string;
  activityId?: string;
  period?: string;
  status?: ReportStatus;
  limit?: number;
  offset?: number;
}

export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const res = await api.get('/reports', { params: filters });
      return { data: res.data.data as Report[], total: res.data.meta.total as number };
    },
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: async () => {
      const res = await api.get(`/reports/${id}`);
      return res.data.data as Report;
    },
    enabled: !!id,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      childId: string;
      enrollmentId?: string;
      period: string;
      content?: string;
      attachments?: string[];
      status?: ReportStatus;
    }) => {
      const res = await api.post('/reports', dto);
      return res.data.data as Report;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: {
      id: string;
      period?: string;
      content?: string;
      attachments?: string[];
      status?: ReportStatus;
    }) => {
      const res = await api.patch(`/reports/${id}`, dto);
      return res.data.data as Report;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reports/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
