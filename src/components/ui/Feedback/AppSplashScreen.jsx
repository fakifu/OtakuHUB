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
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none touch-none z-[99999] flex flex-col items-center justify-center bg-[#0B0C10] text-foreground space-y-6 select-none">
      <div className="relative flex items-center justify-center">
        {/* Halo lumineux indigo */}
        <div className="w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl animate-pulse absolute" />
        
        {/* Logo transparent OtakuHUB */}
        <img
          src="/logo-transparent.png"
          alt="OtakuHUB Logo"
          className="w-24 h-24 object-contain relative z-10 animate-pulse drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]"
        />
      </div>

      <div className="flex flex-col items-center space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-white/90">
            OtakuHUB
          </span>
        </div>
        <span className="text-[10px] font-semibold tracking-wider text-muted/60">
          Chargement de votre bibliothèque...
        </span>
      </div>
    </div>
  );
}
