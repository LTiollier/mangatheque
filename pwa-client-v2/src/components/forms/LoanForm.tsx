'use client';

import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { useCreateLoan } from '@/hooks/queries';
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
  items: { type: 'volume' | 'box'; id: number }[];
  /** Noms d'emprunteurs passés (pour autocomplete datalist) */
  suggestions?: string[];
  onSuccess?: () => void;
}

/**
 * LoanForm — formulaire de prêt en bottom sheet.
 *
 * Pattern `rerender-move-effect-to-event` : toute la logique de soumission
 * est dans le handler, aucun useEffect.
 */
export function LoanForm({ items, suggestions = [], onSuccess }: LoanFormProps) {
  const { isOffline } = useOffline();
  const datalistId = useId();
  const createLoan = useCreateLoan();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
  });

  function onSubmit(data: LoanFormValues) {
    if (isOffline) return;
    createLoan.mutate(
      { items, borrowerName: data.borrower_name },
      { onSuccess: () => onSuccess?.() },
    );
  }

  const count = items.length;
  const label = count === 1 ? '1 élément' : `${count} éléments`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* Rappel de l'objet prêté */}
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Prêt de{' '}
        <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
          {label}
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
        disabled={createLoan.isPending || isOffline}
        className="w-full h-11 flex items-center justify-center gap-2 rounded text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {createLoan.isPending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {createLoan.isPending ? 'Création…' : 'Confirmer le prêt'}
      </button>
    </form>
  );
}
