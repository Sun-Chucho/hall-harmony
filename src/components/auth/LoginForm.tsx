import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, LogIn, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ROLE_ORDER: UserRole[] = [
  'manager',
  'managing_director',
  'assistant_hall_manager',
  'cashier_1',
  'cashier_2',
  'controller',
  'store_keeper',
  'purchaser',
  'accountant',
];

const SHORT_ROLE_LABELS: Record<UserRole, { en: string; sw: string }> = {
  manager: { en: 'Hall Manager', sw: 'Meneja wa Ukumbi' },
  managing_director: { en: 'Managing Director', sw: 'Mkurugenzi Mkuu' },
  assistant_hall_manager: { en: 'Assistant Hall Manager & Receptionist', sw: 'Msaidizi wa Meneja wa Ukumbi na Mapokezi' },
  cashier_1: { en: 'Cashier 1', sw: 'Keshia 1' },
  cashier_2: { en: 'Cashier 2', sw: 'Keshia 2' },
  controller: { en: 'Controller', sw: 'Mkaguzi Mkuu' },
  store_keeper: { en: 'Storekeeper', sw: 'Msimamizi wa Ghala' },
  purchaser: { en: 'Purchaser', sw: 'Mnunua Bidhaa' },
  accountant: { en: 'Accountant', sw: 'Mhasibu' },
};

const ROLE_DESCRIPTIONS: Record<UserRole, { en: string; sw: string }> = {
  manager: { en: 'Oversees hall operations, bookings, and service delivery.', sw: 'Anasimamia uendeshaji wa ukumbi, bookings, na utoaji huduma.' },
  managing_director: { en: 'Reviews executive fund distribution and business performance.', sw: 'Anapitia mgawanyo wa fedha za juu na utendaji wa biashara.' },
  assistant_hall_manager: { en: 'Handles reception and daily booking coordination.', sw: 'Anashughulikia mapokezi na uratibu wa bookings za kila siku.' },
  cashier_1: { en: 'Manages customer payments and receipts.', sw: 'Anasimamia malipo ya wateja na stakabadhi.' },
  cashier_2: { en: 'Supports event allocation and payment processing.', sw: 'Anasaidia ugawaji wa fedha za matukio na uchakataji wa malipo.' },
  controller: { en: 'Authorizes controls and final approvals.', sw: 'Anatoa idhini za udhibiti na maamuzi ya mwisho.' },
  store_keeper: { en: 'Maintains stock records and store accountability.', sw: 'Anatunza kumbukumbu za stock na uwajibikaji wa ghala.' },
  purchaser: { en: 'Handles purchasing and supplier coordination.', sw: 'Anashughulikia ununuzi na uratibu wa wasambazaji.' },
  accountant: { en: 'Manages accounting records, reconciliation, and reporting.', sw: 'Anasimamia hesabu, maridhiano ya fedha, na taarifa.' },
};

function getDashboardRoute(role: UserRole) {
  if (role === 'cashier_1') return '/bookings';
  if (role === 'cashier_2') return '/cash-movement';
  return role === 'managing_director' ? '/managing-director-dashboard' : '/dashboard';
}

