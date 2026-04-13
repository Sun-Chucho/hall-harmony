import { describe, expect, it } from 'vitest';
import {
  canCashRequestAdvance,
  getCashRequestActionError,
  normalizeCashRequest,
} from '@/lib/requestWorkflows';

function buildCashRequest(raw: Record<string, unknown>) {
  return normalizeCashRequest({
    id: 'cash-1',
    submittedAt: '2026-04-13T09:00:00.000Z',
    submittedBy: 'user-1',
    submittedByRole: 'assistant_hall_manager',
    fields: {
      full_name: 'Jane Doe',
      total_requested: '150000',
    },
    ...raw,
  });
}

describe('cash request workflow helpers', () => {
  it('normalizes legacy manager status into halls manager queue', () => {
    const request = buildCashRequest({
      currentStatus: 'pending_manager',
      currentAssigneeRole: undefined,
    });

    expect(request.currentStatus).toBe('pending_halls_manager');
    expect(request.currentAssigneeRole).toBe('manager');
    expect(canCashRequestAdvance(request, 'manager')).toBe(true);
  });

  it('blocks approval actions for the wrong role', () => {
    const request = buildCashRequest({
      currentStatus: 'pending_halls_manager',
      currentAssigneeRole: 'manager',
    });

    expect(canCashRequestAdvance(request, 'manager')).toBe(true);
    expect(canCashRequestAdvance(request, 'accountant')).toBe(false);
    expect(getCashRequestActionError(request, 'accountant')).toContain('Halls Manager');
  });

  it('prevents further actions once the request is completed', () => {
    const request = buildCashRequest({
      currentStatus: 'completed',
      currentAssigneeRole: undefined,
      completedAt: '2026-04-13T10:00:00.000Z',
    });

    expect(canCashRequestAdvance(request, 'cashier_1')).toBe(false);
    expect(getCashRequestActionError(request, 'cashier_1')).toBe('This cash request is already completed.');
  });
});
