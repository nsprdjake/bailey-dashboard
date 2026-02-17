-- Create storage bucket for Bailey photos
-- Run this in your Supabase SQL editor or via the Storage UI

-- Create the bailey-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bailey-photos', 'bailey-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'bailey-photos');

-- Allow public upload (you may want to restrict this later with auth)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bailey-photos');

-- Allow public update
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bailey-photos');

-- Allow public delete
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'bailey-photos');
