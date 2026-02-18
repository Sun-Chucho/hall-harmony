import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_USERS, UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2, LogIn, Settings2, UserRound } from 'lucide-react';

const ROLE_ORDER: UserRole[] = [
  'manager',
  'assistant_hall_manager',
  'cashier_1',
  'cashier_2',
  'controller',
  'purchaser',
  'store_keeper',
  'accountant',
];

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [settingsRole, setSettingsRole] = useState<UserRole>('manager');
  const [settingsUserId, setSettingsUserId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { login, changePassword, staffUsers, refreshStaffUsers } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const sourceUsers = staffUsers.length > 0 ? staffUsers : STAFF_USERS;

  const selectedRoleUsers = useMemo(
    () => (selectedRole ? sourceUsers.filter((user) => user.role === selectedRole) : []),
    [selectedRole, sourceUsers],
  );

  const settingsRoleUsers = useMemo(
    () => sourceUsers.filter((user) => user.role === settingsRole),
    [settingsRole, sourceUsers],
  );

  useEffect(() => {
    void refreshStaffUsers();
  }, [refreshStaffUsers]);

  useEffect(() => {
    if (selectedRoleUsers.length > 0) {
      setSelectedUserId(selectedRoleUsers[0].id);
      return;
    }
    setSelectedUserId('');
  }, [selectedRoleUsers]);

  useEffect(() => {
    if (settingsRoleUsers.length > 0) {
      setSettingsUserId(settingsRoleUsers[0].id);
      return;
    }
    setSettingsUserId('');
  }, [settingsRoleUsers]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !selectedUserId) {
      toast({
        title: 'Selection required',
        description: 'Please choose a role and a staff member first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await login(selectedUserId, password);

    if (success) {
      toast({
        title: 'Login successful',
        description: 'Welcome to Kuringe Halls Management System.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Login failed',
        description: 'Incorrect password or inactive user account.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settingsUserId) {
      toast({
        title: 'Selection required',
        description: 'Please select a staff member.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please confirm the same new password.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(settingsUserId, currentPassword, newPassword);

    toast({
      title: result.ok ? 'Password updated' : 'Password update failed',
      description: result.message,
      variant: result.ok ? 'default' : 'destructive',
    });

    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <Card className="border-2">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Staff Login</CardTitle>
          <CardDescription>
            Default password for all users is <span className="font-semibold text-foreground">1234</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRole ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select your role to continue.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ROLE_ORDER.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    className="h-auto items-start justify-start px-3 py-3 text-left"
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{ROLE_LABELS[role]}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected role</p>
                  <p className="font-semibold">{ROLE_LABELS[selectedRole]}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(null);
                    setPassword('');
                  }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-user">Staff member</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="staff-user">
                    <SelectValue placeholder="Select a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {!user.isActive ? '(Inactive)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Password Settings
          </CardTitle>
          <CardDescription>Change password for a specific user account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-role">Role</Label>
                <Select value={settingsRole} onValueChange={(value: UserRole) => setSettingsRole(value)}>
                  <SelectTrigger id="settings-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_ORDER.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-user">User</Label>
                <Select value={settingsUserId} onValueChange={setSettingsUserId}>
                  <SelectTrigger id="settings-user">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {settingsRoleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {!user.isActive ? '(Inactive)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isChangingPassword}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                />
              </div>
            </div>

            <Button type="submit" variant="outline" className="w-full" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <UserRound className="mr-1 h-4 w-4" />
                </>
              )}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
