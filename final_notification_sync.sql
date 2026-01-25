-- ============================================
-- FINAL NOTIFICATION SYNC (Fixes 400 PATCH error)
-- ============================================
-- Adds the missing 'read_at' column and ensures
-- all other columns are correctly named.
-- ============================================

-- 1. FIX NOTIFICATIONS COLUMNS
DO $$ BEGIN
    -- read_at (The missing column for the PATCH request!)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- is_read
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'customer_id') THEN
            ALTER TABLE public.notifications RENAME COLUMN customer_id TO user_id;
        ELSE
            ALTER TABLE public.notifications ADD COLUMN user_id UUID;
        END IF;
    END IF;

    -- notification_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_type') THEN
        ALTER TABLE public.notifications ADD COLUMN notification_type VARCHAR(50) DEFAULT 'system';
    END IF;
END $$;

-- 2. ENSURE TRIGGER IS ROBUST
CREATE OR REPLACE FUNCTION notify_followers_on_new_artwork()
RETURNS TRIGGER AS $$
DECLARE
    has_type_col BOOLEAN;
    has_notif_type_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') INTO has_type_col;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_type') INTO has_notif_type_col;

    IF has_type_col AND has_notif_type_col THEN
        INSERT INTO notifications (user_id, type, notification_type, title, message, related_artwork_id, related_artist_id)
        SELECT af.user_id, 'new_artwork', 'new_artwork', 'New Artwork Available', 
               'An artist you follow has added a new artwork: ' || NEW.title,
               NEW.id, NEW.artist_id
        FROM artist_follows af WHERE af.artist_id = NEW.artist_id;
    ELSIF has_type_col THEN
        INSERT INTO notifications (user_id, type, title, message, related_artwork_id, related_artist_id)
        SELECT af.user_id, 'new_artwork', 'New Artwork Available', 
               'An artist you follow has added a new artwork: ' || NEW.title,
               NEW.id, NEW.artist_id
        FROM artist_follows af WHERE af.artist_id = NEW.artist_id;
    ELSE
        INSERT INTO notifications (user_id, notification_type, title, message, related_artwork_id, related_artist_id)
        SELECT af.user_id, 'new_artwork', 'New Artwork Available', 
               'An artist you follow has added a new artwork: ' || NEW.title,
               NEW.id, NEW.artist_id
        FROM artist_follows af WHERE af.artist_id = NEW.artist_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
