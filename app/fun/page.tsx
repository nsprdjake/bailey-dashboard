'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { supabase, type Memory } from '@/lib/supabase';
import { Plus, Quote, Heart, Smile } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const MEMORY_TYPES = [
  { value: 'quote', label: 'Bailey Quote', icon: Quote, emoji: '💬' },
  { value: 'toy', label: 'Favorite Toy', icon: Heart, emoji: '🧸' },
  { value: 'funny_moment', label: 'Funny Moment', icon: Smile, emoji: '😂' },
];

type MemoryType = 'quote' | 'toy' | 'funny_moment';

export default function FunPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    type: MemoryType;
    title: string;
    description: string;
    date: string;
  }>({
    type: 'quote',
    title: '',
    description: '',
    date: '',
  });

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    const { data } = await supabase
      .from('bailey_memories')
      .select('*')
      .order('created_at', { ascending: false });
    setMemories(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('bailey_memories').insert([
      {
        ...formData,
        date: formData.date || null,
      },
    ]);
    setFormData({
      type: 'quote',
      title: '',
      description: '',
      date: '',
    });
    setShowForm(false);
    loadMemories();
  }

  // Birthday countdown (assuming birthday is Oct 15, 2021)
  const birthday = new Date(2027, 9, 15); // Oct 15, 2027 (next birthday)
  const daysUntilBirthday = differenceInDays(birthday, new Date());

  const quotes = memories.filter((m) => m.type === 'quote');
  const toys = memories.filter((m) => m.type === 'toy');
  const funnyMoments = memories.filter((m) => m.type === 'funny_moment');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-[var(--primary)]">✨ Fun Stuff</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Memory
        </button>
      </div>

      {/* Birthday Countdown */}
      <div className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl shadow-lg p-8 mb-8 text-white text-center">
        <div className="text-5xl mb-3">🎂</div>
        <h2 className="text-3xl font-bold mb-2">Birthday Countdown</h2>
        <div className="text-6xl font-bold mb-2">{daysUntilBirthday}</div>
        <p className="text-xl opacity-90">days until Bailey turns 6!</p>
        <p className="text-sm opacity-75 mt-2">October 15, 2027</p>
      </div>

      {/* Add Memory Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-bounce-in">
          <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">Add a Memory</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as MemoryType })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
              >
                {MEMORY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                required
                placeholder="e.g., The Doorbell Bark, Mr. Squeaky"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                rows={4}
                required
                placeholder="Tell the story..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date (optional)</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                Save Memory
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

      {/* Bailey Quotes */}
      {quotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary)] mb-4 flex items-center gap-2">
            💬 Bailey Quotes
          </h2>
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-[var(--primary)]"
              >
                <h3 className="font-semibold text-lg mb-2">{quote.title}</h3>
                <p className="text-[var(--text-light)] italic">"{quote.description}"</p>
                {quote.date && (
                  <p className="text-sm text-[var(--text-light)] mt-2">
                    {format(new Date(quote.date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Toys */}
      {toys.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary)] mb-4 flex items-center gap-2">
            🧸 Favorite Toys
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toys.map((toy) => (
              <div
                key={toy.id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  ❤️ {toy.title}
                </h3>
                <p className="text-[var(--text-light)]">{toy.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funny Moments */}
      {funnyMoments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--primary)] mb-4 flex items-center gap-2">
            😂 Funny Moments
          </h2>
          <div className="space-y-4">
            {funnyMoments.map((moment) => (
              <div
                key={moment.id}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{moment.title}</h3>
                <p className="text-[var(--text-light)]">{moment.description}</p>
                {moment.date && (
                  <p className="text-sm text-[var(--text-light)] mt-2">
                    {format(new Date(moment.date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {memories.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-xl text-[var(--text-light)]">
            No memories yet! Start adding Bailey's favorite moments.
          </p>
        </div>
      )}
    </div>
  );
}
