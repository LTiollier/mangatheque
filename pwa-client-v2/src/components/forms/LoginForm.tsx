'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { loginAction } from '@/app/actions/auth';
import { tokenStorage } from '@/lib/tokenStorage';
import { useAuth } from '@/contexts/AuthContext';
import { FormField } from './FormField';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginFormValues) {
    startTransition(async () => {
      try {
        const { user, token } = await loginAction(data.email, data.password);
        // Store token client-side (localStorage + auth_check cookie for middleware)
        tokenStorage.setToken(token);
        login(user);
        toast.success("Bienvenue ! Redirection en cours...");
        window.location.href = '/collection';
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de connexion';
        if (message === 'Email ou mot de passe incorrect') {
          setError('password', { message });
        } else {
          toast.error(message);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <FormField
        label="Email"
        type="email"
        placeholder="vous@exemple.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="flex flex-col gap-1.5">
        <FormField
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs transition-opacity hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 flex items-center justify-center gap-2 rounded text-sm font-semibold transition-opacity disabled:opacity-60 mt-1"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius)',
        }}
      >
        {isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {isPending ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Pas encore de compte ?{' '}
        <Link
          href="/register"
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          S&apos;inscrire
        </Link>
      </p>
    </form>
  );
}
