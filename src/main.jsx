import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// 1. Enregistrement du Service Worker PWA (Workbox Cache)
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log('⚡ SW PWA enregistré avec succès:', r);
    },
    onRegisterError(error) {
      console.error('Erreur enregistrement SW PWA:', error);
    }
  });
}

// 2. Client React Query & Cache Persistant IndexedDB (Offline Engine)
import { QueryClient, MutationCache } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from './utils/persist';
import SmartSyncManager from './components/system/SmartSyncManager';
import AppSplashScreen from './components/ui/Feedback/AppSplashScreen';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (!navigator.onLine || error.message?.includes('Failed to fetch')) {
        window.dispatchEvent(
          new CustomEvent('nexus-toast', {
            detail: { type: 'error', message: "Action impossible : Vous êtes actuellement hors ligne" }
          })
        );
      }
    }
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 heures en cache IndexedDB
      staleTime: 1000 * 60 * 5,    // 5 minutes de fraîcheur
      retry: 1,
    },
  },
});

const persister = createIDBPersister();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => console.log('💾 Cache IndexedDB restauré avec succès')}
    >
      <SmartSyncManager />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
