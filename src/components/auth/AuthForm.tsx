import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { PhoneAuthForm } from './PhoneAuthForm';
import { Phone, Mail } from 'lucide-react';
import { detectEmailTypo } from '@/utils/emailValidation';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthForm = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const { signIn } = useAuth();
  
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="h-8 w-8 text-primary" />
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
              <Label htmlFor="password">Password</Label>
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
        </CardContent>
      </Card>
    </div>
  );
};
