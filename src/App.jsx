import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider } from './context/NavigationContext';
import { ToastProvider } from './context/ToastContext';
import { AuroraProvider } from './context/AuroraContext';
import { LanguageProvider } from './hooks/useTranslation.jsx';
import { LibraryProvider } from './context/LibraryContext';

import { AuthProvider } from './context/AuthContext';

// Layout Master
import MainLayout from './components/layout/Layout';

// Pages OtakuHub
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <NavigationProvider>
            <ToastProvider>
              <AuroraProvider>
                <LibraryProvider>
                  <Routes>
                    <Route element={<MainLayout />}>
                      {/* OtakuHub — 3 onglets principaux */}
                      <Route path="/"         element={<DashboardPage />} />
                      <Route path="/search"   element={<SearchPage />} />
                      <Route path="/library"  element={<LibraryPage />} />
                      <Route path="/anime/:id" element={<AnimeDetailPage />} />
                      <Route path="/settings" element={<SettingsPage />} />

                      {/* Catch-all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </LibraryProvider>
              </AuroraProvider>
            </ToastProvider>
          </NavigationProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
