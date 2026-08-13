-- =============================================================
-- Migration: Admin Orders & 6-Digit Artwork Serial Numbers
-- =============================================================

-- 1. ARTISTS: Add 2-digit artist_code column
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS artist_code VARCHAR(2);

-- Function & Loop to backfill existing artists with unique 2-digit codes ('01', '02', '03'...)
DO $$
DECLARE
    a RECORD;
    counter INT := 1;
BEGIN
    FOR a IN SELECT id FROM public.artists WHERE artist_code IS NULL OR artist_code = '' ORDER BY created_at ASC LOOP
        UPDATE public.artists 
        SET artist_code = LPAD(counter::text, 2, '0') 
        WHERE id = a.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Enforce unique constraint on artist_code
ALTER TABLE public.artists 
DROP CONSTRAINT IF EXISTS artists_artist_code_key;

ALTER TABLE public.artists 
ADD CONSTRAINT artists_artist_code_key UNIQUE (artist_code);


-- 2. ARTWORKS: Add serial_number and artwork_seq columns
ALTER TABLE public.artworks 
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS artwork_seq INT;

-- Function & Loop to backfill existing artworks with 6-digit serial numbers
DO $$
DECLARE
    art RECORD;
    curr_artist_id UUID := NULL;
    seq_counter INT := 1;
    code_str VARCHAR(2);
BEGIN
    FOR art IN 
        SELECT a.id, a.artist_id, ar.artist_code 
        FROM public.artworks a
        LEFT JOIN public.artists ar ON a.artist_id = ar.id
        ORDER BY a.artist_id, a.created_at ASC 
    LOOP
        IF curr_artist_id IS NULL OR curr_artist_id <> art.artist_id THEN
            curr_artist_id := art.artist_id;
            seq_counter := 1;
        ELSE
            seq_counter := seq_counter + 1;
        END IF;

        code_str := COALESCE(art.artist_code, '01');

        UPDATE public.artworks 
        SET 
            artwork_seq = seq_counter,
            serial_number = LPAD(code_str, 2, '0') || LPAD(seq_counter::text, 4, '0')
        WHERE id = art.id;
    END LOOP;
END $$;


-- 3. TRIGGER FUNCTION: Auto-assign 6-digit serial_number on new artwork creation
CREATE OR REPLACE FUNCTION public.generate_artwork_serial_number()
RETURNS TRIGGER AS $$
DECLARE
    v_artist_code VARCHAR(2);
    v_next_seq INT;
    v_max_code INT;
BEGIN
    -- Get or assign artist code
    SELECT artist_code INTO v_artist_code
    FROM public.artists
    WHERE id = NEW.artist_id;

    IF v_artist_code IS NULL OR v_artist_code = '' THEN
        -- Find next available 2-digit artist code
        SELECT COALESCE(MAX(NULLIF(regexp_replace(artist_code, '\D', '', 'g'), '')::INT), 0) + 1 
        INTO v_max_code
        FROM public.artists;

        v_artist_code := LPAD(v_max_code::text, 2, '0');

        UPDATE public.artists 
        SET artist_code = v_artist_code 
        WHERE id = NEW.artist_id;
    END IF;

    -- Calculate next sequence number for this artist
    SELECT COALESCE(MAX(artwork_seq), 0) + 1 
    INTO v_next_seq
    FROM public.artworks
    WHERE artist_id = NEW.artist_id;

    NEW.artwork_seq := v_next_seq;
    NEW.serial_number := LPAD(v_artist_code, 2, '0') || LPAD(v_next_seq::text, 4, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to artworks table
DROP TRIGGER IF EXISTS trigger_assign_artwork_serial ON public.artworks;
CREATE TRIGGER trigger_assign_artwork_serial
BEFORE INSERT ON public.artworks
FOR EACH ROW
WHEN (NEW.serial_number IS NULL OR NEW.serial_number = '')
EXECUTE FUNCTION public.generate_artwork_serial_number();


-- 4. ORDERS: Ensure order_number, billing_address, and customer_notes columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS customer_notes TEXT;


-- 5. ORDERS: Purely numeric sequential order numbers (starting at 100001)
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 100001;

-- Backfill existing orders with sequential numeric order numbers
DO $$
DECLARE
    ord RECORD;
    curr_seq BIGINT;
BEGIN
    FOR ord IN SELECT id FROM public.orders ORDER BY created_at ASC LOOP
        curr_seq := nextval('public.order_number_seq');
        UPDATE public.orders 
        SET order_number = curr_seq::text 
        WHERE id = ord.id;
    END LOOP;
END $$;

-- Trigger to auto-assign sequential numeric order_number on new order insert
CREATE OR REPLACE FUNCTION public.assign_sequential_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' OR NEW.order_number ~ '^ORD-' OR NEW.order_number ~ '^[0-9a-fA-F-]{10,}$' THEN
        NEW.order_number := nextval('public.order_number_seq')::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_order_number ON public.orders;
CREATE TRIGGER trigger_assign_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.assign_sequential_order_number();
