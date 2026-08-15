import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../Primitives/Button';

// 👇 1. On importe ton Hook existant
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const VARIANTS = {
  center: {
    overlay: 'items-center justify-center p-4',
    content: 'w-full max-w-md rounded-card',
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 10 },
  },
  bottom: {
    overlay: 'items-end justify-center',
    content: 'w-full max-w-lg rounded-t-[2.5rem] relative pb-[env(safe-area-inset-bottom,1rem)]',
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  alert: {
    overlay: 'items-center justify-center p-6',
    content: 'w-full max-w-xs rounded-[2rem] text-center',
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  type = 'center',
  icon: Icon,
  footer,
}) {
  const [mounted, setMounted] = useState(false);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const style = VARIANTS[type] || VARIANTS.center;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div data-modal-container className="fixed inset-0 z-[10000] flex flex-col overflow-hidden pointer-events-none">
          {/* Static blur on enter to avoid thrashing, fades out on exit to avoid popping. Reduced blur amount for 120Hz mobile performance */}
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm pointer-events-none"
            style={{ willChange: "opacity" }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 pointer-events-auto cursor-default"
          />

          <div className={`relative flex w-full h-full pointer-events-none ${style.overlay}`}>
            <motion.div
              initial={style.initial}
              animate={style.animate}
              exit={style.exit}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
              style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
              className={`${style.content} ${type === 'alert' ? 'glass-panel !border-none' : 'glass-panel-radiant'} shadow-2xl flex flex-col max-h-[85vh] relative pointer-events-auto overflow-hidden border-none ring-0`}
            >
              {/* HEADER (Restored to original non-floated flow) */}
              {type !== 'alert' && (
                <div className="flex items-center justify-between px-6 py-4 shrink-0">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {Icon && <Icon size={18} className="text-accent" />}
                    {title}
                  </h3>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    isSquare
                    className="bg-surface/10 border-border hover:bg-surface/10"
                    leftIcon={X}
                  />
                </div>
              )}

              {/* SCROLLABLE BODY */}
              <div
                className={`flex-1 overflow-y-auto custom-scrollbar relative px-4 sm:px-6 ${type !== 'alert' ? 'pt-4' : 'p-6'
                  } ${footer
                    ? (type === 'bottom' ? 'pb-[calc(4.7rem+env(safe-area-inset-bottom,0px))] sm:pb-28' : 'pb-24')
                    : (type === 'bottom' ? 'pb-[env(safe-area-inset-bottom,0px)]' : 'pb-2')}`}
              >
                {children}
              </div>

              {/* TIGHT GRADIENT FOOTER (Safe-area aware + PC adjustments) */}
              {footer && (
                <>
                  {type !== 'alert' && (
                    <div className={`absolute bottom-0 left-0 right-0 z-20 pointer-events-none bg-gradient-to-t from-background to-transparent ${type === 'bottom' ? 'h-[calc(4.7rem+env(safe-area-inset-bottom,0px))] sm:h-28' : 'h-24'}`} />
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 z-30 p-6 ${type === 'bottom' ? 'pb-[env(safe-area-inset-bottom,0px)] sm:pb-6' : 'pb-6'}`}>
                    {footer}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
