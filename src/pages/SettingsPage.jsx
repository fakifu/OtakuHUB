import React from 'react';
import { 
  Palette, 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  ShieldCheck, 
  Bell, 
  Download,
  Sliders
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation.jsx';
import Switch from '../components/ui/Forms/Switch';

export default function SettingsPage() {
  const { themePref, setTheme } = useTheme();
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Sliders className="text-accent" size={32} />
          Réglages
        </h1>
        <p className="text-muted text-sm">
          Personnalisez le comportement et l'apparence de votre application.
        </p>
      </div>

      {/* Section Apparence & Thème */}
      <div className="glass-liquid p-6 rounded-card space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Palette className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-base font-bold">Apparence & Thème</h2>
            <p className="text-xs text-muted">Ajustez le mode visuel Liquid Glass (sRGB & Display-P3).</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block">Mode d'affichage</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                themePref === 'dark'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg'
                  : 'bg-surface/50 border-border text-muted hover:text-foreground'
              }`}
            >
              <Moon size={22} />
              <span className="text-xs font-bold">Sombre</span>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                themePref === 'light'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg'
                  : 'bg-surface/50 border-border text-muted hover:text-foreground'
              }`}
            >
              <Sun size={22} />
              <span className="text-xs font-bold">Clair</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                themePref === 'system'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-lg'
                  : 'bg-surface/50 border-border text-muted hover:text-foreground'
              }`}
            >
              <Monitor size={22} />
              <span className="text-xs font-bold">Système</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Langue */}
      <div className="glass-liquid p-6 rounded-card space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Globe className="text-emerald-400" size={24} />
          <div>
            <h2 className="text-base font-bold">Langue & Région</h2>
            <p className="text-xs text-muted">Choisissez la langue d'affichage de l'interface.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Langue de l'application</span>
          <div className="w-48">
            <Switch
              size="sm"
              color="foreground"
              options={[
                { label: 'Français', value: 'fr' },
                { label: 'English', value: 'en' },
              ]}
              value={language || 'fr'}
              onChange={(val) => changeLanguage && changeLanguage(val)}
            />
          </div>
        </div>
      </div>

      {/* Section Système & Sécurité */}
      <div className="glass-liquid p-6 rounded-card space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <ShieldCheck className="text-sky-400" size={24} />
          <div>
            <h2 className="text-base font-bold">Système & Informations</h2>
            <p className="text-xs text-muted">Version du template et status PWA.</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Version du Template</span>
          <span className="font-mono font-bold text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20">
            v1.0.0 // Liquid Glass
          </span>
        </div>
      </div>
    </div>
  );
}
