-- ==============================================================================
-- 🚀 STARTER KIT TEMPLATE — SCRIPT SQL INITIAL DE CONFIGURATION SUPABASE
-- ==============================================================================
-- Exécutez ce script dans l'Éditeur SQL de votre projet Supabase (SQL Editor).
-- Il crée les tables de base, la table metadata de synchronisation temps réel,
-- active les WebSockets Realtime et applique la sécurité RLS (Row Level Security).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE CRITIQUE : SYNCHRONISATION TEMPS RÉEL (SmartSyncManager)
CREATE TABLE IF NOT EXISTS public.sync_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sync_metadata_user_table_unique UNIQUE (user_id, table_name)
);

-- 3. TABLE STANDARD DE DÉMONSTRATION : ITEMS
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Général',
    amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE STANDARD DE CONFIGURATION : SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_preference TEXT DEFAULT 'auto',
    language TEXT DEFAULT 'fr',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT settings_user_unique UNIQUE (user_id)
);

-- 5. TRIGGER AUTOMATIQUE DE MISE À JOUR SYNC_METADATA (Realtime Signal)
CREATE OR REPLACE FUNCTION public.update_sync_metadata()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.sync_metadata (user_id, table_name, last_modified)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_TABLE_NAME,
        NOW()
    )
    ON CONFLICT (user_id, table_name) 
    DO UPDATE SET last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Application des Triggers sur les tables
DROP TRIGGER IF EXISTS trigger_sync_items ON public.items;
CREATE TRIGGER trigger_sync_items
AFTER INSERT OR UPDATE OR DELETE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.update_sync_metadata();

DROP TRIGGER IF EXISTS trigger_sync_settings ON public.settings;
CREATE TRIGGER trigger_sync_settings
AFTER INSERT OR UPDATE OR DELETE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_sync_metadata();

-- 6. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Chaque utilisateur n'accède QU'À SES PROPRES DONNÉES)
CREATE POLICY "Utilisateur gère ses propres metadata sync" ON public.sync_metadata FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur gère ses propres items" ON public.items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur gère ses propres settings" ON public.settings FOR ALL USING (auth.uid() = user_id);

-- 7. ACTIVATION DES WEBSOCKETS REALTIME SUR SYNC_METADATA
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_metadata;

-- ==============================================================================
-- ✅ SUPABASE PRÊT POUR VOTRE APPLI DE TEMPLATE !
-- ==============================================================================
