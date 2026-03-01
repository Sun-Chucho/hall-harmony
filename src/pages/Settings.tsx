import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, UserRole } from '@/types/auth';
import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';

const STAFF_ROLES: UserRole[] = [
  'manager',
  'assistant_hall_manager',
  'cashier_1',
  'cashier_2',
  'controller',
  'store_keeper',
  'purchaser',
  'accountant',
  'managing_director',
];

export default function Settings() {
  const {
    user,
    staffUsers,
    changePassword,
    createStaffUser,
    updateStaffRole,
    updateStaffActive,
    removeStaffUser,
  } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [busyUserId, setBusyUserId] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'assistant_hall_manager' as UserRole,
    password: '',
  });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({});

  const canManageUsers = user?.role === 'manager' || user?.role === 'controller';

  const visibleUsers = useMemo(
    () => [...staffUsers].sort((a, b) => a.name.localeCompare(b.name)),
    [staffUsers],
  );

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please confirm the same new password.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingPassword(true);
    const result = await changePassword(user.id, currentPassword, newPassword);
    toast({
      title: result.ok ? 'Password updated' : 'Update failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });

    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsSavingPassword(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;

    setIsCreatingUser(true);
    const result = await createStaffUser(createForm);
    toast({
      title: result.ok ? 'User added' : 'User creation failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    if (result.ok) {
      setCreateForm({
        name: '',
        email: '',
        role: 'assistant_hall_manager',
        password: '',
      });
    }
    setIsCreatingUser(false);
  };

  const handleRoleUpdate = async (staffId: string) => {
    const nextRole = roleDrafts[staffId];
    if (!nextRole) return;
    setBusyUserId(staffId);
    const result = await updateStaffRole(staffId, nextRole);
    toast({
      title: result.ok ? 'Role updated' : 'Update failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    setBusyUserId('');
  };

  const handleToggleActive = async (staffId: string, isActive: boolean) => {
    setBusyUserId(staffId);
    const result = await updateStaffActive(staffId, !isActive);
    toast({
      title: result.ok ? 'User updated' : 'Update failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    setBusyUserId('');
  };

  const handleRemoveUser = async (staffId: string) => {
    setBusyUserId(staffId);
    const result = await removeStaffUser(staffId);
    toast({
      title: result.ok ? 'User removed' : 'Remove failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });
    setBusyUserId('');
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mx-auto grid max-w-5xl gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Account Security
            </CardTitle>
            <CardDescription>
              Change your own password after you sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitPassword} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto" disabled={isSavingPassword}>
                {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>

        {canManageUsers ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Staff User Management
              </CardTitle>
              <CardDescription>
                Add users, change roles, activate/deactivate accounts, and remove users from the staff directory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleCreateUser} className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="new-name">Full name</Label>
                  <Input
                    id="new-name"
                    value={createForm.name}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-role">Role</Label>
                  <select
                    id="new-role"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={createForm.role}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-password-user">Temporary password</Label>
                  <Input
                    id="new-password-user"
                    type="password"
                    value={createForm.password}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={isCreatingUser}>
                    {isCreatingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Staff User
                  </Button>
                </div>
              </form>

              <div className="space-y-3">
                {visibleUsers.map((entry) => {
                  const draftRole = roleDrafts[entry.id] ?? entry.role;
                  const isBusy = busyUserId === entry.id;
                  return (
                    <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{entry.name}</p>
                          <p className="text-sm text-slate-600">{entry.email}</p>
                        </div>
                        <Badge className={entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                          {entry.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={draftRole}
                          onChange={(event) => setRoleDrafts((prev) => ({ ...prev, [entry.id]: event.target.value as UserRole }))}
                          disabled={isBusy}
                        >
                          {STAFF_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleRoleUpdate(entry.id)}
                          disabled={isBusy || draftRole === entry.role}
                        >
                          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Role
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleToggleActive(entry.id, entry.isActive)}
                          disabled={isBusy}
                        >
                          {entry.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleRemoveUser(entry.id)}
                          disabled={isBusy || user?.id === entry.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
