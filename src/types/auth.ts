export type UserRole =
  | 'manager'
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
  manager: 'Hall Manager',
  assistant_hall_manager: 'Assistant Hall Manager & Receptionist',
  cashier_1: 'Cashier 1 (Payments)',
  cashier_2: 'Cashier 2 (Event Allocation)',
  controller: 'Controller',
  store_keeper: 'Overall Storekeeper',
  purchaser: 'Purchaser',
  accountant: 'Accountant',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  manager: 'Oversees hall operations, bookings, and service delivery.',
  assistant_hall_manager: 'Handles reception and daily booking coordination.',
  cashier_1: 'Manages customer payments and receipts.',
  cashier_2: 'Supports event allocation and payment processing.',
  controller: 'Authorizes controls and final financial approvals.',
  store_keeper: 'Maintains stock records and store accountability.',
  purchaser: 'Handles purchasing and supplier coordination.',
  accountant: 'Manages accounting records, reconciliation, and reporting.',
};

export const PASSWORD_RESET_AUTHORITIES: UserRole[] = ['controller', 'manager'];
export const ROLE_CHANGE_AUTHORITIES: UserRole[] = ['controller', 'manager'];

export const STAFF_USERS: User[] = [
  {
    id: '1',
    email: 'diana.mushi@kuringe.co.tz',
    name: 'Diana Mushi',
    role: 'manager',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'gladness.tesha@kuringe.co.tz',
    name: 'Gladness Donat Tesha',
    role: 'assistant_hall_manager',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'rose.mkonyi@kuringe.co.tz',
    name: 'Rose G. Mkonyi',
    role: 'cashier_1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'anna.barnaba@kuringe.co.tz',
    name: 'Anna Barnaba',
    role: 'cashier_2',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'augustino.kilindo@kuringe.co.tz',
    name: 'Augustino George Kilindo',
    role: 'controller',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    email: 'regina.evarist@kuringe.co.tz',
    name: 'Regina Evarist',
    role: 'store_keeper',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    email: 'veronika.kileo@kuringe.co.tz',
    name: 'Veronika Visent Kileo',
    role: 'purchaser',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    email: 'jackline.faustine@kuringe.co.tz',
    name: 'Jackline Faustine',
    role: 'accountant',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    email: 'david.kinoka@kuringe.co.tz',
    name: 'David Kinoka',
    role: 'accountant',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];
