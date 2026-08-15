import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Settings as SettingsIcon,
  Bell,
  Search,
  Zap,
  Leaf,
  WifiOff
} from 'lucide-react';
import clsx from 'clsx';
import { UI } from '../../designSystem';
import { useTranslation } from '../../hooks/useTranslation.jsx';
import { useTheme } from '../../hooks/useTheme';
import Button from '../ui/Primitives/Button';

import { useLocation, useNavigate } from 'react-router-dom';

export default function Header({ activePath: propActivePath, isScrolled, handleSmartBack }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const activePath = propActivePath || location.pathname;

  // --- LOGIQUE TITRE ---
  // État de connexion
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPageTitle = (pathname = '') => {
    if (!pathname || pathname === '/') return 'Tab 1 // Accueil';
    if (pathname.startsWith('/tab2')) return 'Tab 2';
    if (pathname.startsWith('/tab3')) return 'Tab 3';
    if (pathname.startsWith('/settings')) return 'Réglages';
    return 'Template';
  };

  const isDashboard = activePath === '/';
  const pageTitle = getPageTitle(activePath);
  const showBackArrow = !isDashboard;



  const onBackClick = () => {
    if (handleSmartBack) {
      handleSmartBack();
      return;
    }

    if (isDashboard) return;

    // Si nous sommes dans une sous-page d'un onglet (ex: /finance/detail)
    const pathSegments = activePath.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      // Remontée hiérarchique au niveau parent (ex: /finance/detail -> /finance)
      const parentPath = '/' + pathSegments.slice(0, -1).join('/');
      navigate(parentPath);
    } else {
      // Sinon (page racine d'onglet ou niveau 1), retour à la racine de l'app / historique
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <header
      className={`
        fixed left-0 right-0 z-40 transition-all pointer-events-none
        top-[env(safe-area-inset-top,4px)]
        md:${UI.layout.topMargin}
        ${UI.layout.headerOffset} 
        ${UI.layout.pagePadding}
      `}
    >
      <div
        className={`
          flex justify-between items-center pointer-events-auto
          rounded-[1.8rem] px-6 py-3 transition-all duration-500 ease-out
          max-w-screen-xl mx-auto w-full
          bg-white/[0.01] dark:bg-black/[0.08]
          backdrop-blur-[20px] saturate-[150%]
          border border-white/10 dark:border-white/[0.03]
          shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]
          ${isScrolled ? 'scale-[0.98]' : 'scale-100'}
        `}
      >
        {/* --- PARTIE GAUCHE : BOUTON DYNAMIQUE + TITRE --- */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-white 
              relative overflow-hidden active:scale-90 transition-all
              ${isDashboard ? 'cursor-default' : 'cursor-pointer'}
              bg-gradient-to-br from-indigo-500/90 to-violet-600/90
              shadow-[0_4px_12px_rgba(79,70,229,0.3)]
            `}
          >
            <AnimatePresence mode="wait">
              {showBackArrow ? (
                <motion.div
                  key="arrow"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-full h-full"
                >
                  <Zap size={20} fill="white" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* --- TITRE ANIMÉ --- */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={pageTitle}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'circOut' }}
                className="font-bold text-lg text-foreground tracking-tight block capitalize"
              >
                {pageTitle}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* DEMO BADGE */}
          {import.meta.env.VITE_APP_MODE === 'demo' && (
            <div className="hidden sm:flex ml-3 px-2 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-bold tracking-wider rounded border border-amber-500/30">
              DEMO (DONNÉES ÉPHÉMÈRES)
            </div>
          )}
        </div>

        {/* --- PARTIE DROITE : THEME & LANGUAGE --- */}
        <div className="flex items-center gap-3">
          {/* Offline Indicator */}
          {!isOnline && (
            <div className="flex items-center justify-center p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse" title={t('common.offline')}>
              <WifiOff size={18} />
            </div>
          )}

          {/* User Icon Profil */}
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 dark:border-white/[0.05] shadow-sm transform transition-transform hover:scale-105 active:scale-95 cursor-pointer">
            <img
              src="/user_icon.JPG"
              alt="Profil Utilisateur"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
