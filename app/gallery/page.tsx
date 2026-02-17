'use client';

import { useEffect, useState, useRef } from 'react';

export const dynamic = 'force-dynamic';
import { supabase, type Photo } from '@/lib/supabase';
import { Plus, Heart, X, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    url: '',
    caption: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    const { data } = await supabase
      .from('bailey_photos')
      .select('*')
      .order('date', { ascending: false });
    setPhotos(data || []);
  }

  function handleFileSelect(file: File) {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Please upload a valid image file (JPG, PNG, HEIC, WebP, or GIF)');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function uploadFile(file: File): Promise<string> {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('bailey-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bailey-photos')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    try {
      let photoUrl = formData.url;

      if (uploadMode === 'file' && selectedFile) {
        // Simulate progress
        setUploadProgress(30);
        
        // Upload file to Supabase Storage
        photoUrl = await uploadFile(selectedFile);
        
        setUploadProgress(70);
      }

      if (!photoUrl) {
        alert('Please select a file or enter a URL');
        setUploading(false);
        return;
      }

      // Save to database
      await supabase.from('bailey_photos').insert([{
        url: photoUrl,
        caption: formData.caption,
        date: formData.date
      }]);

      setUploadProgress(100);

      // Reset form
      setFormData({
        url: '',
        caption: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowForm(false);
      setUploadProgress(0);
      loadPhotos();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }

  async function toggleFavorite(photo: Photo) {
    await supabase
      .from('bailey_photos')
      .update({ is_favorite: !photo.is_favorite })
      .eq('id', photo.id);
    loadPhotos();
  }

  function resetForm() {
    setShowForm(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setFormData({
      url: '',
      caption: '',
      date: new Date().toISOString().split('T')[0],
    });
  }

  const filteredPhotos =
    filter === 'favorites' ? photos.filter((p) => p.is_favorite) : photos;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-[var(--primary)]">📸 Photo Gallery</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Photo
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-white text-[var(--text-light)] hover:bg-[var(--accent)]'
          }`}
        >
          All Photos ({photos.length})
        </button>
        <button
          onClick={() => setFilter('favorites')}
          className={`px-6 py-2 rounded-lg transition-colors ${
            filter === 'favorites'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-white text-[var(--text-light)] hover:bg-[var(--accent)]'
          }`}
        >
          ❤️ Favorites ({photos.filter((p) => p.is_favorite).length})
        </button>
      </div>

      {/* Add Photo Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-bounce-in">
          <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">Add New Photo</h2>
          
          {/* Upload Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setUploadMode('file');
                setFormData({ ...formData, url: '' });
              }}
              className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                uploadMode === 'file'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload from Device
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('url');
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                uploadMode === 'url'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LinkIcon className="w-5 h-5" />
              Use URL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadMode === 'file' ? (
              <>
                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photo</label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-[var(--primary)] bg-[var(--accent)]'
                        : 'border-gray-300 hover:border-[var(--primary)]'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp,image/gif"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <p className="text-sm text-gray-600">
                          {selectedFile?.name} ({(selectedFile!.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          Choose different file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ImageIcon className="w-16 h-16 mx-auto text-gray-400" />
                        <div>
                          <p className="text-lg font-medium text-gray-700">
                            Drop your photo here, or click to browse
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Supports JPG, PNG, HEIC, WebP, GIF (max 10MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Photo URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                  required
                  placeholder="https://..."
                />
                <p className="text-xs text-[var(--text-light)] mt-1">
                  Tip: Upload to Imgur, Cloudinary, or use a direct image URL
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Caption (optional)</label>
              <input
                type="text"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                placeholder="What's happening in this photo?"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading || (uploadMode === 'file' && !selectedFile)}
                className="flex-1 bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Add Photo'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={uploading}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <img
                src={photo.url}
                alt={photo.caption || 'Bailey photo'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(photo);
                }}
                className="absolute top-3 right-3 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    photo.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`}
                />
              </button>
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                  <p className="text-sm font-medium">{photo.caption}</p>
                  <p className="text-xs opacity-75">
                    {format(new Date(photo.date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-bounce-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl w-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Bailey photo'}
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            {selectedPhoto.caption && (
              <div className="mt-6 text-center">
                <p className="text-white text-xl font-medium mb-2">
                  {selectedPhoto.caption}
                </p>
                <p className="text-white/75">
                  {format(new Date(selectedPhoto.date), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {filteredPhotos.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-xl text-[var(--text-light)]">
            {filter === 'favorites'
              ? 'No favorite photos yet!'
              : 'No photos yet! Add your first photo of Bailey.'}
          </p>
        </div>
      )}
    </div>
  );
}
