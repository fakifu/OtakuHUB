import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/ui/Feedback/Toast';

const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message, duration = 4000) => {
        const id = Date.now().toString();
        setToasts((prev) => {
            const next = [...prev, { id, type, message, duration }];
            return next.length > 3 ? next.slice(next.length - 3) : next;
        });
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((msg, duration) => {
        addToast('success', msg, duration);
    }, [addToast]);

    const error = useCallback((msg, duration) => {
        addToast('error', msg, duration);
    }, [addToast]);

    const info = useCallback((msg, duration) => addToast('info', msg, duration), [addToast]);

    // Global listener to allow pushing toasts from outside React (e.g. from react-query global cache)
    useEffect(() => {
        const handleGlobalToast = (e) => {
            const { type, message, duration } = e.detail;
            addToast(type || 'info', message, duration);
        };
        window.addEventListener('app-toast', handleGlobalToast);
        return () => window.removeEventListener('app-toast', handleGlobalToast);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, success, error, info }}>
            {children}
            {createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 99999,
                        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)',
                        pointerEvents: 'none',
                        touchAction: 'none',
                        overscrollBehavior: 'none',
                        width: 'min(100vw, 420px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            width: '100%',
                            padding: '0 16px',
                            pointerEvents: 'none',
                            touchAction: 'none',
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {toasts.map((toast) => (
                                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
