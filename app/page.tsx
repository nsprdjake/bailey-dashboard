'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { Heart, Calendar, Activity, Sparkles } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Image from 'next/image';

type Stats = {
  walksThisMonth: number;
  daysSinceVet: number;
  age: string;
  favoriteActivity: string;
};

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    walksThisMonth: 0,
    daysSinceVet: 0,
    age: '5 years old',
    favoriteActivity: 'Chasing squirrels',
  });
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [funFacts, setFunFacts] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get walks this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: walks } = await supabase
        .from('bailey_walks')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      // Get last vet visit
      const { data: vetVisits } = await supabase
        .from('bailey_health')
        .select('*')
        .eq('type', 'vet_visit')
        .order('date', { ascending: false })
        .limit(1);

      // Get recent photos
      const { data: photos } = await supabase
        .from('bailey_photos')
        .select('*')
        .order('date', { ascending: false })
        .limit(6);

      // Get random memories for fun facts
      const { data: memories } = await supabase
        .from('bailey_memories')
        .select('*')
        .limit(5);

      setStats({
        walksThisMonth: walks?.length || 0,
        daysSinceVet: vetVisits?.[0]
          ? differenceInDays(new Date(), new Date(vetVisits[0].date))
          : 0,
        age: '5 years old',
        favoriteActivity: 'Playing fetch',
      });

      setRecentPhotos(photos || []);
      setFunFacts(
        memories?.map((m) => m.description) || [
          'Bailey loves belly rubs',
          'Her favorite toy is Mr. Squeaky',
          'She can do 7 different tricks',
        ]
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-bounce-in">
        <h1 className="text-5xl font-bold mb-4 text-[var(--primary)]">
          🐕 Bailey Dashboard
        </h1>
        <p className="text-xl text-[var(--text-light)]">
          The Goodest Girl™
        </p>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-[400px] rounded-3xl overflow-hidden mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-8xl mb-4">🐕</div>
            <p className="text-2xl font-semibold">Bailey's Photo Coming Soon!</p>
            <p className="text-sm mt-2 opacity-75">Add your favorite photo to the gallery</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatsCard
          icon={<Calendar className="w-8 h-8" />}
          label="Age"
          value={stats.age}
          color="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatsCard
          icon={<Activity className="w-8 h-8" />}
          label="Walks This Month"
          value={stats.walksThisMonth.toString()}
          color="bg-gradient-to-br from-green-400 to-green-600"
        />
        <StatsCard
          icon={<Heart className="w-8 h-8" />}
          label="Days Since Vet"
          value={stats.daysSinceVet.toString()}
          color="bg-gradient-to-br from-pink-400 to-pink-600"
        />
        <StatsCard
          icon={<Sparkles className="w-8 h-8" />}
          label="Favorite Activity"
          value={stats.favoriteActivity}
          color="bg-gradient-to-br from-yellow-400 to-yellow-600"
        />
      </div>

      {/* Fun Facts */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h2 className="text-3xl font-bold mb-6 text-[var(--primary)]">
          ✨ Fun Facts About Bailey
        </h2>
        <ul className="space-y-3">
          {funFacts.map((fact, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-lg"
            >
              <span className="text-2xl">🐾</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Photos */}
      {recentPhotos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-[var(--primary)]">
            📸 Recent Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Bailey photo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}
