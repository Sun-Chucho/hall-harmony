import { describe, expect, it } from 'vitest';
import { sanitizeFirestoreData } from '@/lib/firestoreData';

class Marker {
  constructor(readonly value: string) {}
}

describe('sanitizeFirestoreData', () => {
  it('removes undefined fields from nested objects and arrays', () => {
    const marker = new Marker('keep');

    const result = sanitizeFirestoreData({
      name: 'Storekeeper',
      optional: undefined,
      nested: {
        approvedBy: 'accountant',
        comment: undefined,
      },
      stages: [
        undefined,
        {
          code: 'submitted',
          note: undefined,
        },
      ],
      marker,
    });

    expect(result).toEqual({
      name: 'Storekeeper',
      nested: {
        approvedBy: 'accountant',
      },
      stages: [
        {
          code: 'submitted',
        },
      ],
      marker,
    });
    expect('optional' in result).toBe(false);
    expect(result.marker).toBe(marker);
  });
});
