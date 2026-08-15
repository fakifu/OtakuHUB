import React, { useState } from 'react';
import { useLocation, useOutlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigation } from '../../context/NavigationContext';

import BottomNav3Tabs from './BottomNav3Tabs';
import AuroraBackground from './AuroraBackground';
import ScrollablePage from './ScrollablePage';

import DashboardPage from '../../pages/DashboardPage';
import SearchPage from '../../pages/SearchPage';
import LibraryPage from '../../pages/LibraryPage';

import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { Sun, Moon, FlaskConical, User } from 'lucide-react';
import AuthModal from '../auth/AuthModal';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage, t } = useTranslation();

  const PAGE_TITLES = {
    '/': null,
    '/search': null,
    '/library': null,
    '/ui-test': t('header.ui_test'),
  };

  const pageTitle = PAGE_TITLES[location.pathname];
  const isMainTab = ['/', '/search', '/library'].includes(location.pathname);

  return (
    <div className="h-screen w-screen overflow-hidden text-foreground font-sans flex flex-col relative transition-colors duration-300">
      <AuroraBackground />

      {/* Bouton 1: Theme Switcher (Clair/Sombre) — top: 1rem */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 z-[999] w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all"
        title="Basculer Thème Clair/Sombre"
      >
        {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
      </button>

      {/* Bouton 2: Language Switcher (FR / EN) — top: 7rem */}
      <button
        type="button"
        onClick={() => changeLanguage(language === 'fr' ? 'en' : 'fr')}
        className="fixed top-[calc(7rem+env(safe-area-inset-top,0px))] right-4 z-[999] w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all font-black text-xs"
        title="Switch Language (FR/EN)"
      >
        <span className="text-cyan-400 uppercase tracking-tighter font-extrabold">{language === 'fr' ? 'EN' : 'FR'}</span>
      </button>

      {/* Bouton 3: Accès Labo Test UI — top: 10rem */}
      <button
        type="button"
        onClick={() => navigate(location.pathname === '/ui-test' ? '/' : '/ui-test')}
        className="fixed top-[calc(10rem+env(safe-area-inset-top,0px))] right-4 z-[999] w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all"
        title="Laboratoire de Test UI (5 Propositions)"
      >
        <FlaskConical size={18} className="text-purple-400" />
      </button>

      {/* Header contextuel minimal */}
      {pageTitle && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-0 left-0 right-0 z-30 flex items-end px-5 transition-all duration-300 ${
            isScrolled
              ? 'bg-background/80 backdrop-blur-xl border-b border-border/40 h-[calc(3.5rem+env(safe-area-inset-top,0px))]'
              : 'bg-transparent h-[calc(3.5rem+env(safe-area-inset-top,0px))]'
          }`}
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <h1 className="text-xl font-black text-foreground pb-3">{pageTitle}</h1>
        </motion.header>
      )}

      {/* Zone de contenu principale — Rémanence Keep-Alive sur les 3 onglets */}
      <main className="flex-1 w-full h-full relative grid grid-cols-1 grid-rows-1 overflow-hidden z-10">
        {/* Onglet 1: Dashboard */}
        <div className={`col-start-1 row-start-1 w-full h-full ${location.pathname === '/' ? 'block' : 'hidden'}`}>
          <ScrollablePage onScrollChange={location.pathname === '/' ? setIsScrolled : undefined}>
            <DashboardPage />
          </ScrollablePage>
        </div>

        {/* Onglet 2: Search */}
        <div className={`col-start-1 row-start-1 w-full h-full ${location.pathname === '/search' ? 'block' : 'hidden'}`}>
          <ScrollablePage onScrollChange={location.pathname === '/search' ? setIsScrolled : undefined}>
            <SearchPage />
          </ScrollablePage>
        </div>

        {/* Onglet 3: Library */}
        <div className={`col-start-1 row-start-1 w-full h-full ${location.pathname === '/library' ? 'block' : 'hidden'}`}>
          <ScrollablePage onScrollChange={location.pathname === '/library' ? setIsScrolled : undefined}>
            <LibraryPage />
          </ScrollablePage>
        </div>

        {/* Routes secondaires (ex: /ui-test) */}
        {!isMainTab && (
          <div className="col-start-1 row-start-1 w-full h-full block">
            <ScrollablePage
              onScrollChange={setIsScrolled}
              className={pageTitle ? 'pt-[calc(3.5rem+env(safe-area-inset-top,0px))]' : ''}
            >
              {outlet}
            </ScrollablePage>
          </div>
        )}
      </main>

      {/* Bouton 4: Mon Compte / Connexion Cloud — top: 13rem */}
      <button
        type="button"
        onClick={() => setIsAuthOpen(true)}
        className="fixed top-[calc(13rem+env(safe-area-inset-top,0px))] right-4 z-[999] w-10 h-10 rounded-full glass-panel flex items-center justify-center text-foreground hover:text-accent shadow-xl border border-white/20 active:scale-95 transition-all"
        title="Mon Compte Cloud & Synchronisation"
      >
        <User size={18} className="text-accent" />
      </button>

      {/* Modale d'authentification Supabase */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Bottom Navigation — 3 onglets OtakuHub */}
      <BottomNav3Tabs />
    </div>
  );
}
