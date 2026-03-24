export type UserRole =
  | 'manager'
  | 'managing_director'
  | 'assistant_hall_manager'
  | 'cashier_1'
  | 'cashier_2'
  | 'controller'
  | 'store_keeper'
  | 'purchaser'
  | 'accountant';

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
  manager: 'Managing Director',
  managing_director: 'Managing Director',
  assistant_hall_manager: 'Assistant Hall Manager & Receptionist',
  cashier_1: 'Cashier (Payments & Distribution)',
  cashier_2: 'Cashier 2 (Legacy)',
  controller: 'Controller (Legacy)',
  store_keeper: 'Overall Storekeeper',
  purchaser: 'Purchaser',
  accountant: 'Accountant (Control Authority)',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  manager: 'Oversees hall operations, bookings, and service delivery.',
  managing_director: 'Reviews executive fund distribution and high-level business performance.',
  assistant_hall_manager: 'Handles reception and daily booking coordination.',
  cashier_1: 'Manages customer payments, allocations, cash movement, and distributions.',
  cashier_2: 'Legacy cashier role retained only for historical compatibility.',
  controller: 'Legacy controller role retained only for historical compatibility.',
  store_keeper: 'Maintains stock records and store accountability.',
  purchaser: 'Handles purchasing and supplier coordination.',
  accountant: 'Manages accounting records, reconciliation, reporting, and approval controls.',
};

export const PASSWORD_RESET_AUTHORITIES: UserRole[] = ['accountant', 'manager'];
export const ROLE_CHANGE_AUTHORITIES: UserRole[] = ['accountant', 'manager'];
