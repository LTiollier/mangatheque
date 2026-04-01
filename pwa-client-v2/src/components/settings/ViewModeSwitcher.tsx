'use client';

import { useCallback, useTransition } from 'react';
import { LayoutGrid, List, Smartphone, Monitor } from 'lucide-react';

import { useViewModeContext, type ViewMode } from '@/contexts/ViewModeContext';

// ─── Options hoisted (rendering-hoist-jsx) ────────────────────────────────────
const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'cover', label: 'Couverture', icon: LayoutGrid },
  { value: 'list',  label: 'Liste',      icon: List        },
];

// ─── ViewSelector — défini au module level (rerender-no-inline-components) ───

interface ViewSelectorProps {
  label:     string;
  icon:      typeof Smartphone;
  value:     ViewMode;
  onChange:  (v: ViewMode) => void;
  isPending: boolean;
}

function ViewSelector({ label, icon: Icon, value, onChange, isPending }: ViewSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
        <span
          className="text-xs font-semibold uppercase"
          style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
        >
          {label}
        </span>
      </div>
      <div className="flex gap-2">
        {VIEW_OPTIONS.map(({ value: v, label: optLabel, icon: OptIcon }) => {
          const isActive = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              disabled={isPending}
              aria-pressed={isActive}
              className="flex-1 flex items-center justify-center gap-2 h-9 text-xs font-semibold transition-colors disabled:opacity-50"
              style={{
                background:   isActive ? 'var(--primary)' : 'var(--secondary)',
                color:        isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border:       isActive ? 'none' : '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <OptIcon size={13} aria-hidden />
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface ViewModeSwitcherProps {
  /** Appelé après application locale — utiliser pour persister en base */
  onSelectMobile?:  (v: ViewMode) => void;
  /** Appelé après application locale — utiliser pour persister en base */
  onSelectDesktop?: (v: ViewMode) => void;
}

export function ViewModeSwitcher({ onSelectMobile, onSelectDesktop }: ViewModeSwitcherProps = {}) {
  const { mobile, desktop, setMobile, setDesktop } = useViewModeContext();

  // rerender-transitions : changement de préférence non-urgent
  const [isPending, startTransition] = useTransition();

  // rerender-memo : useCallback évite de recréer les handlers si onSelect* est stable
  const handleMobile  = useCallback((v: ViewMode) => startTransition(() => { setMobile(v);  onSelectMobile?.(v);  }), [setMobile, onSelectMobile]);
  const handleDesktop = useCallback((v: ViewMode) => startTransition(() => { setDesktop(v); onSelectDesktop?.(v); }), [setDesktop, onSelectDesktop]);

  return (
    <div className="flex flex-col gap-4">
      <ViewSelector
        label="Mobile"
        icon={Smartphone}
        value={mobile}
        onChange={handleMobile}
        isPending={isPending}
      />
      <div className="h-px" style={{ background: 'var(--border)' }} />
      <ViewSelector
        label="Desktop"
        icon={Monitor}
        value={desktop}
        onChange={handleDesktop}
        isPending={isPending}
      />
    </div>
  );
}
