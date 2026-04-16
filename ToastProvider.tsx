import React, { createContext, useContext, useState } from 'react';

// Define the type for toast messages
type Toast = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
};

// Create a context for the ToastProvider
const ToastContext = createContext<{
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: number) => void;
} | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let nextId = 1;

    const addToast = (toast: Omit<Toast, 'id'>) => {
        setToasts((prevToasts) => [...prevToasts, { ...toast, id: nextId++ }]);
    };

    const removeToast = (id: number) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
