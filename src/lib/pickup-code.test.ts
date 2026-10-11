import { describe, it, expect } from 'vitest';
import { actionLabel, pickupErrorOf, validatedChildren, type PickupValidation } from './pickup-code';

const axiosError = (status: number, data: unknown) => ({ response: { status, data } });

describe('pickupErrorOf', () => {
  it('returns the centre choices when the server cannot tell where a drop-off is', () => {
    const err = axiosError(409, {
      message: 'Imogen Oyelola is enrolled at more than one center. Choose the center you are at.',
      details: { centers: [{ id: 'ikoyi', name: 'Ikoyi' }, { id: 'lekki', name: 'Lekki' }] },
    });
    expect(pickupErrorOf(err)).toEqual({
      message: 'Imogen Oyelola is enrolled at more than one center. Choose the center you are at.',
      centers: [{ id: 'ikoyi', name: 'Ikoyi' }, { id: 'lekki', name: 'Lekki' }],
    });
  });

  it('passes the server message through for other errors', () => {
    expect(pickupErrorOf(axiosError(400, { message: 'Not enrolled at this center' }))).toEqual({
      message: 'Not enrolled at this center',
      centers: null,
    });
  });

  it('falls back to a generic message when the server sent none', () => {
    expect(pickupErrorOf(new Error('Network Error'))).toEqual({
      message: 'Could not validate the code. Please try again.',
      centers: null,
    });
  });
});

describe('validatedChildren', () => {
  it('lists every child on a sibling code, including ones that were skipped', () => {
    const result: PickupValidation = {
      valid: true,
      action: 'sign_out',
      child: { id: 'imogen', fullName: 'Imogen Oyelola', photoUrl: null },
      children: [
        { id: 'imogen', fullName: 'Imogen Oyelola', photoUrl: null, success: true, action: 'sign_out' },
        { id: 'isla', fullName: 'Isla Oyelola', photoUrl: null, success: false, message: 'Not checked in today' },
      ],
    };
    expect(validatedChildren(result).map((c) => [c.fullName, c.success, c.message])).toEqual([
      ['Imogen Oyelola', true, undefined],
      ['Isla Oyelola', false, 'Not checked in today'],
    ]);
  });

  it('falls back to the single child older servers return', () => {
    expect(validatedChildren({ valid: true, child: { id: 'a', fullName: 'Ada', photoUrl: null } })).toEqual([
      { id: 'a', fullName: 'Ada', photoUrl: null, success: true },
    ]);
  });
});

describe('actionLabel', () => {
  it('names the attendance leg', () => {
    expect(actionLabel('sign_in')).toBe('Drop-off');
    expect(actionLabel('sign_out')).toBe('Pickup');
    expect(actionLabel(undefined)).toBeNull();
  });
});
