-- ============================================
-- Fix Admin Policies and Helper Function
-- ============================================

-- 0. Drop existing table and functions if they conflict
DROP TABLE IF EXISTS public.admins CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 1. Create the admins table fresh
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create a security definer function to check admin status
-- This avoids infinite recursion when checking RLS on the admins table itself
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN (
    (coalesce(auth.jwt() ->> 'email', '') = 'ardaonuk9995@gmail.com') OR
    (auth.uid() = 'admin-arda') OR
    EXISTS (
      SELECT 1 
      FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Enable RLS on the admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can do everything on admins" ON public.admins;

-- 4. Create read policy (anyone can read admin status to verify roles)
CREATE POLICY "Anyone can read admins" ON public.admins 
FOR SELECT 
USING (true);

-- 5. Create manage policy (only admins can add or remove admin records)
CREATE POLICY "Admins can do everything on admins" ON public.admins 
FOR ALL 
USING (public.is_admin());

-- 6. Also update other admin policies to use the helper function for consistency
DROP POLICY IF EXISTS "Admins can do everything on artwork_metrics" ON artwork_metrics;
CREATE POLICY "Admins can do everything on artwork_metrics" ON artwork_metrics 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can do everything on blacklist" ON blacklist;
CREATE POLICY "Admins can do everything on blacklist" ON blacklist 
FOR ALL 
USING (public.is_admin());
