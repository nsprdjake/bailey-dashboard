# Bailey Photo Upload Setup Guide

## ✅ Step 1: Create Storage Bucket in Supabase

You need to create the storage bucket manually in Supabase:

### Option A: Via Supabase Dashboard (Recommended)
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `kxqrsdicrayblwpczxsy`
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure:
   - **Name:** `bailey-photos`
   - **Public bucket:** ✅ YES (check this box)
   - **File size limit:** `10485760` (10MB in bytes)
   - **Allowed MIME types:** Leave empty or add: `image/jpeg,image/png,image/heic,image/heif,image/webp,image/gif`
6. Click **"Create bucket"**

### Option B: Via SQL Editor
1. Go to **SQL Editor** in Supabase Dashboard
2. Run the contents of `setup-storage-bucket.sql`

## ✅ Step 2: Verify Bucket Configuration

After creating the bucket, verify the policies are set correctly:

1. In Supabase Dashboard, go to **Storage** → **bailey-photos**
2. Click **"Policies"** tab
3. You should see policies for SELECT, INSERT, UPDATE, DELETE
4. All should allow public access (for now - you can restrict later with auth)

## ✅ Step 3: Test Locally

```bash
cd bailey-dashboard
npm run dev
```

Navigate to http://localhost:3000/gallery and test:
- ✅ Drag-drop an image
- ✅ Click to browse and select an image
- ✅ See image preview before upload
- ✅ Upload progress indicator works
- ✅ Photo appears in gallery after upload
- ✅ Try different formats: JPG, PNG, HEIC (iOS photos)

## ✅ Step 4: Deploy to Production

```bash
# Build and deploy
npm run build

# Deploy to bailey.nsprd.com
# (use your existing deployment method)
```

## 📋 Features Implemented

✅ Direct file upload from device
✅ Drag-and-drop support
✅ File picker (click to browse)
✅ Image preview before upload
✅ Upload progress indicator
✅ Support for JPG, PNG, HEIC, HEIF, WebP, GIF
✅ Max file size: 10MB
✅ URL upload as backup option
✅ Automatic unique filenames (timestamp-based)
✅ Public URLs via Supabase Storage
✅ Saves to bailey_photos database table

## 🔒 Security Notes

Currently, the bucket allows public uploads. To restrict this later:

1. Enable authentication in your app
2. Update storage policies to check `auth.uid()`
3. Only allow authenticated users to upload

## 🐛 Troubleshooting

### "Failed to upload photo" error
- Check that the `bailey-photos` bucket exists in Supabase Storage
- Verify the bucket is public
- Check browser console for detailed error messages
- Ensure file size is under 10MB

### HEIC files not working
- HEIC is an iOS format that some browsers don't preview
- Upload will still work, but preview might not show
- The file will be stored correctly in Supabase

### Upload progress stuck at 30%
- This usually means the Supabase Storage upload failed
- Check bucket permissions
- Verify your Supabase URL and anon key in `.env.local`

## 📸 Testing Checklist

Before deploying to production, test:
- [ ] JPG upload
- [ ] PNG upload
- [ ] HEIC upload (from iPhone)
- [ ] Large file (9MB+) - should work
- [ ] Too large file (11MB+) - should show error
- [ ] Invalid file type (PDF, TXT) - should show error
- [ ] Drag-and-drop
- [ ] File picker (click)
- [ ] Preview shows correctly
- [ ] Progress indicator works
- [ ] Photo appears in gallery
- [ ] Photo URL is accessible
- [ ] URL upload still works (backup option)
- [ ] Caption and date save correctly
- [ ] Favorite toggle works
