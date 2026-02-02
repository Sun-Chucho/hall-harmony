import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AuditEntry = {
  timestamp: string;
  user: string;
  action: string;
  detail: string;
};

type UserRecord = {
  id: number;
  name: string;
  role: string;
  status: 'enabled' | 'disabled';
};

const roleOptions = [
  'Hall Manager',
  'Assistant Manager',
  'Cashier 1',
  'Cashier 2',
  'Portal Admin',
];

export default function AdminConsole() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [newUser, setNewUser] = useState<{ name: string; role: string }>({
    name: '',
    role: 'Hall Manager',
  });
  const [nextId, setNextId] = useState(1);

  const addAuditEntry = (entry: Omit<AuditEntry, 'timestamp'>) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAuditLog((prev) => [{ ...entry, timestamp }, ...prev]);
  };

  const adminActions = useMemo(() => {
    return [
      {
        label: 'Total users',
        value: `${users.length} active`,
        detail: `${users.filter((u) => u.status === 'disabled').length} disabled`,
      },
      {
        label: 'Audit entries',
        value: `${auditLog.length} records`,
        detail: auditLog.length ? 'Updated in real time' : 'Waiting for events',
      },
      {
        label: 'System alerts',
        value: `${auditLog.length ? 'Enabled' : 'Standby'}`,
        detail: 'Connect to auditing stream to fill details',
      },
    ];
  }, [users.length, auditLog]);

  const toggleUserStatus = (userId: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === 'enabled' ? 'disabled' : 'enabled' }
          : user,
      ),
    );
    const target = users.find((user) => user.id === userId);
    if (target) {
      addAuditEntry({
        user: target.name,
        action: `Set ${target.role}`,
        detail: `${target.name} ${target.status === 'enabled' ? 'disabled' : 'enabled'}`,
      });
    }
  };

  const handleAddUser = () => {
    if (!newUser.name.trim()) return;
    const record: UserRecord = {
      id: nextId,
      name: newUser.name.trim(),
      role: newUser.role,
      status: 'enabled',
    };
    setUsers((prev) => [record, ...prev]);
    addAuditEntry({
      user: record.name,
      action: 'Added user',
      detail: record.role,
    });
    setNextId((id) => id + 1);
    setNewUser({ name: '', role: newUser.role });
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
              {auditLog.length === 0 ? (
                <p className="text-sm text-slate-600">Audit data will appear once events stream in.</p>
              ) : (
                auditLog.map((entry) => (
                  <div
                    key={`${entry.timestamp}-${entry.user}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                      <span>{entry.timestamp}</span>
                      <span>{entry.user}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{entry.action}</p>
                    <p className="text-sm text-slate-600">{entry.detail}</p>
                  </div>
                ))
              )}
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
                    <span className="text-sm text-slate-600">Ready to trigger</span>
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
            <div className="grid gap-3">
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Add user</p>
                  <p className="text-sm text-slate-600">Import or provision new accounts with roles and permissions.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={newUser.name}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <select
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={newUser.role}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" onClick={handleAddUser}>
                    Add
                  </Button>
                </div>
              </div>

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
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No users yet. Add a user to start enabling or disabling accounts.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
