export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type EventDetailStatus =
  | 'draft'
  | 'pending_assistant'
  | 'approved_assistant'
  | 'pending_controller'
  | 'approved_controller'
  | 'rejected';

export interface BookingRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  eventName: string;
  eventType: string;
  hall: string;
  date: string;
  startTime: string;
  endTime: string;
  expectedGuests: number;
  quotedAmount: number;
  notes: string;
  createdAt: string;
  createdByUserId: string;
  bookingStatus: BookingStatus;
  eventDetailStatus: EventDetailStatus;
  bookingApprovalId?: string;
  eventApprovalId?: string;
  eventFinalApprovalId?: string;
}

export interface CreateBookingInput {
  customerName: string;
  customerPhone: string;
  eventName: string;
  eventType: string;
  hall: string;
  date: string;
  startTime: string;
  endTime: string;
  expectedGuests: number;
  quotedAmount: number;
  notes?: string;
}
