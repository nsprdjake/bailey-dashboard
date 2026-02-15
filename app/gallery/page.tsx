'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { supabase, type Photo } from '@/lib/supabase';
import { Plus, Heart, X } from 'lucide-react';
import { format } from 'date-fns';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('bailey_photos').insert([formData]);
    setFormData({
      url: '',
      caption: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
    loadPhotos();
  }

  async function toggleFavorite(photo: Photo) {
    await supabase
      .from('bailey_photos')
      .update({ is_favorite: !photo.is_favorite })
      .eq('id', photo.id);
    loadPhotos();
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="flex-1 bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                Add Photo
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
