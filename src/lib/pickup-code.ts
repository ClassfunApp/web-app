/** A centre the validator can choose when a child attends more than one. */
export type PickupCenterChoice = { id: string; name: string };

/** One child handled by a validated code; a code can cover several siblings. */
export type ValidatedPickupChild = {
  id: string;
  fullName: string;
  photoUrl: string | null;
  success: boolean;
  action?: 'sign_in' | 'sign_out';
  message?: string;
};

export type PickupValidation = {
  valid: boolean;
  action?: 'sign_in' | 'sign_out';
  child: { id: string; fullName: string; photoUrl: string | null };
  children?: ValidatedPickupChild[];
  center?: PickupCenterChoice;
  usedAt?: string;
};

/**
 * The server refuses to guess where a drop-off happens when the child attends
 * several centres: it answers 409 with the candidates for the validator to pick.
 * Any other failure carries its own message (expired code, not enrolled, …).
 */
export function pickupErrorOf(err: unknown): { message: string; centers: PickupCenterChoice[] | null } {
  const response = (err as {
    response?: { status?: number; data?: { message?: string; details?: { centers?: PickupCenterChoice[] } } };
  })?.response;
  const centers = response?.status === 409 && response.data?.details?.centers?.length
    ? response.data.details.centers
    : null;
  return {
    message: response?.data?.message || 'Could not validate the code. Please try again.',
    centers,
  };
}

/** Children a validation handled, falling back to the single `child` older servers return. */
export function validatedChildren(result: PickupValidation): ValidatedPickupChild[] {
  if (result.children?.length) return result.children;
  return [{ ...result.child, success: true }];
}

export function actionLabel(action: string | undefined): 'Drop-off' | 'Pickup' | null {
  if (action === 'sign_in') return 'Drop-off';
  if (action === 'sign_out') return 'Pickup';
  return null;
}
