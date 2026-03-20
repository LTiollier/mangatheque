'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Camera, Loader2 } from 'lucide-react';

// ─── Scan frame corners — hoisted at module level (rendering-hoist-jsx) ────────

const scanCorners = (
  <>
    <div
      className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] rounded-tl"
      style={{ borderColor: 'var(--primary)' }}
    />
    <div
      className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] rounded-tr"
      style={{ borderColor: 'var(--primary)' }}
    />
    <div
      className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] rounded-bl"
      style={{ borderColor: 'var(--primary)' }}
    />
    <div
      className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] rounded-br"
      style={{ borderColor: 'var(--primary)' }}
    />
  </>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

// ─── BarcodeScanner (default export for next/dynamic) ────────────────────────

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  // Always keep the latest callback without re-initializing the scanner
  // (advanced-event-handler-refs + rerender-use-ref-transient-values)
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Ref for cooldown — avoids re-initializing scanner on each scan (rerender-use-ref-transient-values)
  const lastScanRef = useRef<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const READER_ID = 'void-barcode-reader';

    async function initScanner() {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!cameras?.length) {
          setError("Aucune caméra trouvée sur l'appareil.");
          return;
        }

        const scanner = new Html5Qrcode(READER_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
          ],
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 150 } },
          (decoded) => {
            if (decoded.length !== 13) return;
            if (decoded === lastScanRef.current) return;

            lastScanRef.current = decoded;
            navigator.vibrate?.(50);
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 300);
            onScanRef.current(decoded);
            // Cooldown: reset after 2 s to allow re-scanning same barcode
            setTimeout(() => { lastScanRef.current = ''; }, 2000);
          },
          () => {},
        );

        if (isMounted) setIsLoading(false);
      } catch {
        if (isMounted) setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    }

    // Small delay to ensure the DOM element is mounted before html5-qrcode reads it
    const timerId = setTimeout(() => {
      if (document.getElementById(READER_ID)) initScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      const scanner = scannerRef.current;
      if (scanner) {
        (scanner.isScanning ? scanner.stop() : Promise.resolve())
          .then(() => scanner.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []); // empty deps — init once, cleanup on unmount (advanced-init-once)

  return (
    <div
      className="relative w-full overflow-hidden rounded-[calc(var(--radius)*3)] bg-black"
      style={{ aspectRatio: '4/3' }}
      role="region"
      aria-label="Caméra scanner"
    >
      {/* html5-qrcode target — video fills the container.
          html5-qrcode injects `position: relative` as an inline style on this div,
          which would override Tailwind's `absolute inset-0` classes.
          We counter this by using inline styles (same specificity) to force
          position:absolute and explicit dimensions. */}
      <style>{`
        #void-barcode-reader {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        #void-barcode-reader video {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #void-barcode-reader canvas,
        #void-barcode-reader a,
        #void-barcode-reader img {
          display: none !important;
        }
      `}</style>
      <div id="void-barcode-reader" />

      {/* Loading overlay */}
      {isLoading && !error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
          style={{ background: 'var(--background)' }}
        >
          <Camera size={40} aria-hidden style={{ color: 'var(--muted-foreground)' }} />
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Loader2 size={12} className="animate-spin" aria-hidden />
            Initialisation caméra…
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10"
          style={{ background: 'var(--background)' }}
        >
          <AlertCircle size={36} aria-hidden style={{ color: 'var(--destructive)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Scan overlay — shown once camera is ready */}
      {!isLoading && !error && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Dark vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at center, transparent 0%, oklch(0% 0 0 / 0.65) 100%)',
            }}
          />

          {/* Scan target frame */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[260px] h-[150px]">
              {scanCorners}
              {/* Animated scan line — motion.ts rapport spec: 2s ease-in-out infini */}
              <motion.div
                className="absolute left-3 right-3 h-[2px] rounded-full"
                style={{
                  background: 'var(--primary)',
                  boxShadow: '0 0 10px var(--primary)',
                }}
                animate={{ top: ['8%', '88%', '8%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {/* Hint label */}
          <p
            className="absolute bottom-4 left-0 right-0 text-center text-[11px] font-medium"
            style={{ color: 'oklch(100% 0 0 / 0.5)' }}
          >
            Ciblez le code-barres ISBN au dos du manga
          </p>
        </div>
      )}

      {/* Flash feedback on successful scan */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            key="flash"
            className="absolute inset-0 z-30 pointer-events-none"
            style={{ background: 'var(--primary)' }}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
