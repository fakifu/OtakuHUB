import { get, set, del } from 'idb-keyval';

/**
 * Persister personnalisé pour React Query utilisant IndexedDB via idb-keyval.
 * Plus performant que localStorage pour les volumineux objets JSON.
 */
export function createIDBPersister(idbValidKey = "reactQuery_starter_kit") {
    return {
        persistClient: async (client) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    };
}