export function LoginForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithResult, staffUsers, refreshStaffUsers } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const isSw = language === 'sw';

  const selectedRoleUsers = useMemo(
    () => staffUsers.filter((user) => user.role === selectedRole),
    [selectedRole, staffUsers],
  );

  useEffect(() => {
    void refreshStaffUsers();
  }, [refreshStaffUsers]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast({
        title: isSw ? 'Chaguo linahitajika' : 'Selection required',
        description: isSw ? 'Tafadhali chagua mtumiaji wa staff.' : 'Please select a staff member.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await loginWithResult(selectedUserId, password);

    if (result.ok) {
      const selectedUser = staffUsers.find((item) => item.id === selectedUserId);
      toast({
        title: isSw ? 'Umeingia kikamilifu' : 'Login successful',
        description: isSw ? 'Karibu kwenye mfumo wako wa kazi.' : 'Welcome to your workspace.',
      });
      navigate(getDashboardRoute(selectedUser?.role ?? selectedRole));
    } else {
      toast({
        title: isSw ? 'Kuingia kumeshindikana' : 'Login failed',
        description: result.message ?? (isSw ? 'Nenosiri si sahihi au akaunti imezimwa.' : 'Incorrect password or inactive user account.'),
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl rounded-[20px] border border-[#d8d9dd] bg-[#eceef2] shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
      <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[0.95fr_1.4fr]">
        <aside className="flex flex-col rounded-t-[20px] bg-[#a80c10] p-6 text-white lg:rounded-l-[20px] lg:rounded-tr-none lg:p-8">
          <div className="flex items-center justify-end">
            <div className="inline-flex overflow-hidden rounded-full border border-white/30">
              <button
                type="button"
                onClick={() => setLanguage('sw')}
                className={`px-3 py-1 text-xs font-semibold ${isSw ? 'bg-white text-[#a80c10]' : 'bg-transparent text-white'}`}
              >
                SW
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-semibold ${!isSw ? 'bg-white text-[#a80c10]' : 'bg-transparent text-white'}`}
              >
                EN
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">{isSw ? 'Orodha ya Wafanyakazi' : 'Staff Directory'}</h2>
            <p className="mt-3 max-w-sm text-base text-white/75 lg:text-lg">
              {isSw ? 'Chagua eneo lako la kazi ili kuingia kwenye dashibodi.' : 'Select your operational area to access your dashboard.'}
            </p>
          </div>

          <div className="mt-8 flex-1 space-y-2.5">
            {ROLE_ORDER.map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setSelectedUserId('');
                    setPassword('');
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-semibold transition lg:text-xl ${
                    active
                      ? 'bg-white text-[#a80c10] shadow-[0_10px_24px_rgba(0,0,0,0.14)]'
                      : 'bg-transparent text-white/95 hover:bg-white/10'
                  }`}
                >
                  <span>{SHORT_ROLE_LABELS[role][language]}</span>
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
            {isSw ? 'Rudi Ukurasa wa Umma' : 'Back to Public Page'}
          </button>
        </aside>

        <section className="rounded-b-[20px] bg-[#f3f4f6] p-6 text-slate-900 lg:rounded-b-none lg:rounded-r-[20px] lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-2xl">
            <h3 className="text-3xl font-bold lg:text-4xl">{SHORT_ROLE_LABELS[selectedRole][language]}</h3>
            <p className="mt-2 text-lg text-slate-500 lg:text-xl">{ROLE_DESCRIPTIONS[selectedRole][language]}</p>

            <form onSubmit={handleSignIn} className="mt-8 space-y-4">
              <div className="space-y-3">
                <Label htmlFor="staff-user" className="text-lg font-semibold text-slate-700">
                  {isSw ? 'Jitambulishe' : 'Identify Yourself'}
                </Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger
                    id="staff-user"
                    className="h-12 rounded-xl border-2 border-slate-200 bg-white text-base"
                  >
                    <div className="flex items-center gap-2">
                      <UserRound className="h-5 w-5 text-slate-400" />
                      <SelectValue placeholder={isSw ? 'Chagua mtumiaji wa staff' : 'Select a staff member'} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {!user.isActive ? (isSw ? '(Amezimwa)' : '(Inactive)') : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoleUsers.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {isSw ? 'Hakuna watumiaji kwa role hii. Hakikisha staff_users ipo Firestore.' : 'No users found for this role. Sync staff_users in Firestore.'}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-lg font-semibold text-slate-700">
                  {isSw ? 'Nenosiri' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSw ? 'Ingiza nenosiri' : 'Enter password'}
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
                {isSw ? 'Ingia Kwenye Mfumo' : 'Login to Workspace'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
