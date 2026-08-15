import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Composant d'attente/chargement universel au démarrage de l'application.
 * S'affiche pendant la restauration du cache IndexedDB pour éviter le flash FOUC.
 */
export default function AppSplashScreen() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background text-foreground space-y-4">
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
