import { UserRole } from '@/types/auth';

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

export type PastBookingApprovalStatus =
  | 'pending_cashier_1'
  | 'approved_cashier_1'
  | 'rejected_cashier_1';

export type BookingCarType = 'none' | 'range_rover' | 'lexus' | 'bmw';

export interface BookingRecord {
  id: string;
  clientActionId?: string;
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
  carType?: BookingCarType;
  carPrice?: number;
  carBookedBy?: string;
  carLocation?: string;
  notes: string;
  createdAt: string;
  createdByUserId: string;
  createdByRole?: UserRole;
  bookingStatus: BookingStatus;
  eventDetailStatus: EventDetailStatus;
  assignedToRole?: 'cashier_1';
  sentToCashier1At?: string;
  bookingApprovalId?: string;
  eventApprovalId?: string;
  eventFinalApprovalId?: string;
  revision?: number;
  lastEditedAt?: string;
  lastEditedByUserId?: string;
  lastEditedByRole?: string;
  pastBookingSubmission?: boolean;
  pastBookingApprovalStatus?: PastBookingApprovalStatus;
  pastReviewedAt?: string;
  pastReviewedByUserId?: string;
  pastReviewedByRole?: string;
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
  carType?: BookingCarType;
  carPrice?: number;
  carBookedBy?: string;
  carLocation?: string;
  notes?: string;
}
