import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Phone, Shield } from 'lucide-react';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  fullName: z.string().optional(),
  role: z.string().optional(),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

interface PhoneAuthFormProps {
  onBackToEmail: () => void;
}

export const PhoneAuthForm = ({ onBackToEmail }: PhoneAuthFormProps) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const { signInWithPhone, verifyOTP } = useAuth();
  
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '+91 9640241216', // Pre-fill with user's number
    },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
      fullName: '',
      role: 'driver1',
    },
  });

  const onPhoneSubmit = async (data: PhoneFormData) => {
    try {
      // Clean phone number (remove spaces and ensure correct format)
      const cleanPhone = data.phone.replace(/\s+/g, '');
      setPhoneNumber(cleanPhone);
      
      const { error } = await signInWithPhone(cleanPhone);
      if (error) {
        if (error.message.includes('User not found')) {
          setIsNewUser(true);
        }
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${cleanPhone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onOTPSubmit = async (data: OTPFormData) => {
    try {
      const { error } = await verifyOTP(
        phoneNumber, 
        data.otp, 
        isNewUser ? data.fullName : undefined,
        isNewUser ? data.role : undefined
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: isNewUser ? "Account created successfully!" : "Signed in successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resendOTP = async () => {
    try {
      const { error } = await signInWithPhone(phoneNumber);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP Resent",
          description: `New verification code sent to ${phoneNumber}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {step === 'otp' ? (
              <Shield className="h-8 w-8 text-primary" />
            ) : (
              <Phone className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            BSH Taxi Service Management
          </CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Sign in with your phone number' 
              : `Enter the OTP sent to ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button
            variant="ghost"
            onClick={onBackToEmail}
            className="w-full flex items-center gap-2 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Email Login
          </Button>

          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9640241216"
                  {...phoneForm.register('phone')}
                />
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={phoneForm.formState.isSubmitting}
              >
                {phoneForm.formState.isSubmitting ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  {...otpForm.register('otp')}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>

              {isNewUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      {...otpForm.register('fullName')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={(value) => otpForm.setValue('role', value)} defaultValue="driver1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="driver1">Driver 1</SelectItem>
                        <SelectItem value="driver2">Driver 2</SelectItem>
                        <SelectItem value="driver3">Driver 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={otpForm.formState.isSubmitting}
              >
                {otpForm.formState.isSubmitting 
                  ? 'Verifying...' 
                  : (isNewUser ? 'Create Account' : 'Verify & Sign In')
                }
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resendOTP}
                className="w-full"
              >
                Resend OTP
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('phone')}
                className="w-full text-muted-foreground"
              >
                Change Phone Number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};