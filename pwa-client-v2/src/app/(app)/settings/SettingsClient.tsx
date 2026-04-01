'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Globe, Shield, Loader2, ExternalLink, AlertTriangle, Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { useUpdateSettings } from '@/hooks/queries';
import { useViewModeContext } from '@/contexts/ViewModeContext';
import { PaletteSwitcher } from '@/components/palette/PaletteSwitcher';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { usePalette, type Palette } from '@/contexts/PaletteContext';
import { sectionVariants } from '@/lib/motion';
import { getApiErrorMessage, getValidationErrors } from '@/lib/error';
import { MangaCollecImportCard } from '@/components/settings/MangaCollecImportCard';
import { InstallAppCard } from '@/components/settings/InstallAppCard';
import { ViewModeSwitcher } from '@/components/settings/ViewModeSwitcher';
import { LogOut } from 'lucide-react';

// ─── Zod schema — mirrored from API rules ─────────────────────────────────────

const settingsSchema = z.object({
  username: z
    .string()
    .regex(
      /^[a-zA-Z0-9_]*$/,
      'Seuls les lettres, chiffres et underscores sont autorisés',
    )
    .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
    .refine(v => v === '' || v.length >= 3, {
      message: 'Le pseudo doit faire au moins 3 caractères',
    }),
  is_public: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─── Hoisted static JSX (rendering-hoist-jsx) ─────────────────────────────────

const sectionAppearanceHeader = (
  <div className="mb-5">
    <h2
      className="text-xs font-semibold uppercase mb-1"
      style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
    >
      Apparence
    </h2>
    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
      Choisissez le thème et l&apos;accent couleur de l&apos;interface. Les changements sont instantanés.
    </p>
  </div>
);

const sectionDisplayHeader = (
  <div className="mb-5">
    <h2
      className="text-xs font-semibold uppercase mb-1"
      style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
    >
      Affichage
    </h2>
    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
      Choisissez comment vos mangas sont présentés.
    </p>
  </div>
);

const sectionNotificationsHeader = (
  <div className="mb-5">
    <h2
      className="text-xs font-semibold uppercase mb-1"
      style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
    >
      Notifications
    </h2>
    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
      Choisissez comment Atsume vous tient informé.
    </p>
  </div>
);

// ─── ToggleSwitch — defined at module level (rerender-no-inline-components) ───

interface ToggleSwitchProps {
  checked: boolean;
  onToggle: () => void;
  id: string;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onToggle, id, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50"
      style={{ background: checked ? 'var(--primary)' : 'var(--muted)' }}
    >
      <span
        className="pointer-events-none absolute top-1 h-4 w-4 rounded-full transition-transform duration-200"
        style={{
          background: checked ? 'var(--primary-foreground)' : 'var(--foreground)',
          transform: checked ? 'translateX(21px)' : 'translateX(4px)',
        }}
      />
    </button>
  );
}

import { EmailSettingsForm } from '@/components/settings/EmailSettingsForm';
import { PasswordSettingsForm } from '@/components/settings/PasswordSettingsForm';

// ─── SettingsClient ───────────────────────────────────────────────────────────

export function SettingsClient() {
  const { user, updateUser, logout } = useAuth();
  const { mutate: saveSettings, isPending } = useUpdateSettings();
  const { theme } = useTheme();
  const { palette } = usePalette();
  const { mobile: viewModeMobile, desktop: viewModeDesktop } = useViewModeContext();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      username: user?.username ?? '',
      is_public: user?.is_public ?? false,
    },
  });

  // Subscribe to only the values needed for conditional UI (rerender-split-combined-hooks)
  // useWatch integrates correctly with React Compiler, unlike watch() (react-hooks/incompatible-library)
  const usernameValue = useWatch({ control, name: 'username' });
  const isPublic = useWatch({ control, name: 'is_public' });

  // Notifications preference — derived from server state (no local copy needed)
  // Toggle is disabled during isPending, so no optimistic update required
  const notifyPlanning = user?.notify_planning_releases ?? false;

  const canSave = isDirty && !isPending && !(isPublic && !usernameValue.trim());

  // Auto-save helpers — silent on success, toast only on error
  // (rerender-defer-reads: reads form values only inside callback, not on render)
  function handleThemeChange(newTheme: Theme) {
    saveSettings(
      {
        username: usernameValue.trim() || null,
        is_public: isPublic,
        theme: newTheme,
        palette,
        notify_planning_releases: notifyPlanning,
        view_mode_mobile: viewModeMobile,
        view_mode_desktop: viewModeDesktop,
      },
      {
        onSuccess: (updatedUser) => updateUser(updatedUser),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour')),
      },
    );
  }

  function handlePaletteChange(newPalette: Palette) {
    saveSettings(
      {
        username: usernameValue.trim() || null,
        is_public: isPublic,
        theme,
        palette: newPalette,
        notify_planning_releases: notifyPlanning,
        view_mode_mobile: viewModeMobile,
        view_mode_desktop: viewModeDesktop,
      },
      {
        onSuccess: (updatedUser) => updateUser(updatedUser),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour')),
      },
    );
  }

  function handleViewModeMobileChange(newMobile: 'cover' | 'list') {
    saveSettings(
      {
        username: usernameValue.trim() || null,
        is_public: isPublic,
        theme,
        palette,
        notify_planning_releases: notifyPlanning,
        view_mode_mobile: newMobile,
        view_mode_desktop: viewModeDesktop,
      },
      {
        onSuccess: (updatedUser) => updateUser(updatedUser),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour')),
      },
    );
  }

  function handleViewModeDesktopChange(newDesktop: 'cover' | 'list') {
    saveSettings(
      {
        username: usernameValue.trim() || null,
        is_public: isPublic,
        theme,
        palette,
        notify_planning_releases: notifyPlanning,
        view_mode_mobile: viewModeMobile,
        view_mode_desktop: newDesktop,
      },
      {
        onSuccess: (updatedUser) => updateUser(updatedUser),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour')),
      },
    );
  }

  function handleNotifyPlanningChange() {
    saveSettings(
      {
        username: usernameValue.trim() || null,
        is_public: isPublic,
        theme,
        palette,
        notify_planning_releases: !notifyPlanning,
        view_mode_mobile: viewModeMobile,
        view_mode_desktop: viewModeDesktop,
      },
      {
        onSuccess: (updatedUser) => updateUser(updatedUser),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour')),
      },
    );
  }

  function onSubmit(data: SettingsFormValues) {
    saveSettings(
      { username: data.username.trim() || null, is_public: data.is_public, theme, palette, notify_planning_releases: notifyPlanning, view_mode_mobile: viewModeMobile, view_mode_desktop: viewModeDesktop },
      {
        onSuccess: (updatedUser) => {
          updateUser(updatedUser);
          toast.success('Paramètres enregistrés');
        },
        onError: (err) => {
          const validationErrors = getValidationErrors(err);
          const firstField = Object.values(validationErrors)[0];
          if (firstField?.length) {
            toast.error(firstField[0]);
          } else {
            toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour'));
          }
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Paramètres
      </h1>

      {/* ── Section Apparence ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Apparence"
      >
        {sectionAppearanceHeader}

        <div
          className="rounded-[calc(var(--radius)*2)] overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* ── Thème ── */}
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              Thème
            </p>
            <ThemeSwitcher showLabels onSelect={handleThemeChange} />
          </div>

          {/* ── Palette ── */}
          <div className="px-5 py-4">
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              Palette
            </p>
            <PaletteSwitcher showLabels onSelect={handlePaletteChange} />
          </div>
        </div>
      </motion.section>

      {/* ── Section Affichage ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Affichage"
      >
        {sectionDisplayHeader}

        <div
          className="rounded-[calc(var(--radius)*2)] overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4">
            <ViewModeSwitcher
              onSelectMobile={handleViewModeMobileChange}
              onSelectDesktop={handleViewModeDesktopChange}
            />
          </div>
        </div>
      </motion.section>

      {/* ── Section Profil ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Profil"
      >
        <div className="mb-5">
          <h2
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Profil
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Gérez votre pseudo et la visibilité de votre collection.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div
            className="rounded-[calc(var(--radius)*2)] overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {/* ── Username ── */}
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-3 mb-3">
                <Shield size={16} aria-hidden style={{ color: 'var(--primary)', marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Nom d&apos;utilisateur
                  </label>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Utilisé pour votre lien de profil public. Lettres, chiffres, underscore.
                  </p>
                </div>
              </div>

              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="ex : otaku_fan99"
                {...register('username')}
                className="w-full h-10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]"
                style={{
                  background: 'var(--input)',
                  color: 'var(--foreground)',
                  border: `1px solid ${errors.username ? 'var(--destructive)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                }}
              />

              {errors.username && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--destructive)' }}>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* ── Public toggle ── */}
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Globe size={16} aria-hidden style={{ color: 'var(--primary)', marginTop: 2 }} />
                  <div className="min-w-0">
                    <label
                      htmlFor="public-toggle"
                      className="block text-sm font-semibold mb-0.5"
                      style={{ color: 'var(--foreground)', cursor: 'pointer' }}
                    >
                      Profil public
                    </label>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Toute personne connaissant votre pseudo peut voir votre collection.
                    </p>
                  </div>
                </div>

                <ToggleSwitch
                  id="public-toggle"
                  checked={isPublic}
                  onToggle={() => setValue('is_public', !isPublic, { shouldDirty: true })}
                />
              </div>

              {/* Profile link preview */}
              {isPublic && usernameValue.trim() && (
                <a
                  href={`/user/${usernameValue.trim()}/collection`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-2 px-3 py-2 rounded text-xs transition-opacity hover:opacity-80 w-fit"
                  style={{
                    background: 'var(--muted)',
                    color: 'var(--primary)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <ExternalLink size={11} aria-hidden />
                  /user/{usernameValue.trim()}/collection
                </a>
              )}

              {/* Warning: public but no username */}
              {isPublic && !usernameValue.trim() && (
                <div
                  className="mt-3 flex items-center gap-2 px-3 py-2 rounded text-xs"
                  style={{
                    background: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                    color: 'var(--primary)',
                    border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <AlertTriangle size={12} aria-hidden />
                  Définissez un pseudo pour activer le profil public.
                </div>
              )}
            </div>

            {/* ── Save button ── */}
            <div className="px-5 py-4 flex justify-end">
              <button
                type="submit"
                disabled={!canSave}
                className="h-9 px-5 text-sm font-semibold flex items-center gap-2 transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderRadius: 'var(--radius)',
                }}
              >
                {isPending && <Loader2 size={14} className="animate-spin" aria-hidden />}
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </motion.section>

      {/* ── Section Notifications ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Notifications"
      >
        {sectionNotificationsHeader}

        <div
          className="rounded-[calc(var(--radius)*2)] overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Bell size={16} aria-hidden style={{ color: 'var(--primary)', marginTop: 2 }} />
                <div className="min-w-0">
                  <label
                    htmlFor="notify-planning-toggle"
                    className="block text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--foreground)', cursor: 'pointer' }}
                  >
                    Sorties planning
                  </label>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Recevez un email chaque semaine avec vos sorties manga à venir.
                  </p>
                </div>
              </div>

              <ToggleSwitch
                id="notify-planning-toggle"
                checked={notifyPlanning}
                onToggle={handleNotifyPlanningChange}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Section Sécurité ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Sécurité"
      >
        <div className="mb-5">
          <h2
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Sécurité & Compte
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Gérez votre accès et vos identifiants.
          </p>
        </div>

        <div
          className="rounded-[calc(var(--radius)*2)] overflow-hidden mb-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <EmailSettingsForm currentEmail={user?.email ?? ''} />
          <PasswordSettingsForm />
        </div>

        <button
          type="button"
          onClick={() => { logout(); window.location.href = '/login'; }}
          className="w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            background: 'color-mix(in oklch, var(--destructive) 10%, transparent)',
            color: 'var(--destructive)',
            border: '1px solid color-mix(in oklch, var(--destructive) 25%, transparent)',
            borderRadius: 'var(--radius)',
          }}
        >
          <LogOut size={16} aria-hidden />
          Se déconnecter
        </button>
      </motion.section>

      {/* ── Section Application ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Application"
      >
        <div className="mb-5">
          <h2
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Application
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Installez Atsume sur votre appareil pour un accès rapide.
          </p>
        </div>

        <InstallAppCard />
      </motion.section>

      {/* ── Section Import ── */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        aria-label="Import"
      >
        <div className="mb-5">
          <h2
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
          >
            Importation
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Importez votre collection depuis MangaCollec.
          </p>
        </div>

        <MangaCollecImportCard />
      </motion.section>
    </div>
  );
}

