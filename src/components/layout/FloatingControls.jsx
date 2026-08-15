import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, RefreshCw, FlaskConical } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

export default function FloatingControls({ onNextAnime }) {
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isHomeOrTest = location.pathname === '/' || location.pathname === '/ui-test';

  return (
    <div className="fixed top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 z-[999] flex flex-col gap-2.5 items-center pointer-events-auto">
      {/* 1. Theme Switcher (Clair/Sombre) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all"
        title="Basculer Thème Clair/Sombre"
      >
        {theme === 'dark' ? (
          <Sun size={18} className="text-yellow-400" />
        ) : (
          <Moon size={18} className="text-indigo-600" />
        )}
      </button>

      {/* 2. Switcher Animé (Double Flèche) — visible uniquement si disponible */}
      {isHomeOrTest && onNextAnime && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNextAnime();
          }}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 active:rotate-180 transition-all"
          title="Changer d'animé à la une"
        >
          <RefreshCw size={18} className="text-cyan-400" />
        </button>
      )}

      {/* 3. Language Switcher (FR / EN) */}
      <button
        type="button"
        onClick={() => changeLanguage(language === 'fr' ? 'en' : 'fr')}
        className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all font-black text-xs"
        title="Switch Language (FR/EN)"
      >
        <span className="text-cyan-400 uppercase tracking-tighter font-extrabold">
          {language === 'fr' ? 'EN' : 'FR'}
        </span>
      </button>

      {/* 4. Accès Labo Test UI */}
      <button
        type="button"
        onClick={() => navigate(location.pathname === '/ui-test' ? '/' : '/ui-test')}
        className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all"
        title="Laboratoire de Test UI (5 Propositions)"
      >
        <FlaskConical size={18} className="text-purple-400" />
      </button>
    </div>
  );
}
