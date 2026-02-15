'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { supabase, type Walk } from '@/lib/supabase';
import { Plus, MapPin, Clock, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function WalksPage() {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    loadWalks();
  }, []);

  async function loadWalks() {
    const { data } = await supabase
      .from('bailey_walks')
      .select('*')
      .order('date', { ascending: false });
    setWalks(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('bailey_walks').insert([
      {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
      },
    ]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      duration_minutes: '',
      location: '',
      notes: '',
    });
    setShowForm(false);
    loadWalks();
  }

  const totalWalks = walks.length;
  const totalMinutes = walks.reduce((sum, walk) => sum + walk.duration_minutes, 0);
  const avgDuration = totalWalks > 0 ? Math.round(totalMinutes / totalWalks) : 0;

  // Calculate streak (consecutive days with walks)
  const streak = calculateStreak(walks);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-[var(--primary)]">🚶 Walk Tracker</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Log Walk
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Walks" value={totalWalks} icon="🦴" />
        <StatCard label="Total Time" value={`${totalMinutes} min`} icon="⏱️" />
        <StatCard label="Avg Duration" value={`${avgDuration} min`} icon="📊" />
        <StatCard label="Streak" value={`${streak} days`} icon="🔥" />
      </div>

      {/* Add Walk Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-bounce-in">
          <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">Log a New Walk</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                required
                placeholder="e.g., Neighborhood Loop, Dog Park"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                rows={3}
                placeholder="Any fun moments or observations?"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-[var(--primary)] text-white px-6 py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                Save Walk
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

      {/* Walk History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--primary)]">Walk History</h2>
        {walks.map((walk) => (
          <div
            key={walk.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex items-center justify-center text-2xl">
                  🐕
                </div>
                <div>
                  <div className="font-semibold text-lg">{walk.location}</div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-light)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(walk.date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {walk.duration_minutes} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {walk.notes && (
              <p className="text-[var(--text-light)] mt-2 pl-15">{walk.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-[var(--primary)]">{value}</div>
      <div className="text-sm text-[var(--text-light)]">{label}</div>
    </div>
  );
}

function calculateStreak(walks: Walk[]): number {
  if (walks.length === 0) return 0;

  const sortedDates = walks
    .map((w) => new Date(w.date))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  let currentDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = Math.floor(
      (currentDate.getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      streak++;
      currentDate = sortedDates[i];
    } else if (dayDiff > 1) {
      break;
    }
  }

  return streak;
}
