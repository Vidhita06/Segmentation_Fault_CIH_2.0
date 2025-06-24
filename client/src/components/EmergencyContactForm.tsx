import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const emergencyContactSchema = z.object({
  email1: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  email2: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  email3: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
}).refine((data) => {
  // At least one email must be provided
  return data.email1 || data.email2 || data.email3;
}, {
  message: 'Please provide at least one emergency contact email',
  path: ['email1']
});

type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;

interface EmergencyContactFormProps {
  userId: number;
  onSuccess: () => void;
  isOpen: boolean;
}

export function EmergencyContactForm({ userId, onSuccess, isOpen }: EmergencyContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    mode: 'onChange',
  });

  const watchedEmails = watch(['email1', 'email2', 'email3']);
  const hasValidEmail = watchedEmails.some(email => email && email.trim() !== '');

  const onSubmit = async (data: EmergencyContactFormData) => {
    setIsSubmitting(true);
    // Uniqueness check (frontend)
    const emails = [data.email1, data.email2, data.email3].filter(email => email && email.trim() !== '');
    if (new Set(emails).size !== emails.length) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Emails must be unique.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('/api/user/emergency-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails, userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save emergency contacts');
      }
      setIsSuccess(true);
      toast({
        title: "Success!",
        description: "Your emergency contacts have been notified.",
        variant: "default",
      });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving emergency contacts:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save emergency contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Thank you!</h3>
              <p className="text-muted-foreground">
                Your emergency contacts have been notified.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Add Emergency Contacts</CardTitle>
          <CardDescription>
            For your safety, please add the email addresses of three family members. 
            We will notify them that you have safely arrived on our platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email1">Family Member 1 Email</Label>
                <Input
                  id="email1"
                  type="email"
                  placeholder="family.member1@example.com"
                  {...register('email1')}
                  className={errors.email1 ? 'border-red-500' : ''}
                />
                {errors.email1 && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email1.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email2">Family Member 2 Email</Label>
                <Input
                  id="email2"
                  type="email"
                  placeholder="family.member2@example.com"
                  {...register('email2')}
                  className={errors.email2 ? 'border-red-500' : ''}
                />
                {errors.email2 && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email2.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email3">Family Member 3 Email</Label>
                <Input
                  id="email3"
                  type="email"
                  placeholder="family.member3@example.com"
                  {...register('email3')}
                  className={errors.email3 ? 'border-red-500' : ''}
                />
                {errors.email3 && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email3.message}
                  </p>
                )}
              </div>
            </div>

            {errors.email1?.message && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errors.email1.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={!hasValidEmail || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 