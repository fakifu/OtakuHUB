import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Primitives/Button';

export function Tab2MainPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="space-y-2 pt-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          Tab 2 // Page Principale
        </h1>
        <p className="text-muted text-sm">
          Ceci est la vue racine de l'Onglet 2. Cliquez ci-dessous pour entrer dans une sous-page profonde.
        </p>
      </div>

      <div className="glass-liquid p-6 rounded-card space-y-4">
        <h3 className="text-lg font-bold">Démonstration de Sous-Page & Smart Back</h3>
        <p className="text-xs text-muted">
          En entrant dans la sous-page ci-dessous, le bouton retour du Header vous ramènera précisément à la racine de cet onglet (`/tab2`).
        </p>
        <Link to="/tab2/detail">
          <Button variant="primary" size="md" rightIcon={ArrowRight}>
            Ouvrir la sous-page "/tab2/detail"
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function Tab2DetailPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="space-y-2 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
          Sous-page Profonde Niveau 2
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Sous-Page de Démonstration #1042
        </h1>
        <p className="text-muted text-sm">
          Chemin d'accès : <code className="bg-surface px-2 py-0.5 rounded text-accent font-mono text-xs">/tab2/detail</code>
        </p>
      </div>

      <div className="glass-liquid p-6 rounded-card space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-indigo-400" size={24} />
          <h3 className="text-base font-bold">Test du Smart Back</h3>
        </div>
        <p className="text-xs text-muted">
          Vous êtes actuellement sur une sous-page. Le bouton retour en haut à gauche (<ChevronLeft className="inline" size={16} />) exécutera une remontée intelligente vers <code className="text-foreground">/tab2</code>.
        </p>
      </div>
    </div>
  );
}
