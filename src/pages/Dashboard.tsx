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
          <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayBookings}</div>
          <p className="text-xs text-muted-foreground">events scheduled today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          <p className="text-xs text-muted-foreground">items need your attention</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.monthlyRevenue)}</div>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCustomers}</div>
          <p className="text-xs text-muted-foreground">with ongoing bookings</p>
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
          <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayBookings}</div>
          <p className="text-xs text-muted-foreground">events scheduled</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingFollowups}</div>
          <p className="text-xs text-muted-foreground">customers to contact</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quotations Pending</CardTitle>
          <Building className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.quotationsPending}</div>
          <p className="text-xs text-muted-foreground">awaiting response</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Inquiries</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newInquiries}</div>
          <p className="text-xs text-muted-foreground">from web portal</p>
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
          <CardTitle className="text-sm font-medium">Today's Payments</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayPayments}</div>
          <p className="text-xs text-muted-foreground">payments recorded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingReceipts}</div>
          <p className="text-xs text-muted-foreground">to be printed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.totalReceived)}</div>
          <p className="text-xs text-muted-foreground">today's collections</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.awaitingApproval}</div>
          <p className="text-xs text-muted-foreground">payments pending</p>
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
          <CardTitle className="text-sm font-medium">Pending Movements</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingMovements}</div>
          <p className="text-xs text-muted-foreground">awaiting approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Deposits</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayDeposits}</div>
          <p className="text-xs text-muted-foreground">bank deposits made</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Till Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.tillBalance)}</div>
          <p className="text-xs text-muted-foreground">current cash in till</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Safe Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTZS(stats.safeBalance)}</div>
          <p className="text-xs text-muted-foreground">current cash in safe</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

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
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            {ROLE_LABELS[user.role]} • Here's what's happening today
          </p>
        </div>

        {/* Role-specific Stats */}
        {renderDashboardContent()}

        {/* Recent Activity Placeholder */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Booking data will appear here once you start creating bookings.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quick action buttons will be added in the next phase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
