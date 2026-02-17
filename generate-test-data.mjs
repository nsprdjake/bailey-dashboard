#!/usr/bin/env node
/**
 * Generate realistic test data for Fi collar integration
 * Useful for testing without Fi credentials
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getDateString(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function getTimestamp(daysAgo, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function generateTestData() {
  console.log('🧪 Generating Fi collar test data...\n');

  const days = 14; // Generate 2 weeks of data
  const activities = [];
  const walks = [];
  const sleepRecords = [];

  for (let i = 0; i < days; i++) {
    const date = getDateString(i);
    const isActiveDay = Math.random() > 0.2; // 80% active days
    
    // Generate daily activity
    if (isActiveDay) {
      const steps = randomInt(6000, 15000);
      const goalSteps = 10000;
      const distance = steps * 0.7; // ~0.7 meters per step
      const calories = Math.round(steps * 0.04); // ~0.04 calories per step
      const walkCount = randomInt(2, 5);
      
      const activity = {
        date,
        total_steps: steps,
        total_distance_meters: distance,
        total_calories: calories,
        walk_count: walkCount,
        rest_minutes: randomInt(600, 900), // 10-15 hours rest
        nap_minutes: randomInt(90, 180), // 1.5-3 hours naps
        active_minutes: randomInt(180, 300), // 3-5 hours active
        play_minutes: randomInt(30, 90), // 30-90 min play
        daily_goal_steps: goalSteps,
        goal_achieved: steps >= goalSteps,
        synced_at: new Date().toISOString(),
      };
      
      activities.push(activity);
      
      // Generate walks for this day
      for (let w = 0; w < walkCount; w++) {
        const walkHour = randomInt(7, 20); // Walks between 7am-8pm
        const duration = randomInt(15, 45);
        const walkSteps = randomInt(1000, 4000);
        const walkDistance = walkSteps * 0.7;
        
        const walk = {
          fi_walk_id: `test_${date}_${w}`,
          date,
          duration_minutes: duration,
          steps: walkSteps,
          distance_meters: walkDistance,
          calories: Math.round(walkSteps * 0.04),
          start_time: getTimestamp(i, walkHour),
          end_time: getTimestamp(i, walkHour, duration),
          avg_speed_mph: randomFloat(2.0, 3.5).toFixed(2),
          location: ['Neighborhood Loop', 'Dog Park', 'Riverside Trail', 'Downtown', 'Forest Path'][randomInt(0, 4)],
          notes: 'Auto-synced from Fi collar (test data)',
          synced_from_fi: true,
        };
        
        walks.push(walk);
      }
      
      // Generate sleep records
      // Nap during day
      const napCount = randomInt(1, 3);
      for (let n = 0; n < napCount; n++) {
        const napHour = randomInt(12, 16);
        const napDuration = randomInt(45, 120);
        
        sleepRecords.push({
          date,
          sleep_type: 'nap',
          start_time: getTimestamp(i, napHour),
          end_time: getTimestamp(i, napHour, napDuration),
          duration_minutes: napDuration,
          quality_score: randomInt(6, 10),
        });
      }
      
      // Night rest
      const nightDuration = randomInt(480, 600); // 8-10 hours
      sleepRecords.push({
        date,
        sleep_type: 'rest',
        start_time: getTimestamp(i, 22), // 10 PM
        end_time: getTimestamp(i - 1, 6 + Math.floor(nightDuration / 60)), // Next morning
        duration_minutes: nightDuration,
        quality_score: randomInt(7, 10),
      });
    }
  }

  console.log(`Generated ${activities.length} daily activities`);
  console.log(`Generated ${walks.length} walks`);
  console.log(`Generated ${sleepRecords.length} sleep records\n`);

  // Insert data
  console.log('📊 Inserting activities...');
  const { error: actError } = await supabase
    .from('bailey_fi_activity')
    .upsert(activities, { onConflict: 'date' });
  
  if (actError) {
    console.error('❌ Error inserting activities:', actError);
  } else {
    console.log(`✅ Inserted ${activities.length} activities`);
  }

  console.log('🚶 Inserting walks...');
  const { error: walkError } = await supabase
    .from('bailey_walks')
    .upsert(walks, { onConflict: 'fi_walk_id' });
  
  if (walkError) {
    console.error('❌ Error inserting walks:', walkError);
  } else {
    console.log(`✅ Inserted ${walks.length} walks`);
  }

  console.log('😴 Inserting sleep records...');
  for (const sleep of sleepRecords) {
    const { error } = await supabase
      .from('bailey_fi_sleep')
      .insert(sleep);
    
    if (error && error.code !== '23505') { // Ignore duplicates
      console.error('❌ Error inserting sleep:', error);
    }
  }
  console.log(`✅ Inserted ${sleepRecords.length} sleep records`);

  console.log('\n✨ Test data generation complete!');
  console.log('\n📋 Summary:');
  console.log(`   - Date range: ${getDateString(days - 1)} to ${getDateString(0)}`);
  console.log(`   - Total records: ${activities.length + walks.length + sleepRecords.length}`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Visit http://localhost:3000/activity to view the data');
  console.log('   2. Test the charts and visualizations');
  console.log('   3. Try the manual sync button (will show test data)');
}

generateTestData().catch(console.error);
