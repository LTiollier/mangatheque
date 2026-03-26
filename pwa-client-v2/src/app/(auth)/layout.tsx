import { NekoLogoBounce } from '@/components/animations/NekoLogoBounce';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 safe-area-top safe-area-bottom">
        {/* Logo animé */}
        <div className="mb-4 flex flex-col items-center gap-1">
          <NekoLogoBounce />
          <span
            className="text-xl font-bold tracking-tight -mt-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Atsume
          </span>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-sm border p-6"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            borderRadius: 'calc(var(--radius) * 2)',
          }}
        >
          {children}
        </div>
    </div>
  );
}
