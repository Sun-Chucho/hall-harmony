import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#e6e7ea] px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto mb-6 max-w-6xl text-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-slate-900 lg:text-7xl">Kuringe Nexus</h1>
        <p className="mt-2 text-xl uppercase tracking-[0.2em] text-slate-500 lg:text-2xl">
          Moshi Halls Management System
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
