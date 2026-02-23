"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface AlertOptions {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => Promise<void> | void;
    destructive?: boolean;
}

interface AlertContextType {
    confirm: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<AlertOptions | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const confirm = (opts: AlertOptions) => {
        setOptions(opts);
        setIsOpen(true);
    };

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!options) return;

        setIsLoading(true);
        try {
            await options.onConfirm();
            setIsOpen(false);
        } catch (error) {
            console.error("Alert confirm action failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    return (
        <AlertContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={isOpen} onOpenChange={(open) => {
                if (!isLoading) setIsOpen(open);
            }}>
                <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            {options?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel} disabled={isLoading} className="bg-slate-800 text-white hover:bg-slate-700 hover:text-white border-slate-700">
                            {options?.cancelLabel || "Annuler"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={options?.destructive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {options?.confirmLabel || "Confirmer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AlertContext.Provider>
    );
};
