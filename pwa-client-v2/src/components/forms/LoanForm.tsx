'use client';

import { useId, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { loanService } from '@/services/loan.service';
import { queryKeys } from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/error';
import { useOffline } from '@/contexts/OfflineContext';
import { FormField } from './FormField';

const loanSchema = z.object({
  borrower_name: z
    .string()
    .min(1, "Le nom de l'emprunteur est requis")
    .max(100, 'Maximum 100 caractères'),
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormProps {
  loanableId: number;
  loanableType: 'volume' | 'box';
  /** Affiché en en-tête pour rappeler ce qu'on prête */
  loanableName: string;
  /** Noms d'emprunteurs passés (pour autocomplete datalist) */
  suggestions?: string[];
  onSuccess?: () => void;
}

/**
 * LoanForm — formulaire de prêt en bottom sheet.
 *
 * Pattern `rendering-usetransition-loading` : useTransition pour le submit
 * au lieu de useState(isLoading) — évite un re-render superflu au mount.
 * Pattern `rerender-move-effect-to-event` : toute la logique de soumission
 * est dans le handler, aucun useEffect.
 */
export function LoanForm({
  loanableId,
  loanableType,
  loanableName,
  suggestions = [],
  onSuccess,
}: LoanFormProps) {
  const { isOffline } = useOffline();
  const datalistId = useId();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
  });

  function onSubmit(data: LoanFormValues) {
    if (isOffline) return;
    startTransition(async () => {
      try {
        await loanService.create(
          loanableId,
          loanableType,
          data.borrower_name,
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.loans }),
          queryClient.invalidateQueries({ queryKey: queryKeys.volumes }),
        ]);
        toast.success(`Prêté à ${data.borrower_name}`);
        onSuccess?.();
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Erreur lors de la création du prêt'));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* Rappel de l'objet prêté */}
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Prêt de{' '}
        <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
          {loanableName}
        </span>
      </p>

      {/* Nom emprunteur avec datalist autocomplete */}
      <div className="flex flex-col gap-1.5">
        <FormField
          label="Nom de l'emprunteur"
          placeholder="Ex : Lucas"
          autoComplete="off"
          list={datalistId}
          error={errors.borrower_name?.message}
          autoFocus
          {...register('borrower_name')}
        />
        {suggestions.length > 0 && (
          <datalist id={datalistId}>
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        )}
      </div>

      {/* CTA full-width */}
      <button
        type="submit"
        disabled={isPending || isOffline}
        className="w-full h-11 flex items-center justify-center gap-2 rounded text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {isPending ? 'Création…' : 'Confirmer le prêt'}
      </button>
    </form>
  );
}
