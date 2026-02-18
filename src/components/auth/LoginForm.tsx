import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_USERS, UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, LogIn, UserRound } from 'lucide-react';

const ROLE_ORDER: UserRole[] = [
  'manager',
  'assistant_hall_manager',
  'cashier_1',
  'cashier_2',
  'controller',
  'store_keeper',
  'purchaser',
  'accountant',
];

const SHORT_ROLE_LABELS: Record<UserRole, string> = {
  manager: 'Hall Manager',
  assistant_hall_manager: 'Assistant Hall Manager',
  cashier_1: 'Cashier 1',
  cashier_2: 'Cashier 2',
  controller: 'Controller',
  store_keeper: 'Storekeeper',
  purchaser: 'Purchaser',
  accountant: 'Accountant',
};

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('controller');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    () => sourceUsers.filter((user) => user.role === selectedRole),
    [selectedRole, sourceUsers],
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
    if (selectedRoleUsers.length > 0) {
      setSettingsUserId(selectedRoleUsers[0].id);
      return;
    }
    setSettingsUserId('');
  }, [selectedRoleUsers]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast({
        title: 'Selection required',
        description: 'Please select a staff member.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await login(selectedUserId, password);

    if (success) {
      toast({
        title: 'Login successful',
        description: 'Welcome to your workspace.',
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
    <div className="mx-auto w-full max-w-6xl rounded-[24px] border border-[#d8d9dd] bg-[#eceef2] shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
      <div className="grid min-h-[740px] grid-cols-1 lg:grid-cols-[1.02fr_1.5fr]">
        <aside className="flex flex-col rounded-t-[24px] bg-[#a80c10] p-9 text-white lg:rounded-l-[24px] lg:rounded-tr-none">
          <div>
            <h2 className="text-5xl font-bold tracking-tight">Staff Directory</h2>
            <p className="mt-4 max-w-sm text-2xl text-white/75">
              Select your operational area to access your dashboard.
            </p>
          </div>

          <div className="mt-12 flex-1 space-y-3">
            {ROLE_ORDER.map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-3xl font-semibold transition ${
                    active
                      ? 'bg-white text-[#a80c10] shadow-[0_10px_24px_rgba(0,0,0,0.14)]'
                      : 'bg-transparent text-white/95 hover:bg-white/10'
                  }`}
                >
                  <span>{SHORT_ROLE_LABELS[role]}</span>
                  {active ? <ArrowRight className="h-6 w-6" /> : null}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-8 inline-flex items-center gap-2 text-2xl text-white/90 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Public Page
          </button>
        </aside>

        <section className="rounded-b-[24px] bg-[#f3f4f6] p-8 text-slate-900 lg:rounded-b-none lg:rounded-r-[24px] lg:px-14 lg:py-16">
          <div className="mx-auto w-full max-w-2xl">
            <h3 className="text-5xl font-bold">{SHORT_ROLE_LABELS[selectedRole]}</h3>
            <p className="mt-3 text-3xl text-slate-500">{ROLE_DESCRIPTIONS[selectedRole]}</p>

            <form onSubmit={handleSignIn} className="mt-12 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="staff-user" className="text-3xl font-semibold text-slate-700">
                  Identify Yourself
                </Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger
                    id="staff-user"
                    className="h-16 rounded-2xl border-2 border-slate-200 bg-white text-xl"
                  >
                    <div className="flex items-center gap-2">
                      <UserRound className="h-5 w-5 text-slate-400" />
                      <SelectValue placeholder="Select a staff member" />
                    </div>
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

              <div className="space-y-3">
                <Label htmlFor="password" className="text-3xl font-semibold text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-16 rounded-2xl border-2 border-slate-200 bg-white text-xl"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-16 w-full rounded-2xl bg-[#cb8b8d] text-2xl font-semibold hover:bg-[#c27b7f]"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Login to Workspace
              </Button>
            </form>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Settings</p>
              <p className="mt-1 text-sm text-slate-600">Default password is 1234. You can change it here.</p>

              <form onSubmit={handlePasswordChange} className="mt-4 grid gap-3 sm:grid-cols-2">
                <Select value={settingsUserId} onValueChange={setSettingsUserId}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="h-11 rounded-xl border-slate-200"
                  required
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-11 rounded-xl border-slate-200"
                  required
                />
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="h-11 rounded-xl border-slate-200"
                    required
                  />
                  <Button type="submit" variant="outline" className="h-11 rounded-xl" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
