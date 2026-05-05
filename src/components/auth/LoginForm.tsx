import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  store_keeper: { en: 'Event Planner/Storekeeper', sw: 'Mpangaji wa Matukio/Msimamizi wa Ghala' },
  purchaser: { en: 'Purchaser', sw: 'Mnunua Bidhaa' },
  accountant: { en: 'Accountant', sw: 'Mhasibu' },
};

function getDashboardRoute(role: UserRole) {
  if (role === 'cashier_1') return '/bookings';
  return role === 'managing_director' ? '/managing-director-dashboard' : '/dashboard';
}

interface LoginFormProps {
  lockedRole?: UserRole;
}

export function LoginForm({ lockedRole }: LoginFormProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(lockedRole ?? 'manager');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginWithResult, refreshStaffUsers } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const isSw = language === 'sw';

  useEffect(() => {
    if (lockedRole) {
      setSelectedRole(lockedRole);
    }
  }, [lockedRole]);

  useEffect(() => {
    void refreshStaffUsers();
  }, [refreshStaffUsers]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast({
        title: isSw ? 'Akaunti inahitajika' : 'Account required',
        description: isSw ? 'Tafadhali ingiza barua pepe au namba ya staff.' : 'Please enter your email or staff ID.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithResult(identifier, password, { allowedRoles: [selectedRole] });

      if (result.ok) {
        toast({
          title: isSw ? 'Umeingia kikamilifu' : 'Login successful',
          description: isSw ? 'Karibu kwenye mfumo wako wa kazi.' : 'Welcome to your workspace.',
        });
        navigate(getDashboardRoute(selectedRole), { replace: true });
        return;
      }

      toast({
        title: isSw ? 'Kuingia kumeshindikana' : 'Login failed',
        description: result.message ?? (isSw ? 'Nenosiri si sahihi au akaunti imezimwa.' : 'Incorrect password or inactive user account.'),
        variant: 'destructive',
      });
    } catch {
      toast({
        title: isSw ? 'Kuingia kumeshindikana' : 'Login failed',
        description: isSw ? 'Jaribu tena baada ya muda mfupi.' : 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
              {lockedRole ? (
                <div className="rounded-2xl border border-white/30 bg-white px-4 py-5 text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                  <p className="text-sm font-semibold lg:text-base">{SHORT_ROLE_LABELS[lockedRole][language]}</p>
                  <p className="mt-1 text-xs text-slate-500">{isSw ? 'Mlango binafsi wa kazi' : 'Private workspace access'}</p>
                </div>
              ) : ROLE_ORDER.map((role) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      setIdentifier('');
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
                    {isSw ? 'Eneo salama la kazi kwa watumiaji walioidhinishwa.' : 'Secure workspace for authorized Kuringe Halls users.'}
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
                  <Label htmlFor="staff-identifier" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {isSw ? 'Akaunti' : 'Account'}
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="staff-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={isSw ? 'Barua pepe au namba ya staff' : 'Email or staff ID'}
                      autoComplete="username"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50/90 pl-12 text-base"
                      required
                      disabled={isLoading}
                    />
                  </div>
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
                    autoComplete="current-password"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/90 text-base"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !identifier.trim() || !password.trim()}
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
