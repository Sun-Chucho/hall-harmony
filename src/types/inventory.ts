import type { UserRole } from './auth';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: number;
  reorderLevel: number;
  createdAt: string;
  createdByUserId: string;
}

export type InventoryMovementType =
  | 'stock_in'
  | 'stock_out'
  | 'allocation'
  | 'return'
  | 'damaged'
  | 'adjustment';

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reference: string;
  notes: string;
  eventBookingId?: string;
  performedByUserId: string;
  performedByRole?: UserRole;
  createdAt: string;
}

export interface DamagedItemRecord {
  id: string;
  itemId: string;
  quantity: number;
  reason: string;
  eventBookingId?: string;
  reportedByUserId: string;
  reportedAt: string;
}

export type EventAllocationStatus = 'allocated' | 'returned';

export interface EventItemAllocation {
  id: string;
  bookingId: string;
  itemId: string;
  quantity: number;
  status: EventAllocationStatus;
  notes: string;
  allocatedByUserId: string;
  allocatedAt: string;
  returnedByUserId?: string;
  returnedAt?: string;
}
