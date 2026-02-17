#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('🚀 Setting up Bailey Photos Storage...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      console.log('\n⚠️  You may need to create the bucket manually in Supabase Dashboard:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to Storage → Create bucket');
      console.log('   4. Name: bailey-photos');
      console.log('   5. Public bucket: YES');
      console.log('   6. File size limit: 10MB');
      process.exit(1);
    }

    const bucketExists = buckets?.some(b => b.name === 'bailey-photos');

    if (bucketExists) {
      console.log('✅ Bucket "bailey-photos" already exists!');
    } else {
      // Try to create the bucket (this might fail with anon key)
      const { data, error } = await supabase
        .storage
        .createBucket('bailey-photos', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

      if (error) {
        console.error('❌ Could not create bucket with anon key:', error.message);
        console.log('\n📋 Please create the bucket manually in Supabase Dashboard:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to Storage → Create bucket');
        console.log('   4. Name: bailey-photos');
        console.log('   5. Public bucket: YES');
        console.log('   6. File size limit: 10MB');
        console.log('\n   Then run the setup-storage-bucket.sql file in the SQL editor.');
        process.exit(1);
      } else {
        console.log('✅ Created bucket "bailey-photos"');
      }
    }

    console.log('\n✨ Storage setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. If the bucket was created manually, run setup-storage-bucket.sql in Supabase SQL editor');
    console.log('   2. Test photo upload in the gallery');
    console.log('   3. Deploy to production\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupStorage();
