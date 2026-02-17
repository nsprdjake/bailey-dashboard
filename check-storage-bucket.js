import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  Object.assign(process.env, envVars);
} catch (err) {
  console.log('Could not load .env.local:', err.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorageBucket() {
  try {
    // Try to list files in the bucket
    const { data, error } = await supabase.storage
      .from('bailey-photos')
      .list('', {
        limit: 1
      });

    if (error) {
      console.log('❌ Storage bucket "bailey-photos" does not exist or has issues:', error.message);
      console.log('\n📝 To create the bucket:');
      console.log('1. Go to: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new');
      console.log('2. Run the contents of create-storage-bucket-complete.sql');
      return false;
    }

    console.log('✅ Storage bucket "bailey-photos" exists and is accessible!');
    console.log('Files in bucket:', data?.length || 0);
    return true;
  } catch (err) {
    console.error('Error checking bucket:', err);
    return false;
  }
}

// Also test upload capability
async function testUpload() {
  const testContent = 'test';
  const testFile = new Blob([testContent], { type: 'text/plain' });
  const filename = `test-${Date.now()}.txt`;

  const { data, error } = await supabase.storage
    .from('bailey-photos')
    .upload(filename, testFile);

  if (error) {
    console.log('\n❌ Upload test failed:', error.message);
    return false;
  }

  console.log('\n✅ Upload test successful!');
  
  // Clean up test file
  await supabase.storage
    .from('bailey-photos')
    .remove([filename]);
    
  return true;
}

checkStorageBucket().then(async (exists) => {
  if (exists) {
    await testUpload();
  }
});