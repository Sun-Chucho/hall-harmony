import { CashRequestWorkflow, DocumentOutput, PurchaseRequestWorkflow } from '@/lib/requestWorkflows';
import { BookingRecord } from '@/types/booking';
import { User, UserRole } from '@/types/auth';

function supportsDeskScopedVisibility(role?: UserRole) {
  return role === 'assistant_hall_manager';
}

function matchesDeskScopedOwner(
  ownerId: string | undefined,
  ownerRole: UserRole | undefined,
  user?: User | null,
) {
  if (!user) return false;
  if (ownerId === user.id) return true;
  return supportsDeskScopedVisibility(user.role) && ownerRole === user.role;
}

export function canAccessDeskScopedBooking(booking: BookingRecord, user?: User | null) {
  return matchesDeskScopedOwner(booking.createdByUserId, booking.createdByRole, user);
}

export function canAccessDeskScopedWorkflowEntry(
  entry: Pick<CashRequestWorkflow, 'submittedBy' | 'submittedByRole'>
    | Pick<PurchaseRequestWorkflow, 'submittedBy' | 'submittedByRole'>
    | Pick<DocumentOutput, 'submittedBy' | 'submittedByRole'>,
  user?: User | null,
) {
  return matchesDeskScopedOwner(entry.submittedBy, entry.submittedByRole, user);
}

export function isManagerCashRequestQueueEntry(entry: CashRequestWorkflow) {
  if (entry.currentStatus === 'pending_halls_manager') return true;
  return entry.currentAssigneeRole === 'manager'
    && entry.currentStatus !== 'pending_cashier'
    && entry.currentStatus !== 'completed'
    && entry.currentStatus !== 'declined';
}
