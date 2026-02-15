import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client if env vars aren't set (for build time)
let supabaseInstance: SupabaseClient;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Mock client for build-time only
  supabaseInstance = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: function() { return this; },
      gte: function() { return this; },
      order: function() { return this; },
      limit: function() { return this; },
    }),
  } as any as SupabaseClient;
}

export const supabase = supabaseInstance;

// Database types
export type Walk = {
  id: string;
  date: string;
  duration_minutes: number;
  location: string;
  notes: string | null;
  created_at: string;
};

export type HealthRecord = {
  id: string;
  type: 'vet_visit' | 'vaccination' | 'medication' | 'weight';
  date: string;
  title: string;
  description: string | null;
  value: string | null; // For weight tracking
  created_at: string;
};

export type Photo = {
  id: string;
  url: string;
  caption: string | null;
  date: string;
  is_favorite: boolean;
  created_at: string;
};

export type Memory = {
  id: string;
  type: 'quote' | 'toy' | 'funny_moment';
  title: string;
  description: string;
  date: string | null;
  created_at: string;
};
