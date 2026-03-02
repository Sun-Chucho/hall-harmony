export type PaymentMethod = 'cash' | 'pos' | 'bank_transfer' | 'mobile_money';

export type BookingPaymentStatus =
  | 'pending'
  | 'deposit_paid'
  | 'partially_paid'
  | 'fully_paid';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  receivedAt: string;
  receivedByUserId: string;
  receiptNumber: string;
  notes: string;
}

export interface CreatePaymentInput {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  receivedAt?: string;
}
