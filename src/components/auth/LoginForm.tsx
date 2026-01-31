import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USERS, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, User, Shield, Loader2 } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid email or account is inactive.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleQuickLogin = async (userEmail: string) => {
    setIsLoading(true);
    const success = await login(userEmail, 'demo');
    if (success) {
      toast({
        title: 'Welcome!',
        description: 'Logged in with demo account.',
      });
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Main Login Form */}
      <Card className="border-2">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Staff Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@kuringe.co.tz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
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
        </CardContent>
      </Card>

      {/* Demo Accounts */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Demo Accounts (Quick Login)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {DEMO_USERS.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="h-auto justify-start px-3 py-2 text-left"
              onClick={() => handleQuickLogin(user.email)}
              disabled={isLoading}
            >
              <User className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{ROLE_LABELS[user.role]}</span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[user.role]}
                </span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
