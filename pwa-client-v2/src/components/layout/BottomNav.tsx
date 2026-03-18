'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { tapVariants } from '@/lib/motion';
import { NAV_ITEMS } from './nav-items';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        background: 'var(--sidebar-background)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid color-mix(in oklch, var(--border) 40%, transparent)',
      }}
    >
      <div
        className="flex items-center justify-around h-16 px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          if (item.isCTA) {
            return (
              <motion.div key={item.href} variants={tapVariants} whileTap="tap">
                <Link
                  href={item.href}
                  className="flex items-center justify-center w-[52px] h-[52px] rounded-full -translate-y-2"
                  style={{
                    background: 'var(--primary)',
                    boxShadow:
                      '0 4px 16px color-mix(in oklch, var(--primary) 40%, transparent)',
                  }}
                  aria-label="Scanner"
                >
                  <Icon size={24} color="var(--primary-foreground)" />
                </Link>
              </motion.div>
            );
          }

          return (
            <motion.div key={item.href} variants={tapVariants} whileTap="tap">
              <Link
                href={item.href}
                className="flex flex-col items-center gap-[3px] min-w-[48px] py-1"
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={22}
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  }}
                >
                  {item.label}
                </span>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      className="block w-1 h-1 rounded-full"
                      style={{ background: 'var(--primary)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
