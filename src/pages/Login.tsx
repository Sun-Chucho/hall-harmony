import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to={user?.role === 'managing_director' ? '/managing-director-dashboard' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-[#e6e7ea] px-4 py-5 lg:px-8 lg:py-6">
      <div className="mx-auto mb-4 max-w-6xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">Kuringe Nexus</h1>
        <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-500 sm:text-base lg:text-lg">
          Moshi Halls Management System
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
