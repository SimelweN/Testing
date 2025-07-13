
-- Create ENUM types for broadcast properties if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_type') THEN
        CREATE TYPE public.broadcast_type AS ENUM ('info', 'warning', 'success', 'error');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_priority') THEN
        CREATE TYPE public.broadcast_priority AS ENUM ('low', 'normal', 'medium', 'high', 'urgent'); -- Added 'normal', 'urgent', 'medium'
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_target_audience') THEN
        CREATE TYPE public.broadcast_target_audience AS ENUM ('all', 'users', 'admin');
    END IF;
END$$;

-- Create the broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type public.broadcast_type NOT NULL DEFAULT 'info',
    priority public.broadcast_priority NOT NULL DEFAULT 'normal',
    target_audience public.broadcast_target_audience DEFAULT 'all',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Add RLS policies for the broadcasts table
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active broadcasts that are not expired and match target audience
CREATE POLICY "Allow public read access to active, non-expired broadcasts"
ON public.broadcasts
FOR SELECT
USING (
    active = TRUE AND
    (expires_at IS NULL OR expires_at > now()) AND
    (
        target_audience = 'all' OR
        (target_audience = 'users' AND auth.role() = 'authenticated') OR
        (target_audience = 'admin' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)) -- Assuming is_admin in profiles
    )
);

-- Allow admin users to manage all broadcasts
CREATE POLICY "Allow admin full access"
ON public.broadcasts
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Create an index for faster querying of active broadcasts
CREATE INDEX IF NOT EXISTS idx_active_broadcasts ON public.broadcasts (active, expires_at, priority, created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_broadcasts_updated_at' AND tgrelid = 'public.broadcasts'::regclass
    ) THEN
        CREATE TRIGGER set_broadcasts_updated_at
        BEFORE UPDATE ON public.broadcasts
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_set_timestamp();
    END IF;
END$$;

