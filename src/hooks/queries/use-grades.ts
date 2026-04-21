import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Grade } from '../../types';

interface GradeFilters {
  childId?: string;
  enrollmentId?: string;
  activityId?: string;
  period?: string;
  isPublished?: boolean;
  limit?: number;
  offset?: number;
}

export function useGrades(filters: GradeFilters = {}) {
  return useQuery({
    queryKey: ['grades', filters],
    queryFn: async () => {
      const res = await api.get('/grades', { params: filters });
      return { data: res.data.data as Grade[], total: res.data.meta.total as number };
    },
  });
}

export function useGrade(id: string) {
  return useQuery({
    queryKey: ['grades', id],
    queryFn: async () => {
      const res = await api.get(`/grades/${id}`);
      return res.data.data as Grade;
    },
    enabled: !!id,
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      enrollmentId: string;
      period: string;
      score?: number;
      maxScore?: number;
      letterGrade?: string;
      comments?: string;
    }) => {
      const res = await api.post('/grades', dto);
      return res.data.data as Grade;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: {
      id: string;
      period?: string;
      score?: number;
      maxScore?: number;
      letterGrade?: string;
      comments?: string;
    }) => {
      const res = await api.patch(`/grades/${id}`, dto);
      return res.data.data as Grade;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function usePublishGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/grades/${id}/publish`);
      return res.data.data as Grade;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function useUnpublishGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/grades/${id}/unpublish`);
      return res.data.data as Grade;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/grades/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  });
}
