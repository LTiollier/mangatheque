'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user.service';

import { tabContentVariants } from '@/lib/motion';
import { LibraryTab } from './tabs/LibraryTab';
import { LoansTab } from './tabs/LoansTab';
import { WishlistTab } from './tabs/WishlistTab';
import { ReadingTab } from './tabs/ReadingTab';
import { CompletionTab } from './tabs/CompletionTab';

// Hoisted — never recreated (rendering-hoist-jsx + js-index-maps)
const TABS = [
  { id: 'library',    label: 'Bibliothèque' },
  { id: 'loans',      label: 'Prêts'        },
  { id: 'wishlist',   label: 'Envies'       },
  { id: 'read',       label: 'Lu'           },
  { id: 'completion', label: 'Compléter'    },
] as const;

type TabId = typeof TABS[number]['id'];

// Set for O(1) validation (js-set-map-lookups)
const VALID_TABS = new Set<string>(TABS.map(t => t.id));
function isValidTab(s: string): s is TabId { return VALID_TABS.has(s); }

interface CollectionHubProps {
  defaultTab: string;
}

export function CollectionHub({ defaultTab }: CollectionHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>(
    isValidTab(defaultTab) ? defaultTab : 'library',
  );

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email vérifié avec succès !');
      userService.getCurrentUser().then(updatedUser => {
        updateUser(updatedUser);
      }).catch(console.error);
      router.replace('/collection', { scroll: false });
    }
  }, [searchParams, router, updateUser]);

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    // Sync URL without navigation — back button works, deep-linking supported
    router.replace(`/collection?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="flex flex-col">
      {/* Tab bar — sticky below safe-area/notch */}
      <div
        className="sticky z-10"
        style={{
          top: 0,
          paddingTop: 'env(safe-area-inset-top)',
          background: 'var(--background)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          role="tablist"
          aria-label="Sections de la collection"
          className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden px-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                type="button"
                onClick={() => switchTab(tab.id)}
                className="relative flex-1 py-3 text-sm font-medium whitespace-nowrap transition-colors min-w-[80px] text-center"
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {tab.label}
                {isActive && (
                  // Animated indicator shared across tabs via layoutId
                  <motion.div
                    layoutId="collection-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: 'var(--primary)' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content — animated fade (tabContentVariants: 150ms/100ms) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-label={TABS.find(t => t.id === activeTab)?.label}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={tabContentVariants}
          className="px-4 pt-5 pb-4"
        >
          {activeTab === 'library'    && <LibraryTab />}
          {activeTab === 'loans'      && <LoansTab />}
          {activeTab === 'wishlist'   && <WishlistTab />}
          {activeTab === 'read'       && <ReadingTab />}
          {activeTab === 'completion' && <CompletionTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
