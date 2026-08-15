import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

// Permet au SW de prendre le contrôle immédiatement sans attendre un rechargement
self.skipWaiting();
clientsClaim();

// Pré-cache tous les assets générés par le build Vite
precacheAndRoute(self.__WB_MANIFEST || []);

// --- ÉCOUTE DES NOTIFICATIONS PUSH ---
self.addEventListener('push', (event) => {
    let pushData = {};

    try {
        // On essaie de parser le JSON envoyé par le backend Vercel
        if (event.data) {
            pushData = event.data.json();
        }
    } catch (err) {
        // Fallback si c'est du texte brut
        pushData = { title: 'Nouvelle notification', body: event.data ? event.data.text() : '' };
    }

    const title = pushData.title || 'NexusOS // Lucy';
    const options = {
        body: pushData.body || 'Vous avez un nouveau message.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        // La donnée qu'on passe à la notification pour savoir où aller au clic
        data: {
            url: pushData.url || '/'
        }
    };

    // Afficher la notification OS native
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// --- CLIC SUR LA NOTIFICATION ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    // Ouvre l'application ou focalise l'onglet s'il est déjà ouvert
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Cherche si un onglet est déjà sur la bonne URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Sinon, on ouvre une nouvelle fenêtre
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
