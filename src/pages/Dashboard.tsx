import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_LABELS } from '@/types/auth';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useState } from 'react';

// Type definitions for role-specific stats
interface ManagerStats {
  todayBookings: number;
  pendingApprovals: number;
  monthlyRevenue: number;
  activeCustomers: number;
}

interface AssistantStats {
  todayBookings: number;
  pendingFollowups: number;
  quotationsPending: number;
  newInquiries: number;
}

interface Cashier1Stats {
  todayPayments: number;
  pendingReceipts: number;
  totalReceived: number;
  awaitingApproval: number;
}

interface Cashier2Stats {
  pendingMovements: number;
  todayDeposits: number;
  tillBalance: number;
  safeBalance: number;
}

// Mock data for dashboard stats
const MANAGER_STATS: ManagerStats = {
  todayBookings: 3,
  pendingApprovals: 5,
  monthlyRevenue: 15750000,
  activeCustomers: 47,
};

const ASSISTANT_STATS: AssistantStats = {
  todayBookings: 3,
  pendingFollowups: 8,
  quotationsPending: 4,
  newInquiries: 6,
};

const CASHIER1_STATS: Cashier1Stats = {
  todayPayments: 4,
  pendingReceipts: 2,
  totalReceived: 3500000,
  awaitingApproval: 3,
};

const CASHIER2_STATS: Cashier2Stats = {
  pendingMovements: 2,
  todayDeposits: 1,
  tillBalance: 850000,
  safeBalance: 4200000,
};

const recentBookings = [
  {
    event: 'Executive Gala',
    hall: 'Kilimanjaro Hall & Gardens',
    time: '09:00 AM, Feb 10',
    status: 'Confirmed',
  },
  {
    event: 'Investor Summit',
    hall: 'Witness Hall',
    time: 'Audio check 12:30 PM',
    status: 'In Production',
  },
  {
    event: 'Intimate Board Dinner',
    hall: 'Hall D',
    time: '06:00 PM, Feb 12',
    status: 'Tentative',
  },
];

const quickActions = [
  {
    label: 'Approve deposit',
    description: 'Release the deposit held for today’s bookings.',
    action: 'Deposit approved',
  },
  {
    label: 'Assign crew',
    description: 'Lock down the hospitality crew for active events.',
    action: 'Crew assigned',
  },
  {
    label: 'Send confirmation',
    description: 'Email the latest contract to the client.',
    action: 'Confirmation sent',
  },
];

function formatTZS(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ManagerDashboard({ stats }: { stats: ManagerStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Today's Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayBookings}</div>
          <p className="text-xs text-slate-600">events scheduled today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Pending Approvals</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          <p className="text-xs text-slate-600">items need your attention</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Monthly Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.monthlyRevenue)}</div>
          <p className="text-xs text-slate-600">+12% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCustomers}</div>
          <p className="text-xs text-slate-600">with ongoing bookings</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AssistantDashboard({ stats }: { stats: AssistantStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Today's Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayBookings}</div>
          <p className="text-xs text-slate-600">events scheduled</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Pending Follow-ups</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingFollowups}</div>
          <p className="text-xs text-slate-600">customers to contact</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Quotations Pending</CardTitle>
          <Building className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.quotationsPending}</div>
          <p className="text-xs text-slate-600">awaiting response</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">New Inquiries</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newInquiries}</div>
          <p className="text-xs text-slate-600">from web portal</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Cashier1Dashboard({ stats }: { stats: Cashier1Stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Today's Payments</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayPayments}</div>
          <p className="text-xs text-slate-600">payments recorded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Pending Receipts</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingReceipts}</div>
          <p className="text-xs text-slate-600">to be printed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Total Received</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.totalReceived)}</div>
          <p className="text-xs text-slate-600">today's collections</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Awaiting Approval</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.awaitingApproval}</div>
          <p className="text-xs text-slate-600">payments pending</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Cashier2Dashboard({ stats }: { stats: Cashier2Stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Pending Movements</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingMovements}</div>
          <p className="text-xs text-slate-600">awaiting approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Today's Deposits</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayDeposits}</div>
          <p className="text-xs text-slate-600">bank deposits made</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Till Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.tillBalance)}</div>
          <p className="text-xs text-slate-600">current cash in till</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">Safe Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.safeBalance)}</div>
          <p className="text-xs text-slate-600">current cash in safe</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [lastQuickAction, setLastQuickAction] = useState('No actions yet');

  if (!user) return null;

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'hall_manager':
        return <ManagerDashboard stats={MANAGER_STATS} />;
      case 'assistant_manager':
        return <AssistantDashboard stats={ASSISTANT_STATS} />;
      case 'cashier_1':
        return <Cashier1Dashboard stats={CASHIER1_STATS} />;
      case 'cashier_2':
        return <Cashier2Dashboard stats={CASHIER2_STATS} />;
      default:
        return <ManagerDashboard stats={MANAGER_STATS} />;
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 text-slate-900">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-slate-600">
            {ROLE_LABELS[user.role]} • Here's what's happening today
          </p>
        </div>

        {/* Role-specific Stats */}
        {renderDashboardContent()}

        {/* Recent Activity + Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Recent Bookings</CardTitle>
              <CardDescription className="text-slate-600">Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.event}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{booking.event}</p>
                    <p className="text-xs text-slate-600">{booking.hall}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{booking.time}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-kuringe-red">
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-600">Trigger frequent tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-600">{action.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastQuickAction(action.action)}
                    className="rounded-full border border-slate-300 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800"
                  >
                    Run
                  </button>
                </div>
              ))}
              <p className="text-xs text-slate-500">Last action: {lastQuickAction}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
