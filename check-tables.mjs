import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NjM4MDMsImV4cCI6MjA1NDAzOTgwM30.a_Lqj2UexnxLCZh7X1GtZ9_lnmXS7d4B2FXPjOw6H3I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['bailey_walks', 'bailey_health', 'bailey_photos', 'bailey_memories'];

console.log('🐕 Checking Bailey Dashboard tables...\n');

for (const table of tables) {
  const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
  if (error) {
    console.log(`❌ ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}: ${count} records`);
  }
}
