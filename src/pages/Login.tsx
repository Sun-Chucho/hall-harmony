import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { language } = useLanguage();
  const isSw = language === 'sw';

  if (!isLoading && isAuthenticated) {
    return <Navigate to={user?.role === 'managing_director' ? '/managing-director-dashboard' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f1ea_0%,#e2e8f0_42%,#cbd5e1_100%)] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto mb-6 max-w-6xl text-center">
        <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">Kuringe Nexus</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.35em] text-slate-500 sm:text-base lg:text-lg">
          {isSw ? 'Mfumo wa Usimamizi wa Kuringe Halls Moshi' : 'Moshi Halls Management System'}
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
