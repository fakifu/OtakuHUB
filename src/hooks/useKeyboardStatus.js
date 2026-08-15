import { useState, useEffect } from 'react';

/**
 * Hook de détection de l'ouverture du clavier mobile (iOS / Android).
 * Permet d'adapter l'interface (ex: masquer automatiquement la BottomNav).
 */
export default function useKeyboardStatus() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (e) => {
      const isTextInput =
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') &&
        !['checkbox', 'radio', 'submit', 'button', 'file'].includes(e.target.type);

      if (isTextInput) {
        setIsOpen(true);
      }
    };

    const handleBlur = () => {
      setIsOpen(false);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return isOpen;
}
