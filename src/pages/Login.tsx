import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-sidebar-foreground">Kuringe Halls</span>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Hall Booking &<br />
            Management System
          </h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-md">
            Streamline venue bookings, manage customers, track payments,
            and coordinate events in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-lg bg-sidebar-accent p-4">
              <div className="text-3xl font-bold text-primary">5</div>
              <div className="text-sm text-sidebar-foreground/70">Premium Halls</div>
            </div>
            <div className="rounded-lg bg-sidebar-accent p-4">
              <div className="text-3xl font-bold text-primary">TZS</div>
              <div className="text-sm text-sidebar-foreground/70">Local Currency</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-sidebar-foreground/50">(c) 2026 Kuringe Halls. All rights reserved.</div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">Kuringe Halls</span>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
