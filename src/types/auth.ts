export type UserRole =
  | 'hall_manager'
  | 'assistant_manager'
  | 'cashier_1'
  | 'cashier_2'
  | 'rentals_controller'
  | 'portal_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  hall_manager: 'Hall Manager',
  assistant_manager: 'Assistant Hall Manager',
  cashier_1: 'Cashier 1 (Payments)',
  cashier_2: 'Cashier 2 (Cash Handling)',
  rentals_controller: 'Rentals Controller',
  portal_admin: 'Portal Admin',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  hall_manager: 'Full access to all features, approvals, and system configuration',
  assistant_manager: 'Booking management, customer follow-ups, quotations and invoices',
  cashier_1: 'Payment entry, receipt generation, submit payments for approval',
  cashier_2: 'Cash movement records, deposit slips, end-of-day reports',
  rentals_controller: 'Rental & asset tracking with availability checks',
  portal_admin: 'Web portal controls, self-service booking oversight',
};

// Demo users for testing (localStorage-based auth)
export const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'manager@kuringe.co.tz',
    name: 'John Mwamba',
    role: 'hall_manager',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'assistant@kuringe.co.tz',
    name: 'Grace Kimaro',
    role: 'assistant_manager',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'cashier1@kuringe.co.tz',
    name: 'Peter Makori',
    role: 'cashier_1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'cashier2@kuringe.co.tz',
    name: 'Amina Hassan',
    role: 'cashier_2',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'rentals@kuringe.co.tz',
    name: 'Kevin Mwhojo',
    role: 'rentals_controller',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    email: 'portal@kuringe.co.tz',
    name: 'Sylvia Chacha',
    role: 'portal_admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];
