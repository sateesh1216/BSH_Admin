import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { PhoneAuthForm } from './PhoneAuthForm';
import { Phone, Mail } from 'lucide-react';
import { detectEmailTypo } from '@/utils/emailValidation';
import bshLogo from '@/assets/bsh-logo.png';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthForm = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const { signIn } = useAuth();

  const handleForgotPassword = async () => {
    const email = resetEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: 'Invalid email', description: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Reset link sent', description: `Check ${email} for the password reset link.` });
    setForgotOpen(false);
  };
  
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleEmailChange = (email: string) => {
    form.setValue('email', email);
    const suggestion = detectEmailTypo(email);
    setEmailSuggestion(suggestion);
  };

  const onSubmit = async (data: AuthFormData) => {
    // Check for email typos before submitting
    const suggestion = detectEmailTypo(data.email);
    if (suggestion) {
      toast({
        title: "Email Typo Detected",
        description: `Did you mean ${suggestion}?`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (authMethod === 'phone') {
    return <PhoneAuthForm onBackToEmail={() => setAuthMethod('email')} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center">
         <div className="flex items-center justify-center gap-2 mb-2">
            <img src={bshLogo} alt="BSH Logo" className="h-20 w-20 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            BSH Taxi Service Management
          </CardTitle>
          <CardDescription>
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={authMethod === 'email' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('email')}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAuthMethod('phone')}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Phone OTP
            </Button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register('email')}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              {emailSuggestion && (
                <p className="text-sm text-amber-600 bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                  Did you mean <button 
                    type="button"
                    className="font-semibold underline"
                    onClick={() => {
                      form.setValue('email', emailSuggestion);
                      setEmailSuggestion(null);
                    }}
                  >
                    {emailSuggestion}
                  </button>?
                </p>
              )}
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Contact your administrator if you need an account
          </p>

          <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Reset your password</DialogTitle>
                <DialogDescription>
                  We'll email you a secure link to set a new password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setForgotOpen(false)} disabled={sendingReset}>Cancel</Button>
                <Button onClick={handleForgotPassword} disabled={sendingReset}>
                  {sendingReset ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <footer className="mt-auto w-full text-center text-xs text-muted-foreground space-y-1">
        <p>
          Looking for a reliable{' '}
          <a
            href="https://www.bshtaxiservices.com/"
            className="text-primary font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            taxi in Vizag
          </a>
          ? Book with BSH Taxi Services.
        </p>
        <p>© {new Date().getFullYear()} BSH Taxi Services · Palanati Colony, Kancharapalem, Visakhapatnam</p>
      </footer>
    </div>
  );
};
