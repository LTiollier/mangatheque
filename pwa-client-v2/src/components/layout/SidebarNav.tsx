'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import { tapVariants } from '@/lib/motion';
import { NAV_ITEMS } from './nav-items';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-64 z-40"
      style={{
        background: 'var(--sidebar-background)',
        borderRight: '1px solid var(--sidebar-border)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div
          className="flex items-center justify-center w-8 h-8 rounded text-xs font-bold"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-display)',
          }}
        >
          MS
        </div>
        <span
          className="text-sm font-semibold tracking-wide"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--sidebar-foreground)' }}
        >
          Mangastore
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 mt-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isCTA = !!item.isCTA;

          return (
            <motion.div key={item.href} variants={tapVariants} whileTap="tap">
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded transition-colors"
                style={{
                  background: isActive
                    ? 'color-mix(in oklch, var(--primary) 12%, transparent)'
                    : isCTA
                    ? 'color-mix(in oklch, var(--primary) 8%, transparent)'
                    : 'transparent',
                  color: isActive || isCTA ? 'var(--primary)' : 'var(--sidebar-foreground)',
                  borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} />
                <span
                  className="text-sm font-medium"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
