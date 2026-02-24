"use client";

import React from "react";

interface EmptyStateProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl text-center space-y-4">
            <div className="p-4 bg-slate-900 rounded-2xl">
                {icon}
            </div>
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-200">{title}</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">{description}</p>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
