'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useUpdateEmail } from '@/hooks/queries';
import { getApiErrorMessage, getValidationErrors } from '@/lib/error';
import { toast } from 'sonner';

const emailSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface EmailSettingsFormProps {
  currentEmail: string;
}

export function EmailSettingsForm({ currentEmail }: EmailSettingsFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateEmail, isPending } = useUpdateEmail();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail,
      current_password: '',
    },
  });

  const onSubmit = (data: EmailFormValues) => {
    updateEmail(data, {
      onSuccess: () => {
        setIsEditing(false);
        reset({ email: data.email, current_password: '' });
      },
      onError: (err) => {
        const validationErrors = getValidationErrors(err);
        if (validationErrors.email) {
          toast.error(validationErrors.email[0]);
        } else if (validationErrors.current_password) {
          toast.error(validationErrors.current_password[0]);
        } else {
          toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour de l\'email'));
        }
      },
    });
  };

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Mail size={16} aria-hidden style={{ color: 'var(--primary)', marginTop: 2 }} />
            <div className="min-w-0">
              <span className="block text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Adresse email
              </span>
              {!isEditing && (
                <span className="text-xs truncate block" style={{ color: 'var(--muted-foreground)' }}>
                  {currentEmail}
                </span>
              )}
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
            {isEditing ? 'Annuler' : 'Modifier'}
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
                {/* New Email */}
                <div>
                  <label htmlFor="new_email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    Nouvel email
                  </label>
                  <input
                    id="new_email"
                    type="email"
                    {...register('email')}
                    className="w-full h-9 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{
                      background: 'var(--input)',
                      color: 'var(--foreground)',
                      border: `1px solid ${errors.email ? 'var(--destructive)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  {errors.email && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--destructive)' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Current Password for confirmation */}
                <div>
                  <label htmlFor="current_password_email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    Confirmer avec votre mot de passe actuel
                  </label>
                  <div className="relative">
                    <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                    <input
                      id="current_password_email"
                      type="password"
                      {...register('current_password')}
                      className="w-full h-9 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      style={{
                        background: 'var(--input)',
                        color: 'var(--foreground)',
                        border: `1px solid ${errors.current_password ? 'var(--destructive)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                      }}
                    />
                  </div>
                  {errors.current_password && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--destructive)' }}>
                      {errors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-8 px-4 text-xs font-bold flex items-center gap-2 transition-opacity disabled:opacity-40 hover:opacity-90"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    {isPending && <Loader2 size={12} className="animate-spin" aria-hidden />}
                    {isPending ? 'Mise à jour…' : 'Mettre à jour l\'email'}
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
