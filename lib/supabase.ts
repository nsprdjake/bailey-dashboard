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
  // Fi collar fields
  fi_walk_id?: string | null;
  steps?: number | null;
  distance_meters?: number | null;
  calories?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  avg_speed_mph?: number | null;
  synced_from_fi?: boolean;
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

// Fi collar types
export type FiActivity = {
  id: string;
  date: string;
  total_steps: number;
  total_distance_meters: number;
  total_calories: number;
  walk_count: number;
  rest_minutes: number;
  nap_minutes: number;
  active_minutes: number;
  play_minutes: number;
  daily_goal_steps: number;
  goal_achieved: boolean;
  synced_at: string;
  created_at: string;
};

export type FiLocation = {
  id: string;
  walk_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  timestamp: string;
  created_at: string;
};

export type FiSleep = {
  id: string;
  date: string;
  sleep_type: 'nap' | 'rest' | 'deep_sleep';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  quality_score: number | null;
  created_at: string;
};

export type FiSyncLog = {
  id: string;
  sync_type: 'manual' | 'auto' | 'cron';
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed';
  records_synced: number;
  error_message: string | null;
  created_at: string;
};

// Veterinary Records
export type VetRecord = {
  id: string;
  date: string;
  type: 'vaccine' | 'visit' | 'surgery' | 'medication' | 'lab_work' | 'other';
  title: string;
  description: string | null;
  vet_name: string | null;
  cost: number | null;
  next_due_date: string | null;
  file_url: string | null;
  created_at: string;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
};

export type WeightLog = {
  id: string;
  date: string;
  weight_lbs: number;
  notes: string | null;
  created_at: string;
};
