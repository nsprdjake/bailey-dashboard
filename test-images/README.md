# Test Images for Bailey Photo Upload

Place test images here for testing the upload functionality:

## Required Test Cases

1. **test-jpg.jpg** - Standard JPEG image (should work perfectly)
2. **test-png.png** - PNG image (should work perfectly)
3. **test-large.jpg** - Image around 8-9MB (should work, test progress bar)
4. **test-too-large.jpg** - Image over 10MB (should show error)
5. **test-heic.HEIC** - iPhone HEIC image (for iOS compatibility)
6. **test-webp.webp** - WebP format (modern format test)

## How to Test

1. Start dev server: `npm run dev`
2. Open http://localhost:3000/gallery
3. Click "Add Photo"
4. Test each image type:
   - Drag-drop onto upload area
   - Click to browse and select
   - Verify preview shows correctly
   - Check upload progress
   - Confirm photo appears in gallery

## Creating Test Images

### On Mac:
```bash
# Create JPG test image (small)
sips -s format jpeg -s formatOptions 70 -z 1200 1600 /path/to/any/image.jpg --out test-jpg.jpg

# Create PNG test image
sips -s format png -z 1200 1600 /path/to/any/image.png --out test-png.png

# Create large JPG (resize to make bigger)
sips -s format jpeg -s formatOptions 100 -z 4000 6000 /path/to/any/image.jpg --out test-large.jpg
```

### Using ImageMagick:
```bash
# Create test images with text
convert -size 1600x1200 -background lightblue -fill white -gravity center \
  -pointsize 72 label:"Bailey Test JPG" test-jpg.jpg

convert -size 1600x1200 -background lightgreen -fill white -gravity center \
  -pointsize 72 label:"Bailey Test PNG" test-png.png

convert -size 1600x1200 -background lightyellow -fill white -gravity center \
  -pointsize 72 label:"Bailey Test WebP" test-webp.webp
```

## Automated Test Script

Run `npm run test:photos` to automatically test all images in this directory.
