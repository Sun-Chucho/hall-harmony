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

  const { login, staffUsers, refreshStaffUsers } = useAuth();
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

  return (
    <div className="mx-auto w-full max-w-6xl rounded-[20px] border border-[#d8d9dd] bg-[#eceef2] shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[0.95fr_1.4fr]">
        <aside className="flex flex-col rounded-t-[20px] bg-[#a80c10] p-6 text-white lg:rounded-l-[20px] lg:rounded-tr-none lg:p-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Staff Directory</h2>
            <p className="mt-3 max-w-sm text-base text-white/75 lg:text-lg">
              Select your operational area to access your dashboard.
            </p>
          </div>

          <div className="mt-8 flex-1 space-y-2.5">
            {ROLE_ORDER.map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-semibold transition lg:text-xl ${
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
            className="mt-6 inline-flex items-center gap-2 text-base text-white/90 hover:text-white lg:text-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Public Page
          </button>
        </aside>

        <section className="rounded-b-[20px] bg-[#f3f4f6] p-6 text-slate-900 lg:rounded-b-none lg:rounded-r-[20px] lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-2xl">
            <h3 className="text-3xl font-bold lg:text-4xl">{SHORT_ROLE_LABELS[selectedRole]}</h3>
            <p className="mt-2 text-lg text-slate-500 lg:text-xl">{ROLE_DESCRIPTIONS[selectedRole]}</p>

            <form onSubmit={handleSignIn} className="mt-8 space-y-4">
              <div className="space-y-3">
                <Label htmlFor="staff-user" className="text-lg font-semibold text-slate-700">
                  Identify Yourself
                </Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger
                    id="staff-user"
                    className="h-12 rounded-xl border-2 border-slate-200 bg-white text-base"
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
                <Label htmlFor="password" className="text-lg font-semibold text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-12 rounded-xl border-2 border-slate-200 bg-white text-base"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-[#cb8b8d] text-base font-semibold hover:bg-[#c27b7f]"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Login to Workspace
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
