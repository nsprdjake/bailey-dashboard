import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://kxqrsdicrayblwpczxsy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ2MzgwMywiZXhwIjoyMDU0MDM5ODAzfQ.WM83s8ldhqzSxsYl7wjmjOSH9lTyuUVGqMpLt1RQe78';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const sql = readFileSync('./supabase-schema.sql', 'utf-8');

console.log('🐕 Running Bailey Dashboard schema...\n');

// Execute the full schema
const { data, error } = await supabase.rpc('exec_sql', { query: sql });

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ Schema executed successfully!');

// Verify tables exist
const tables = ['bailey_walks', 'bailey_health', 'bailey_photos', 'bailey_memories'];
for (const table of tables) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`❌ ${table}: Error - ${error.message}`);
  } else {
    console.log(`✅ ${table}: ${count} records`);
  }
}
