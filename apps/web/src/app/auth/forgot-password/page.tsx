'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPassword } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      setSentToEmail(data.email);
      setEmailSent(true);
    } catch (error: unknown) {
      // Even on error, we show success to prevent email enumeration
      setSentToEmail(data.email);
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <CardTitle>Revisa tu email</CardTitle>
            <CardDescription className="mt-2">
              Si existe una cuenta con el email <strong className="text-foreground">{sentToEmail}</strong>, 
              recibirás un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">¿No recibes el email?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Revisa tu carpeta de spam</li>
                <li>Verifica que el email sea correcto</li>
                <li>El enlace expira en 1 hora</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setSentToEmail('');
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar a otro email
            </Button>
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription>
            Introduce tu email y te enviaremos un enlace para restablecerla
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || forgotPasswordMutation.isPending}
            >
              {(isSubmitting || forgotPasswordMutation.isPending) ? (
                'Enviando...'
              ) : (
                'Enviar enlace de recuperación'
              )}
            </Button>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a iniciar sesión
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
