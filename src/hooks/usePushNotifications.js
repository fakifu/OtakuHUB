import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// L'API PushManager nécessite que la clé VAPID soit convertie en Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const usePushNotifications = () => {
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if ('Notification' in window) setPermission(Notification.permission);
    }, []);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('API Push non supportée - Installez la PWA sur l\'écran d\'accueil.');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    }, []);

    const subscribe = useCallback(async (serviceWorkerReg, vapidKey) => {
        if (permission !== 'granted') return null;

        try {
            console.log("1. Récupération de l'abonnement avec la clé VAPID convertible");
            const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

            const subscription = await serviceWorkerReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            console.log("2. Abonnement obtenu côté navigateur:", subscription.toJSON());

            // Sauvegarde dans Supabase
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    console.error("3. Utilisateur non authentifié, annulation de la sauvegarde:", authError);
                    return subscription;
                }

                console.log("3. Utilisateur trouvé, tentative d'insertion pour l'ID:", user.id);
                // On retire temporairement le onConflict pour tester l'insertion brute
                const { error } = await supabase
                    .from('push_subscriptions')
                    .insert([{
                        user_id: user.id,
                        subscription: subscription.toJSON(), // Convertir l'objet en JSON
                        updated_at: new Date().toISOString()
                    }]);

                if (error) {
                    console.error("4. ERREUR lors de l'insertion Supabase:", error);
                } else {
                    console.log("4. SUCCÈS - Abonnement sauvegardé dans Supabase !");
                }
            } catch (dbErr) {
                console.error("4. ERREUR CATCH Supabase:", dbErr);
            }

            return subscription;
        } catch (err) {
            console.error('Échec global de la souscription Web Push:', err);
            return null;
        }
    }, [permission]);

    return { permission, requestPermission, subscribe };
};
