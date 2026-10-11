import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import type { PickupValidation } from '../../lib/pickup-code';

export function useValidatePickupCode() {
  return useMutation({
    mutationFn: async ({ code, centerId }: { code: string; centerId?: string }) => {
      const res = await api.post('/pickup-codes/validate', { code, ...(centerId ? { centerId } : {}) });
      return res.data.data as PickupValidation;
    },
  });
}
