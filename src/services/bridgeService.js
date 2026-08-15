import { supabase } from './supabaseClient';

/**
 * Service centralisé d'opérations atomiques (Ponts entre modules).
 * Garantit qu'en cas d'échec de la 2ème écriture, la 1ère est automatiquement annulée (Rollback).
 */
export const BridgeService = {
    async createLinkedOperation({ userId, primaryData, secondaryData, primaryTable, secondaryTable }) {
        if (!userId) throw new Error('UserId manquant pour BridgeService');

        const linkId = window.crypto.randomUUID();
        const nowIso = new Date().toISOString();

        const op1 = { ...primaryData, user_id: userId, link_id: linkId, created_at: nowIso };
        const op2 = { ...secondaryData, user_id: userId, link_id: linkId, created_at: nowIso };

        const [res1, res2] = await Promise.all([
            supabase.from(primaryTable).insert([op1]).select().single(),
            supabase.from(secondaryTable).insert([op2]).select().single()
        ]);

        if (res1.error) {
            if (!res2.error && res2.data) {
                await supabase.from(secondaryTable).delete().eq('id', res2.data.id);
            }
            throw res1.error;
        }

        if (res2.error) {
            if (!res1.error && res1.data) {
                await supabase.from(primaryTable).delete().eq('id', res1.data.id);
            }
            throw res2.error;
        }

        return { primary: res1.data, secondary: res2.data, linkId };
    }
};
