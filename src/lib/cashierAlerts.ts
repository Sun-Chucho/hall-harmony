import type { BookingRecord } from '@/types/booking';
import type { BookingPaymentStatus } from '@/types/payment';

export interface CashierAlert {
  id: string;
  bookingId: string;
  type: 'deposit' | 'due';
  title: string;
  body: string;
}

interface BookingFinancialsLike {
  totalPaid: number;
  balance: number;
  quotedAmount: number;
  status: BookingPaymentStatus;
}

const REQUIRED_DEPOSIT_RATIO = 0.5;

export function getCashierAlerts(
  bookings: BookingRecord[],
  getBookingFinancials: (bookingId: string) => BookingFinancialsLike,
  todayIso = new Date().toISOString().slice(0, 10),
): CashierAlert[] {
  return bookings
    .filter((booking) => !['cancelled', 'rejected', 'completed'].includes(booking.bookingStatus))
    .flatMap((booking) => {
      const financials = getBookingFinancials(booking.id);
      const requiredDeposit = Math.round(financials.quotedAmount * REQUIRED_DEPOSIT_RATIO);
      const alerts: CashierAlert[] = [];

      if (financials.quotedAmount > 0 && financials.totalPaid < requiredDeposit) {
        alerts.push({
          id: `${booking.id}:deposit`,
          bookingId: booking.id,
          type: 'deposit',
          title: '50% deposit missing',
          body: `${booking.eventName} for ${booking.customerName} has only TZS ${financials.totalPaid.toLocaleString()} paid out of the required 50% deposit of TZS ${requiredDeposit.toLocaleString()}.`,
        });
      }

      if (booking.date <= todayIso && financials.status !== 'fully_paid' && financials.balance > 0) {
        alerts.push({
          id: `${booking.id}:due`,
          bookingId: booking.id,
          type: 'due',
          title: 'Event date reached with balance unpaid',
          body: `${booking.eventName} for ${booking.customerName} is on ${booking.date} and still has TZS ${financials.balance.toLocaleString()} unpaid.`,
        });
      }

      return alerts;
    })
    .sort((a, b) => a.bookingId.localeCompare(b.bookingId));
}
