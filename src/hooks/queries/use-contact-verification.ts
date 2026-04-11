import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export function useSendContactVerification() {
  return useMutation({
    mutationFn: async (data: { type: 'email' | 'phone' }) => {
      const res = await api.post('/auth/send-contact-verification', data);
      return res.data.data as { message: string };
    },
  });
}

export function useVerifyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { type: 'email' | 'phone'; token: string }) => {
      const res = await api.post('/auth/verify-contact', data);
      return res.data.data as {
        message: string;
        emailVerifiedAt: string | null;
        phoneVerifiedAt: string | null;
      };
    },
    onSuccess: () => {
      // Refresh profile so the auth context has the updated verification flags
      qc.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
}
