import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { TimetableEntry } from '../../types';

export type TimetableInput = Pick<TimetableEntry, 'centerId' | 'activityId' | 'dayOfWeek' | 'startTime' | 'endTime'> & Partial<Pick<TimetableEntry, 'classLevelId' | 'teacherId' | 'room' | 'notes'>>;
export function useTimetable(centerId?: string) { return useQuery({ queryKey: ['timetable', centerId], queryFn: async () => (await api.get('/timetable', { params: centerId ? { centerId } : {} })).data.data as TimetableEntry[] }); }
export function useSaveTimetableEntry() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...data }: TimetableInput & { id?: string }) => (id ? api.patch(`/timetable/${id}`, data) : api.post('/timetable', data)).then((r) => r.data.data as TimetableEntry), onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }) }); }
export function useDeleteTimetableEntry() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.delete(`/timetable/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }) }); }
