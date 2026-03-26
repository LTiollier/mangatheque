'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, Loader2, Check } from 'lucide-react';
import { useState } from 'react';
import { useUpdatePassword } from '@/hooks/queries';
import { useOffline } from '@/contexts/OfflineContext';
import { getApiErrorMessage, getValidationErrors } from '@/lib/error';
import { toast } from 'sonner';

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
  password: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères'),
  password_confirmation: z.string().min(1, 'La confirmation est requise'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['password_confirmation'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordSettingsForm() {
  const { isOffline } = useOffline();
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updatePassword, isPending } = useUpdatePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = (data: PasswordFormValues) => {
    updatePassword(data, {
      onSuccess: () => {
        setIsEditing(false);
        reset();
      },
      onError: (err) => {
        const validationErrors = getValidationErrors(err);
        if (validationErrors.password) {
          toast.error(validationErrors.password[0]);
        } else if (validationErrors.current_password) {
          toast.error(validationErrors.current_password[0]);
        } else {
          toast.error(getApiErrorMessage(err, 'Erreur lors de la modification du mot de passe'));
        }
      },
    });
  };

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Lock size={16} aria-hidden style={{ color: 'var(--primary)', marginTop: 2 }} />
            <div className="min-w-0">
              <span className="block text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Mot de passe
              </span>
              <span className="text-xs truncate block" style={{ color: 'var(--muted-foreground)' }}>
                ••••••••••••
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditing(!isEditing);
              if (isEditing) reset();
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-md transition-colors hover:opacity-80"
            style={{ 
              background: 'var(--muted)', 
              color: 'var(--foreground)',
              border: '1px solid var(--border)' 
            }}
          >
            {isEditing ? 'Annuler' : 'Changer'}
          </button>
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="pt-4 flex flex-col gap-4">
                {/* Current Password */}
                <div>
                  <label htmlFor="cur_password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    Mot de passe actuel
                  </label>
                  <input
                    id="cur_password"
                    type="password"
                    {...register('current_password')}
                    className="w-full h-9 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{
                      background: 'var(--input)',
                      color: 'var(--foreground)',
                      border: `1px solid ${errors.current_password ? 'var(--destructive)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  {errors.current_password && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--destructive)' }}>
                      {errors.current_password.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="new_password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    Nouveau mot de passe
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    {...register('password')}
                    className="w-full h-9 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{
                      background: 'var(--input)',
                      color: 'var(--foreground)',
                      border: `1px solid ${errors.password ? 'var(--destructive)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  {errors.password && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--destructive)' }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label htmlFor="password_confirmation" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    id="password_confirmation"
                    type="password"
                    {...register('password_confirmation')}
                    className="w-full h-9 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{
                      background: 'var(--input)',
                      color: 'var(--foreground)',
                      border: `1px solid ${errors.password_confirmation ? 'var(--destructive)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  {errors.password_confirmation && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--destructive)' }}>
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isPending || isOffline}
                    className="h-8 px-4 text-xs font-bold flex items-center gap-2 transition-opacity disabled:opacity-40 hover:opacity-90"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    {isPending && <Loader2 size={12} className="animate-spin" aria-hidden />}
                    {isPending ? 'Mise à jour…' : 'Changer le mot de passe'}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
