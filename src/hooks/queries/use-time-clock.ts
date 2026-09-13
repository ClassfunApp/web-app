import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { StaffTimeEntry } from '../../types';

export function useTimeEntries(filters: { centerId?: string; userId?: string; from?: string; to?: string; status?: 'open' | 'closed' }) {
  return useQuery({
    queryKey: ['time-clock', filters],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { from, to, ...rest } = filters;
      const boundary = (day: string, next: boolean) => {
        const [year, month, date] = day.split('-').map(Number);
        return new Date(year, month - 1, date + (next ? 1 : 0)).toISOString();
      };
      const params = { ...rest, startAt: from ? boundary(from, false) : undefined, endBefore: to ? boundary(to, true) : undefined };
      return (await api.get('/time-clock', { params })).data.data as StaffTimeEntry[];
    },
  });
}
