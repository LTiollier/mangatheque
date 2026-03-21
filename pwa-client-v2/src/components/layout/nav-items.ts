import { CalendarDays, Library, ScanLine, Search, User, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  isCTA?: true;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/planning',   icon: CalendarDays, label: 'Planning' },
  { href: '/collection', icon: Library,      label: 'Collection' },
  { href: '/scan',       icon: ScanLine,     label: 'Scanner', isCTA: true },
  { href: '/search',     icon: Search,       label: 'Recherche' },
  { href: '/settings',   icon: User,         label: 'Moi' },
];
