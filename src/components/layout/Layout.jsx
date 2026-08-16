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

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const [isScrolled, setIsScrolled] = useState(false);
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

      {/* Bottom Navigation — 3 onglets OtakuHub */}
      <BottomNav3Tabs />
    </div>
  );
}
