-- ==============================================================================
-- 🎌 OTAKUHUB INTEGRATION DANS NEXUSOS SUPABASE (100% AUTO-CONTENU)
-- ==============================================================================

-- 1. EXTENSION UUID (au cas où)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE CRITIQUE : SYNCHRONISATION (SmartSyncManager)
CREATE TABLE IF NOT EXISTS public.sync_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sync_metadata_user_table_unique UNIQUE (user_id, table_name)
);

ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sync_metadata_user_policy" ON public.sync_metadata;
CREATE POLICY "sync_metadata_user_policy" ON public.sync_metadata FOR ALL USING (auth.uid() = user_id);

-- 3. FONCTION DE MISE À JOUR SYNC_METADATA
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

-- 4. CRÉATION DE LA TABLE OTAKUHUB_LIBRARY
CREATE TABLE IF NOT EXISTS public.otakuhub_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anime_id BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PLAN_TO_WATCH',
    episodes_watched INTEGER NOT NULL DEFAULT 0,
    total_episodes INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(4, 1) DEFAULT 0,
    notes TEXT DEFAULT '',
    anime_data JSONB DEFAULT '{}'::jsonb,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT otakuhub_library_user_anime_unique UNIQUE (user_id, anime_id)
);

-- 5. INDEX DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_otakuhub_library_user_id ON public.otakuhub_library(user_id);
CREATE INDEX IF NOT EXISTS idx_otakuhub_library_anime_id ON public.otakuhub_library(anime_id);
CREATE INDEX IF NOT EXISTS idx_otakuhub_library_status ON public.otakuhub_library(status);

-- 6. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.otakuhub_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own otakuhub library" ON public.otakuhub_library;
CREATE POLICY "Users can manage their own otakuhub library"
ON public.otakuhub_library
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. FONCTION & TRIGGER POUR UPDATED_AT
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_otakuhub_updated_at ON public.otakuhub_library;
CREATE TRIGGER trigger_otakuhub_updated_at
BEFORE UPDATE ON public.otakuhub_library
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 8. TRIGGER POUR SYNCHRONISATION MULTI-DEVICE
DROP TRIGGER IF EXISTS trigger_sync_otakuhub_library ON public.otakuhub_library;
CREATE TRIGGER trigger_sync_otakuhub_library
AFTER INSERT OR UPDATE OR DELETE ON public.otakuhub_library
FOR EACH ROW EXECUTE FUNCTION public.update_sync_metadata();

-- 9. PUBLICATION REALTIME
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'otakuhub_library'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.otakuhub_library;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'sync_metadata'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_metadata;
    END IF;
END $$;
