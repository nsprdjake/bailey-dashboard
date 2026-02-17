# Create Bailey Photos Storage Bucket - Manual Instructions

## ⚠️ Important: You must create the storage bucket manually

The anon key doesn't have permission to create buckets (this is a security feature).

## 📋 Step-by-Step Instructions

### Method 1: Supabase Dashboard UI (Easiest)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/storage/buckets
   - Log in if prompted

2. **Create New Bucket**
   - Click **"New bucket"** button (top right)
   
3. **Configure Bucket**
   ```
   Name: bailey-photos
   Public bucket: ✅ (MUST check this box!)
   File size limit: 10485760 (or type: 10MB)
   Allowed MIME types: (leave empty for now)
   ```

4. **Create Policies**
   After creating the bucket, you need to add policies:
   - Go to the bucket you just created
   - Click "Policies" tab
   - Click "New Policy"
   - Add these 4 policies:

   **Policy 1: Public SELECT**
   ```
   Name: Public Access
   Allowed operation: SELECT
   Target roles: public
   USING expression: true
   ```

   **Policy 2: Public INSERT**
   ```
   Name: Public Upload
   Allowed operation: INSERT
   Target roles: public
   WITH CHECK expression: true
   ```

   **Policy 3: Public UPDATE**
   ```
   Name: Public Update
   Allowed operation: UPDATE
   Target roles: public
   USING expression: true
   ```

   **Policy 4: Public DELETE**
   ```
   Name: Public Delete
   Allowed operation: DELETE
   Target roles: public
   USING expression: true
   ```

### Method 2: SQL Editor (Faster if you're comfortable with SQL)

1. **Open SQL Editor**
   - Go to: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new
   
2. **Run this SQL:**
   ```sql
   -- Create the bailey-photos bucket
   INSERT INTO storage.buckets (id, name, public, file_size_limit)
   VALUES ('bailey-photos', 'bailey-photos', true, 10485760)
   ON CONFLICT (id) DO NOTHING;

   -- Allow public read access to files
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
   USING (bucket_id = 'bailey-photos');

   -- Allow public delete
   CREATE POLICY "Public Delete"
   ON storage.objects FOR DELETE
   TO public
   USING (bucket_id = 'bailey-photos');
   ```

3. **Click "Run"**

## ✅ Verify Creation

After creating the bucket:

1. Go to: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/storage/buckets
2. You should see "bailey-photos" in the list
3. Click on it to verify it's public
4. Check the "Policies" tab shows 4 policies

## 🧪 Test Upload

Once the bucket is created:

1. Make sure dev server is running: `npm run dev`
2. Open: http://localhost:3000/gallery
3. Click "Add Photo"
4. Try uploading a test image
5. Should upload successfully and appear in gallery

## 🐛 Troubleshooting

If upload fails after creating bucket:
- Verify bucket is marked as "public" 
- Check all 4 policies exist
- Try refreshing the page
- Check browser console for errors

## 🔒 Security Note

Current setup allows anyone to upload/delete photos. To add authentication later:
1. Enable Auth in your app
2. Update policies to check `auth.uid()`
3. Only allow authenticated users to upload
