import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';

/**
 * MAPPING STANDARD : Table Supabase -> Clés de Query React Query.
 * À adapter pour chaque nouveau projet dans le fichier de configuration.
 */
const TABLE_TO_QUERY_KEY = {
    'items': [['items']],
    'settings': [['settings']],
};

/**
 * SmartSyncManager — Gestionnaire de synchronisation temps réel universel multi-appareils.
 * Écoute la table ultra-légère `sync_metadata` et invalide le cache React Query en direct.
 */
export default function SmartSyncManager() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        // Si Supabase n'est pas encore configuré dans le fichier .env (placeholder), on ne tente pas de connexion WebSocket
        if (!url || url.includes('placeholder')) {
            console.log("ℹ️ SmartSyncManager: Supabase non configuré (.env placeholder) — Mode hors-ligne local actif.");
            return;
        }

        const checkForMissedUpdates = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: remoteMetadata, error } = await supabase
                    .from('sync_metadata')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) return;

                remoteMetadata?.forEach(meta => {
                    const keys = TABLE_TO_QUERY_KEY[meta.table_name];
                    if (!keys) return;

                    const remoteUpdatedAt = new Date(meta.last_modified).getTime();

                    keys.forEach(queryKey => {
                        const state = queryClient.getQueryState(queryKey);
                        const localUpdatedAt = state?.dataUpdatedAt || 0;

                        if (localUpdatedAt > 0 && remoteUpdatedAt > localUpdatedAt) {
                            queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
                        }
                    });
                });
            } catch (err) {
                console.error("SmartSync: Echec check initial", err);
            }
        };

        checkForMissedUpdates();

        const handleOnline = () => {
            checkForMissedUpdates();
        };
        window.addEventListener('online', handleOnline);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForMissedUpdates();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const channelName = `smart-sync-channel-${Math.random().toString(36).substring(2, 9)}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'sync_metadata' },
                (payload) => handleRemoteChange(payload.new)
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'sync_metadata' },
                (payload) => handleRemoteChange(payload.new)
            )
            .subscribe();

        return () => {
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            supabase.removeChannel(channel);
        };
    }, []);

    const handleRemoteChange = (metadata) => {
        const targetKeys = TABLE_TO_QUERY_KEY[metadata.table_name];
        if (!targetKeys || targetKeys.length === 0) return;

        targetKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key, refetchType: 'all' });
        });
    };

    return null;
}
