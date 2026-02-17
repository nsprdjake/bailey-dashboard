import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fi API endpoints (reverse-engineered from PyTryFi)
const FI_API_BASE = 'https://api.tryfi.com/';
const FI_AUTH_ENDPOINT = 'auth/login';
const FI_PETS_ENDPOINT = 'pets';

interface FiAuthResponse {
  sessionToken: string;
  userId: string;
}

interface FiPet {
  id: string;
  name: string;
  breed: string;
  dailyGoal: number;
  currentActivity: {
    steps: number;
    distance: number;
    minutes: number;
  };
  location: {
    latitude: number;
    longitude: number;
    placeName: string;
    placeAddress: string;
    timestamp: string;
  };
  device: {
    batteryPercent: number;
    lastSync: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get Fi credentials from environment
    const fiEmail = process.env.FI_EMAIL;
    const fiPassword = process.env.FI_PASSWORD;

    if (!fiEmail || !fiPassword) {
      return NextResponse.json(
        { error: 'Fi credentials not configured' },
        { status: 500 }
      );
    }

    // Authenticate with Fi
    const authResponse = await fetch(`${FI_API_BASE}${FI_AUTH_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: fiEmail,
        password: fiPassword,
      }),
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with Fi');
    }

    const authData: FiAuthResponse = await authResponse.json();

    // Get pets data
    const petsResponse = await fetch(`${FI_API_BASE}${FI_PETS_ENDPOINT}`, {
      headers: {
        'Authorization': `Bearer ${authData.sessionToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!petsResponse.ok) {
      throw new Error('Failed to fetch pets data');
    }

    const pets: FiPet[] = await petsResponse.json();

    // Find Bailey
    const bailey = pets.find(pet => pet.name.toLowerCase() === 'bailey');

    if (!bailey) {
      return NextResponse.json(
        { error: 'Bailey not found in Fi account' },
        { status: 404 }
      );
    }

    // Prepare data for storage
    const activityData = {
      pet_name: bailey.name,
      date: new Date().toISOString().split('T')[0],
      steps: bailey.currentActivity.steps,
      distance_miles: bailey.currentActivity.distance,
      activity_minutes: bailey.currentActivity.minutes,
      daily_goal: bailey.dailyGoal,
      goal_percentage: Math.round((bailey.currentActivity.steps / bailey.dailyGoal) * 100),
      battery_percent: bailey.device.batteryPercent,
      last_sync: bailey.device.lastSync,
      location_lat: bailey.location.latitude,
      location_lng: bailey.location.longitude,
      location_name: bailey.location.placeName,
      location_address: bailey.location.placeAddress,
      created_at: new Date().toISOString(),
    };

    // Check if we already have data for today
    const { data: existingData } = await supabase
      .from('fi_activity_logs')
      .select('id')
      .eq('date', activityData.date)
      .single();

    let result;
    if (existingData) {
      // Update existing record
      result = await supabase
        .from('fi_activity_logs')
        .update(activityData)
        .eq('id', existingData.id);
    } else {
      // Insert new record
      result = await supabase
        .from('fi_activity_logs')
        .insert(activityData);
    }

    if (result.error) {
      throw new Error(`Failed to save Fi data: ${result.error.message}`);
    }

    // Also update the current stats in a summary table (if exists)
    await supabase
      .from('bailey_current_stats')
      .upsert({
        id: 1, // Single row for current stats
        last_fi_sync: new Date().toISOString(),
        current_steps: bailey.currentActivity.steps,
        current_distance: bailey.currentActivity.distance,
        current_battery: bailey.device.batteryPercent,
        current_location: bailey.location.placeName,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      data: {
        steps: bailey.currentActivity.steps,
        distance: bailey.currentActivity.distance,
        battery: bailey.device.batteryPercent,
        location: bailey.location.placeName,
        lastSync: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Fi sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync Fi data' },
      { status: 500 }
    );
  }
}

// GET endpoint to check last sync status
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('bailey_current_stats')
      .select('last_fi_sync, current_steps, current_battery, current_location')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      lastSync: data?.last_fi_sync || null,
      currentSteps: data?.current_steps || 0,
      currentBattery: data?.current_battery || 0,
      currentLocation: data?.current_location || 'Unknown',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}