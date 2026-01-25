-- ============================================
-- SYSTEM SYNC & REPAIR (TYPE COLUMN FIX)
-- ============================================
-- This script fixes the "null value in column 'type'" error
-- by making the 'type' column nullable and ensuring the 
-- trigger populates both possible column names.
-- ============================================

-- 1. FIX NOTIFICATIONS TABLE COLUMNS
DO $$ BEGIN
    -- If 'type' exists and is NOT NULL, make it NULLABLE to prevent errors
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ALTER COLUMN "type" DROP NOT NULL;
    END IF;

    -- Ensure 'notification_type' exists (this is what the frontend uses)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_type') THEN
        ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) DEFAULT 'system';
    END IF;

    -- Ensure 'user_id' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'customer_id') THEN
            ALTER TABLE notifications RENAME COLUMN customer_id TO user_id;
        ELSE
            ALTER TABLE notifications ADD COLUMN user_id UUID;
        END IF;
    END IF;
END $$;

-- 2. UPDATE THE TRIGGER FUNCTION (Robust version)
CREATE OR REPLACE FUNCTION notify_followers_on_new_artwork()
RETURNS TRIGGER AS $$
DECLARE
    has_type_col BOOLEAN;
    has_notif_type_col BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') INTO has_type_col;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_type') INTO has_notif_type_col;

    -- Insert notifications for all followers of the artist
    -- Using dynamic column names to be safe
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

-- 3. RE-APPLY THE TRIGGER
DROP TRIGGER IF EXISTS trigger_notify_followers_on_new_artwork ON artworks;
CREATE TRIGGER trigger_notify_followers_on_new_artwork
    AFTER INSERT ON artworks FOR EACH ROW EXECUTE FUNCTION notify_followers_on_new_artwork();
