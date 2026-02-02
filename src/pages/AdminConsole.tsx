import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const auditLog = [
  { timestamp: '10:15 AM', user: 'Grace Kimaro', action: 'Enabled rental slot', detail: 'Kilimanjaro Hall – Feb 20' },
  { timestamp: '09:58 AM', user: 'Cashier 2', action: 'Approved deposit', detail: 'TSh 1,200,000 – Invoice #9342' },
  { timestamp: '09:30 AM', user: 'Assistant Manager', action: 'Signed design brief', detail: 'Witness Hall gala' },
  { timestamp: '09:12 AM', user: 'System', action: 'Imported users', detail: '25 new guest profiles' },
];

const adminActions = [
  { label: 'Total users', value: '128 active', detail: '2 pending approvals' },
  { label: 'Audit warnings', value: '3 alerts', detail: 'Review flagged invoices' },
  { label: 'Recent logins', value: '54 sessions', detail: '12 from regional team' },
];

const initialUsers = [
  { id: 1, name: 'Grace Kimaro', role: 'Assistant Hall Manager', status: 'enabled' },
  { id: 2, name: 'Samuel Rweza', role: 'Cashier 1', status: 'enabled' },
  { id: 3, name: 'Patricia Chacha', role: 'Cashier 2', status: 'disabled' },
  { id: 4, name: 'Portal Admin', role: 'Web Portal', status: 'enabled' },
];

export default function AdminConsole() {
  const [users, setUsers] = useState(initialUsers);

  const toggleUserStatus = (userId: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === 'enabled' ? 'disabled' : 'enabled' }
          : user,
      ),
    );
  };

  return (
    <DashboardLayout title="Admin Console">
      <div className="space-y-8 text-slate-900">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Oversight</p>
          <h1 className="text-3xl font-bold">Audit & user governance</h1>
          <p className="text-sm text-slate-600">
            Review every booking, financial action, and user access level from a single control panel.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {adminActions.map((action) => (
            <Card key={action.label} className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-2 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{action.label}</p>
                <p className="text-2xl font-bold text-slate-900">{action.value}</p>
                <p className="text-sm text-slate-600">{action.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Audit log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLog.map((entry) => (
                <div key={`${entry.timestamp}-${entry.user}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                    <span>{entry.timestamp}</span>
                    <span>{entry.user}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{entry.action}</p>
                  <p className="text-sm text-slate-600">{entry.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Action vault</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Every audit and user action routes through the admin console—enable/disable accounts, reset access, and follow
                up on compliance tickets in one place.
              </p>
              <div className="space-y-3">
                {['Review bookings', 'Track payments', 'Export audit reports'].map((line) => (
                  <div key={line} className="flex items-center gap-3">
                    <Badge className="bg-slate-100 text-slate-700">{line}</Badge>
                    <span className="text-sm text-slate-600">Completed in the last hour</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">User review & access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.role}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${
                            user.status === 'enabled'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-700"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.status === 'enabled' ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
