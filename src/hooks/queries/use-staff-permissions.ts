import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { StaffPermission, StaffPermissionType } from '../../types';

export function useStaffPermissions(userId?: string, centerId?: string) {
  return useQuery({
    queryKey: ['staff-permissions', { userId, centerId }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (userId)   params.userId   = userId;
      if (centerId) params.centerId = centerId;
      const res = await api.get('/staff-permissions', { params });
      return res.data.data as StaffPermission[];
    },
    enabled: !!(userId || centerId),
  });
}

export function useGrantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { userId: string; permission: StaffPermissionType }) => {
      const res = await api.post('/staff-permissions', dto);
      return res.data.data as StaffPermission;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-permissions'] }),
  });
}

export function useRevokePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/staff-permissions/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-permissions'] }),
  });
}
