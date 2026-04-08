import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ROLE_ORDER: UserRole[] = [
  'managing_director',
  'manager',
  'assistant_hall_manager',
  'cashier_1',
  'store_keeper',
  'purchaser',
  'accountant',
];

const SHORT_ROLE_LABELS: Record<UserRole, { en: string; sw: string }> = {
  manager: { en: 'Halls Manager', sw: 'Meneja wa Kumbi' },
  managing_director: { en: 'Managing Director', sw: 'Mkurugenzi Mkuu' },
  assistant_hall_manager: { en: 'Assistant Hall Manager', sw: 'Msaidizi wa Meneja wa Ukumbi' },
  cashier_1: { en: 'Cashier', sw: 'Keshia' },
  cashier_2: { en: 'Cashier 2', sw: 'Keshia 2' },
  controller: { en: 'Accountant', sw: 'Mhasibu' },
  store_keeper: { en: 'Storekeeper', sw: 'Msimamizi wa Ghala' },
  purchaser: { en: 'Purchaser', sw: 'Mnunua Bidhaa' },
  accountant: { en: 'Accountant', sw: 'Mhasibu' },
};

const ROLE_DESCRIPTIONS: Record<UserRole, { en: string; sw: string }> = {
  manager: { en: 'Runs hall operations, approvals, and daily service delivery.', sw: 'Anasimamia uendeshaji wa kumbi, approvals, na utoaji wa huduma kila siku.' },
  managing_director: { en: 'Views executive performance, transfers, and top-level oversight.', sw: 'Anaona utendaji wa juu, uhamisho wa fedha, na usimamizi wa juu.' },
  assistant_hall_manager: { en: 'Handles booking intake, reception, and past booking capture.', sw: 'Anashughulikia mapokezi, bookings, na kurekodi past booking.' },
  cashier_1: { en: 'Handles payments, booking approvals, and cash movement.', sw: 'Anasimamia malipo, approvals za booking, na mzunguko wa fedha.' },
  cashier_2: { en: 'Supports legacy cashier visibility.', sw: 'Anaunga mkono mwonekano wa cashier wa zamani.' },
  controller: { en: 'Merged into accountant access.', sw: 'Imeunganishwa ndani ya accountant.' },
  store_keeper: { en: 'Runs stock control and plans event item distribution from store.', sw: 'Anasimamia stock na kupanga ugawaji wa vitu vya event kutoka store.' },
  purchaser: { en: 'Handles purchases, low stock follow-up, and supplier workflow.', sw: 'Anashughulikia ununuzi, ufuatiliaji wa stock ndogo, na uratibu wa wasambazaji.' },
  accountant: { en: 'Controls finance, approvals, reporting, and staff administration.', sw: 'Anasimamia fedha, approvals, taarifa, na utawala wa watumiaji.' },
};

function getDashboardRoute(role: UserRole) {
  if (role === 'cashier_1') return '/bookings';
  return role === 'managing_director' ? '/managing-director-dashboard' : '/dashboard';
}

function isLegacyAugustine(user: User) {
  return /augustine/i.test(user.name);
}

function getDisplayRole(user: User, selectedRole: UserRole): UserRole {
  if (selectedRole === 'accountant' && user.role === 'controller') return 'accountant';
  return user.role;
}

function getVisibleStaffName(user: User, selectedRole: UserRole, language: 'en' | 'sw') {
  void user;
  void selectedRole;
  void language;
  return '1234';
}

function getHiddenStaffDescription(user: User, selectedRole: UserRole, language: 'en' | 'sw') {
  if (selectedRole === 'manager' && /diana|dianna/i.test(user.name)) {
    return language === 'sw' ? 'Meneja wa Kumbi' : 'Halls Manager';
  }
  return user.name;
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

  const selectedRoleUsers = useMemo(() => {
    return staffUsers.filter((user) => {
      if (isLegacyAugustine(user)) return false;
      const displayRole = getDisplayRole(user, selectedRole);
      return displayRole === selectedRole;
    });
  }, [selectedRole, staffUsers]);

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
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/50 bg-white/80 shadow-[0_32px_90px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-[1.05fr_1.2fr]">
        <aside className="relative overflow-hidden bg-[radial-gradient(circle_at_top,#ef4444_0%,#991b1b_42%,#111827_100%)] p-6 text-white lg:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_42%)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-white/65">Staff Access</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight lg:text-4xl">Kuringe Halls</h2>
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-white/20 bg-white/10">
                <button
                  type="button"
                  onClick={() => setLanguage('sw')}
                  className={`px-3 py-1.5 text-xs font-semibold ${isSw ? 'bg-white text-slate-900' : 'text-white'}`}
                >
                  SW
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 text-xs font-semibold ${!isSw ? 'bg-white text-slate-900' : 'text-white'}`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
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
                    className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-white/50 bg-white text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.18)]'
                        : 'border-white/10 bg-white/6 text-white hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold lg:text-base">{SHORT_ROLE_LABELS[role][language]}</p>
                      <p className={`mt-1 text-xs ${active ? 'text-slate-500' : 'text-white/65'}`}>{ROLE_DESCRIPTIONS[role][language]}</p>
                    </div>
                    <ArrowRight className={`h-5 w-5 transition ${active ? 'translate-x-0' : 'translate-x-0 text-white/45 group-hover:text-white'}`} />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="relative mt-auto inline-flex items-center gap-2 pt-8 text-sm text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {isSw ? 'Rudi ukurasa wa umma' : 'Back to public page'}
            </button>
          </div>
        </aside>

        <section className="relative bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-6 text-slate-900 lg:px-10 lg:py-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.22),transparent_65%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col justify-center">
            <div className="rounded-[30px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.45em] text-slate-400">{isSw ? 'Kituo cha Kazi' : 'Workspace Access'}</p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
                    {SHORT_ROLE_LABELS[selectedRole][language]}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 lg:text-base">
                    {ROLE_DESCRIPTIONS[selectedRole][language]}
                  </p>
                </div>
                <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right text-xs text-emerald-700 sm:block">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{isSw ? 'Salama' : 'Secure'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSignIn} className="mt-8 space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="staff-user" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {isSw ? 'Mtumiaji' : 'Staff User'}
                  </Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="staff-user" className="h-14 rounded-2xl border-slate-200 bg-slate-50/90 text-base shadow-none">
                      <div className="flex items-center gap-3 text-left">
                        <div className="rounded-xl bg-white p-2 shadow-sm">
                          <UserRound className="h-4 w-4 text-slate-500" />
                        </div>
                        <SelectValue placeholder={isSw ? 'Chagua mtumiaji wa staff' : 'Select a staff member'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRoleUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getVisibleStaffName(user, selectedRole, language)} {!user.isActive ? (isSw ? '(Amezimwa)' : '(Inactive)') : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRoleUsers.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      {isSw ? 'Hakuna watumiaji kwa role hii kwenye staff directory.' : 'No users found for this role in the staff directory.'}
                    </p>
                  ) : null}
                  {selectedUserId ? (
                    <p className="text-xs text-slate-500">
                      {(() => {
                        const selectedUser = selectedRoleUsers.find((entry) => entry.id === selectedUserId);
                        if (!selectedUser) return '';
                        return `${isSw ? 'Akaunti' : 'Account'}: ${getHiddenStaffDescription(selectedUser, selectedRole, language)}`;
                      })()}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {isSw ? 'Nenosiri' : 'Password'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSw ? 'Ingiza nenosiri' : 'Enter password'}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/90 text-base"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 w-full rounded-2xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-800"
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                  {isSw ? 'Ingia kwenye mfumo' : 'Login to workspace'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
