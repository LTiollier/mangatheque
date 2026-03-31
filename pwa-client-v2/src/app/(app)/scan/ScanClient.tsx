'use client';

import { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ScanBarcode,
  X,
  Loader2,
  ImageIcon,
  WifiOff,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useOffline } from '@/contexts/OfflineContext';
import { volumeService } from '@/services/volume.service';
import { getApiErrorMessage } from '@/lib/error';
import { sectionVariants, fadeInVariants } from '@/lib/motion';
import { ScanSuccessParticles, ScanParticlesRef } from '@/components/animations/ScanSuccessParticles';

// ─── Dynamic import — html5-qrcode is heavy, load only when scanner is active ─
// (bundle-dynamic-imports: code-split heavy component, download deferred to first use)

const BarcodeScanner = dynamic(
  () => import('@/components/scanner/BarcodeScanner'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-[calc(var(--radius)*3)] flex items-center justify-center"
        style={{ aspectRatio: '4/3', background: 'var(--card)' }}
      >
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} aria-hidden />
      </div>
    ),
  },
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScannedItem {
  isbn: string;
  title?: string;
  cover_url?: string | null;
  isLoading: boolean;
  isError: boolean;
}

// ─── ScannedItemRow — defined outside parent (rerender-no-inline-components) ──

interface ScannedItemRowProps {
  item: ScannedItem;
  onRemove: () => void;
}

function ScannedItemRow({ item, onRemove }: ScannedItemRowProps) {
  return (
    <div
      className="flex items-center gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Cover thumbnail */}
      <div
        className="shrink-0 w-9 relative overflow-hidden rounded"
        style={{ aspectRatio: '2/3', background: 'var(--muted)' }}
      >
        {item.isLoading ? (
          <div className="absolute inset-0 skeleton" />
        ) : item.cover_url ? (
          <Image
            src={item.cover_url}
            alt={item.title ?? ''}
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={12} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.isLoading ? (
          <div className="skeleton h-3.5 w-36 rounded" />
        ) : (
          <p
            className="text-sm font-medium leading-tight truncate"
            style={{
              color: item.isError ? 'var(--muted-foreground)' : 'var(--foreground)',
            }}
          >
            {item.isError ? 'Manga introuvable' : (item.title ?? 'Titre inconnu')}
          </p>
        )}
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
        >
          {item.isbn}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded transition-opacity hover:opacity-70"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label={`Retirer ${item.isbn}`}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

// ─── Static JSX hoisted at module level (rendering-hoist-jsx) ─────────────────

const emptyPlaceholder = (
  <div
    className="flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-5"
    style={{ background: 'var(--muted)' }}
  >
    <ScanBarcode size={36} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
  </div>
);

// ─── ScanClient ───────────────────────────────────────────────────────────────

export function ScanClient() {
  const { isOffline } = useOffline();

  const [isScanning, setIsScanning] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const particlesRef = useRef<ScanParticlesRef>(null);

  // O(1) duplicate check — derived during render, no effect (js-set-map-lookups + rerender-derived-state-no-effect)
  const isbnSet = useMemo(() => new Set(items.map(i => i.isbn)), [items]);

  // handleScan reads isbnSet from the current render — BarcodeScanner stores this
  // in a ref so it always calls the latest version (advanced-event-handler-refs)
  async function handleScan(isbn: string) {
    if (isbnSet.has(isbn)) {
      toast.error(`Code ${isbn} déjà scanné`);
      return;
    }

    setItems(prev => [...prev, { isbn, isLoading: true, isError: false }]);
    toast.success(`Code scanné`);
    particlesRef.current?.play();

    try {
      const result = await volumeService.searchByIsbn(isbn);
      setItems(prev =>
        prev.map(item =>
          item.isbn === isbn
            ? {
                ...item,
                isLoading: false,
                title: result?.title,
                cover_url: result?.cover_url ?? null,
                isError: !result,
              }
            : item,
        ),
      );
    } catch {
      setItems(prev =>
        prev.map(item =>
          item.isbn === isbn ? { ...item, isLoading: false, isError: true } : item,
        ),
      );
    }
  }

  function handleRemove(isbn: string) {
    setItems(prev => prev.filter(i => i.isbn !== isbn));
  }

  async function handleSubmit() {
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await volumeService.scanBulk(items.map(i => i.isbn));
      const n = items.length;
      toast.success(
        `${n} manga${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à votre collection`,
      );
      setItems([]);
      setIsScanning(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erreur lors de l'envoi groupé."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const validCount = items.filter(i => !i.isError).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Scanner
        </h1>
        {items.length > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {items.length}
          </span>
        )}
      </div>

      {/* Camera view — lazy-loaded only when scanning (bundle-dynamic-imports) */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            key="camera"
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <BarcodeScanner onScan={handleScan} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start / Stop CTA */}
      {isScanning ? (
        <button
          type="button"
          onClick={() => setIsScanning(false)}
          className="w-full h-11 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            background: 'var(--secondary)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          Arrêter le scan
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsScanning(true)}
          disabled={isOffline}
          className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          {isOffline ? (
            <><WifiOff size={16} aria-hidden /> Hors ligne</>
          ) : (
            <><ScanBarcode size={16} aria-hidden /> Démarrer le scan</>
          )}
        </button>
      )}

      {/* Empty state — shown only when not scanning and nothing scanned yet */}
      {!isScanning && items.length === 0 && (
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          className="py-10 text-center"
        >
          {emptyPlaceholder}
          <h2
            className="text-base font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Prêt à scanner
          </h2>
          <p
            className="text-sm max-w-xs mx-auto leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Scannez les codes-barres ISBN de vos mangas pour les ajouter en lot à votre collection.
          </p>
        </motion.div>
      )}

      {/* Scanned items list */}
      {items.length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          aria-label="Mangas scannés"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-semibold uppercase flex items-center gap-1.5"
              style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}
            >
              <CheckCircle2
                size={13}
                aria-hidden
                style={{ color: validCount > 0 ? 'var(--color-read)' : 'var(--muted-foreground)' }}
              />
              {items.length} scanné{items.length > 1 ? 's' : ''}
              {validCount < items.length && (
                <span style={{ color: 'var(--muted-foreground)' }}>
                  · {items.length - validCount} introuvable{items.length - validCount > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => setItems([])}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Tout effacer
            </button>
          </div>

          {/* List */}
          <div
            className="rounded-[calc(var(--radius)*2)] overflow-hidden px-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {items.map(item => (
              <ScannedItemRow
                key={item.isbn}
                item={item}
                onRemove={() => handleRemove(item.isbn)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Submit — ajouter en batch */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isOffline}
          className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" aria-hidden /> Envoi en cours…</>
          ) : isOffline ? (
            <><WifiOff size={16} aria-hidden /> Hors ligne</>
          ) : (
            <><Send size={16} aria-hidden /> Ajouter à ma collection ({items.length})</>
          )}
        </button>
      )}

      <ScanSuccessParticles ref={particlesRef} />
    </div>
  );
}
