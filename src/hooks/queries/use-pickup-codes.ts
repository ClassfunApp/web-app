import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';

export function useValidatePickupCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post('/pickup-codes/validate', { code });
      return res.data.data as { valid: boolean; child: { id: string; fullName: string; photoUrl: string | null }; usedAt: string };
    },
  });
}
