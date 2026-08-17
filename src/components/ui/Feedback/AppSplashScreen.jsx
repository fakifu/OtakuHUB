import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Composant d'attente/chargement universel au démarrage de l'application.
 * S'affiche pendant la restauration du cache IndexedDB pour éviter le flash FOUC.
 */
export default function AppSplashScreen() {
  useEffect(() => {
    // Verrouillage strict du scroll pendant le chargement
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';

    const preventScroll = (e) => e.preventDefault();
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      document.documentElement.style.overflow = '';
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('wheel', preventScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none touch-none z-[99999] flex flex-col items-center justify-center bg-background text-foreground space-y-4 select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-accent/20 animate-ping absolute" />
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-muted">
        Chargement des données...
      </span>
    </div>
  );
}
