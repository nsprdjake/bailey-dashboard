# Bailey Photo Upload - Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Create Supabase Storage Bucket (REQUIRED)

**Option A: SQL Editor (Recommended - Fastest)**
1. Open: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new
2. Copy entire contents of `create-storage-bucket-complete.sql`
3. Paste into SQL editor
4. Click "Run"
5. Verify success messages in console

**Option B: UI (If SQL fails)**
1. Open: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/storage/buckets
2. Click "New bucket"
3. Settings:
   - Name: `bailey-photos`
   - Public bucket: ✅ YES
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: `image/jpeg,image/png,image/heic,image/heif,image/webp,image/gif`
4. After creation, go to bucket → Policies → Add 4 policies (see CREATE_BUCKET_MANUAL.md)

**Verify Bucket:**
```bash
# Test bucket exists
curl "https://kxqrsdicrayblwpczxsy.supabase.co/storage/v1/bucket/bailey-photos" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NjM4MDMsImV4cCI6MjA1NDAzOTgwM30.a_Lqj2UexnxLCZh7X1GtZ9_lnmXS7d4B2FXPjOw6H3I"

# Should return bucket info (not 404)
```

### 2. Local Testing (REQUIRED)

```bash
cd bailey-dashboard

# Start dev server
npm run dev

# Open in browser
# http://localhost:3000/gallery
```

**Test each scenario:**
- [ ] Click "Add Photo" button
- [ ] See "Upload from Device" / "Use URL" toggle
- [ ] Click "Upload from Device" tab
- [ ] Drag test-images/test-small.jpg onto upload area
- [ ] Verify image preview appears
- [ ] Add caption: "Test Upload"
- [ ] Click "Add Photo"
- [ ] Watch upload progress bar
- [ ] Verify photo appears in gallery
- [ ] Click on photo to view lightbox
- [ ] Click heart to favorite
- [ ] Test URL upload (toggle to "Use URL")
- [ ] Upload test-medium.jpg (verify progress works)
- [ ] Try test-too-large.jpg (should show error)

### 3. Build Test

```bash
cd bailey-dashboard
npm run build
```

Should complete without errors. Check for:
- ✅ No TypeScript errors
- ✅ No build warnings
- ✅ Gallery page compiled successfully

### 4. Deploy to Production

**If using Vercel:**
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Deploy
vercel --prod

# Or push to git (if auto-deploy is enabled)
git add .
git commit -m "Add direct photo upload to Bailey gallery"
git push origin main
```

**If using other hosting:**
```bash
# Build
npm run build

# Deploy dist/build folder to your hosting
# Make sure .env.local environment variables are set in production
```

### 5. Post-Deployment Verification

1. **Open production site:** https://bailey.nsprd.com/gallery
2. **Test upload flow:**
   - [ ] Add Photo button works
   - [ ] File upload UI appears
   - [ ] Upload a real photo from your phone/computer
   - [ ] Verify upload succeeds
   - [ ] Photo appears in gallery
   - [ ] Public URL is accessible
   - [ ] Favorite toggle works
   - [ ] Lightbox works

3. **Test different formats:**
   - [ ] JPG upload
   - [ ] PNG upload
   - [ ] HEIC upload (from iPhone if available)
   - [ ] WebP upload

4. **Test error cases:**
   - [ ] File too large (>10MB) shows error
   - [ ] Invalid file type shows error

## 🐛 Troubleshooting

### Upload fails with "signature verification failed"
- **Cause:** Storage bucket doesn't exist or policies aren't set
- **Fix:** Run `create-storage-bucket-complete.sql` in Supabase SQL editor

### Upload fails with "Failed to upload photo"
- **Cause:** Bucket policies missing or incorrect
- **Fix:** Check Storage → bailey-photos → Policies tab. Should have 4 policies:
  - Public Access (SELECT)
  - Public Upload (INSERT)
  - Public Update (UPDATE)
  - Public Delete (DELETE)

### Preview doesn't show for HEIC files
- **This is normal:** Browsers don't display HEIC previews
- **File will still upload correctly**
- **Photo will appear in gallery after upload**

### "Bucket not found" error
- **Cause:** Bucket name mismatch or bucket wasn't created
- **Fix:** Verify bucket name is exactly `bailey-photos` in Supabase dashboard

### Upload progress stuck at 30%
- **Cause:** Network issue or Supabase Storage API error
- **Fix:** Check browser console for detailed error
- **Check:** Supabase project status (no outages)

## 📊 Monitoring

After deployment, monitor:
- Photo upload success rate
- Storage bucket size (Supabase dashboard)
- Any error logs in browser console
- User feedback on upload experience

## 🔒 Security Notes

**Current Setup:**
- ✅ Bucket is public (anyone can read photos)
- ⚠️ Anyone can upload (no auth required)
- ⚠️ Anyone can delete (no auth required)

**To restrict uploads later:**
1. Enable authentication in app
2. Update storage policies:
   ```sql
   -- Example: Only authenticated users can upload
   CREATE POLICY "Authenticated Upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'bailey-photos' AND auth.uid() IS NOT NULL);
   ```

## 📝 Files Changed

New files:
- `app/gallery/page.tsx` (updated with file upload UI)
- `setup-storage-bucket.sql`
- `create-storage-bucket-complete.sql`
- `setup-storage.mjs`
- `create-bucket.sh`
- `create-test-images.mjs`
- `test-images/` (test files)
- `PHOTO_UPLOAD_SETUP.md`
- `CREATE_BUCKET_MANUAL.md`
- `PHOTO_UPLOAD_DEPLOYMENT.md` (this file)

## ✨ Features Delivered

✅ Direct file upload from device
✅ Drag-and-drop support
✅ Click-to-browse file picker
✅ Image preview before upload
✅ Upload progress indicator
✅ Support for JPG, PNG, HEIC, HEIF, WebP, GIF
✅ Max file size: 10MB with validation
✅ URL upload as backup option
✅ Toggle between file upload and URL input
✅ Automatic unique filenames (timestamp-based)
✅ Public URLs via Supabase Storage
✅ Saves metadata to bailey_photos database
✅ Maintains existing gallery features (favorites, lightbox, etc.)

## 🎯 Success Criteria

- [x] Code implemented and tested locally
- [ ] Supabase Storage bucket created
- [ ] Tested with multiple image formats
- [ ] Deployed to production
- [ ] Production upload tested and working
- [ ] User can upload Bailey photos from their device
- [ ] Photos appear in gallery immediately
- [ ] No console errors
- [ ] Upload progress works smoothly

## 📞 Support

If issues persist:
1. Check Supabase dashboard for errors
2. Check browser console for JavaScript errors
3. Verify .env.local variables are correct
4. Check Supabase project status page
5. Review this deployment checklist again
