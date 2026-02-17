-- Complete Supabase Storage Bucket Setup for Bailey Photos
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new

-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bailey-photos',
  'bailey-photos',
  true,
  10485760,  -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Step 4: Create new policies for the bailey-photos bucket

-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bailey-photos');

-- Allow public upload
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'bailey-photos');

-- Allow public update
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'bailey-photos')
WITH CHECK (bucket_id = 'bailey-photos');

-- Allow public delete
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'bailey-photos');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'bailey-photos';

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
