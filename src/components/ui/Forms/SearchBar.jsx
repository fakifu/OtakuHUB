import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI, ANIMATIONS } from '../../../designSystem';
import Button from '../Primitives/Button';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  isFocused = false,
  setIsFocused = () => { },
  children,
}) {
  const overlayInputRef = useRef(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value !== localValue && onChange) {
        onChange(localValue);
      }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [localValue]);

  // Note: Local scroll lock via CSS overscroll and touchmove prevention is used instead of useLockBodyScroll
  // to prevent iOS Safari from jumping when the underlying page height changes during search.

  useEffect(() => {
    if (isFocused) {
      setIsAnimating(true);
    }
  }, [isFocused]);

  // Focus auto en mode overlay (exécution immédiate dans le cycle de rendu pour le clavier iOS)
  useEffect(() => {
    if (isFocused) {
      if (overlayInputRef.current) overlayInputRef.current.focus();
    }
  }, [isFocused]);

  const handleClose = () => {
    setIsFocused(false);
    // On ne vide plus la recherche à la fermeture pour conserver la PWA persistance
  };

  // On utilise la nouvelle classe CSS standard : glass-panel
  // Cela garantit la cohérence entre PC, iOS, et les thèmes Light/Dark.
  const inputClasses = `w-full ${UI.cards.glass} py-3.5 pl-12 pr-12 text-sm text-foreground focus:outline-none shadow-sm`;

  return (
    <>
      {/* 1. TRIGGER (Statique dans la page) */}
      <div className="relative w-full h-[52px]">
        {/* On masque visuellement ce bloc quand on est focus, mais il garde sa place */}
        <div
          className={`absolute inset-0 group flex items-center gap-2 cursor-pointer transition-opacity duration-200 ${isFocused ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={() => setIsFocused(true)}
        >
          {/* L'élément Trigger - On supprime layoutId pour éviter les "sauts" entre les pages */}
          {!isFocused && (
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-4 flex items-center text-muted group-hover:text-accent transition-colors z-10">
                <Search size={18} />
              </div>
              <div className={inputClasses}>
                <span className={localValue ? 'text-foreground font-medium' : 'text-muted'}>
                  {localValue || placeholder}
                </span>
              </div>
              {localValue && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalValue('');
                    onChange('');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-foreground bg-surface/50 hover:bg-surface border border-transparent hover:border-border transition-all"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. OVERLAY IMMERSIF */}
      {createPortal(
        <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
          {isFocused && (
            <div data-modal-container className="fixed inset-0 z-[9990] flex flex-col pointer-events-auto">
              {/* Le fond semi-transparent occupe tout l'écran réel */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                style={{ willChange: "opacity" }}
                onClick={handleClose}
                onTouchMove={(e) => e.preventCancelable && e.preventDefault()}
              />

              {/* Conteneur principal - Gestion Safe Areas iOS */}
              <div
                className="relative flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pt-[calc(2rem+env(safe-area-inset-top,24px))] pointer-events-none"
                style={{ transform: "translateZ(0)" }}
              >

                {/* Header Barre de Recherche (Fixe en haut de l'overlay) */}
                <div className="shrink-0 pb-6 w-full pointer-events-auto">
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="relative group w-full"
                  >
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-accent z-10">
                      <Search size={18} />
                    </div>
                    <input
                      ref={overlayInputRef}
                      type="text"
                      inputMode="search"
                      value={localValue}
                      onChange={(e) => setLocalValue(e.target.value)}
                      placeholder={placeholder}
                      className={inputClasses}
                    />
                    <Button
                      onClick={handleClose}
                      variant="ghost"
                      isSquare
                      className="absolute inset-y-0 right-4 h-full !p-2 flex items-center bg-transparent border-none"
                      leftIcon={X}
                    />
                  </motion.div>
                </div>

                {/* Zone de Résultats - Simplified iOS rendering (no explicit mask to avoid CPU hit) */}
                <div className="relative flex-1 min-h-0 pointer-events-auto fade-out-bottom pb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, type: 'spring', damping: 25, stiffness: 300 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    style={{ willChange: "transform, opacity" }}
                    className="absolute inset-0 overflow-y-auto custom-scrollbar pt-2 pb-32 overscroll-contain"
                  >
                    <div className="space-y-4 px-1 pb-[calc(2.5rem+env(safe-area-inset-bottom,24px))]">
                      {children}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
