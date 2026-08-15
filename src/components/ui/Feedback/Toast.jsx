import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import Button from '../Primitives/Button';

const toastTypes = {
    success: {
        icon: CheckCircle,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
    },
    error: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
    },
    info: {
        icon: Info,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
    },
};

export default function Toast({ toast, onRemove }) {
    const { id, type, message, duration = 4000 } = toast;
    const style = toastTypes[type] || toastTypes.info;
    const Icon = style.icon;

    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`pointer-events-auto relative flex items-center gap-3 w-full max-w-sm p-4 rounded-[1.8rem] border backdrop-blur-md shadow-2xl ${style.bg} ${style.border}`}
        >
            <div className={`p-2 rounded-full bg-white/5 ${style.color}`}>
                <Icon size={20} />
            </div>
            <p className="flex-1 min-w-0 text-sm font-medium text-foreground/90 dark:text-white/90 leading-snug break-words">
                {message}
            </p>
            <Button
                onClick={() => onRemove(id)}
                variant="ghost"
                isSquare
                size="sm"
                className="text-foreground/40 dark:text-white/40 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                leftIcon={X}
            />
        </motion.div>
    );
}
