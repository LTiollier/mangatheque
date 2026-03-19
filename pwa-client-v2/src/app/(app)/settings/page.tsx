import type { Metadata } from 'next';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'Paramètres — Mangastore',
};

export default function SettingsPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 pt-4 pb-6">
      <SettingsClient />
    </div>
  );
}
