import type { Metadata } from 'next';
import { PlanningClient } from './PlanningClient';

export const metadata: Metadata = {
    title: 'Planning — Mangastore',
};

export default function PlanningPage() {
    return <PlanningClient />;
}
