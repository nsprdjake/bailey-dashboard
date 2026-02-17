import { NextRequest, NextResponse } from 'next/server';

// Fi uses a GraphQL API
const FI_GRAPHQL_URL = 'https://api.tryfi.com/graphql';

async function fiGraphQL(query: string, variables: Record<string, any> = {}, sessionId?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`;
    headers['cookie'] = `sessionId=${sessionId}`;
  }
  const res = await fetch(FI_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Fi API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');
  return json.data;
}

export async function POST(request: NextRequest) {
  try {
    const fiEmail = process.env.FI_EMAIL;
    const fiPassword = process.env.FI_PASSWORD;

    if (!fiEmail || !fiPassword) {
      return NextResponse.json({ error: 'Fi credentials not configured' }, { status: 500 });
    }

    // Step 1: Authenticate
    const authQuery = `
      mutation signIn($input: SignInInput!) {
        signIn(input: $input) {
          user { id }
          session { token }
          error { message }
        }
      }
    `;
    const authData = await fiGraphQL(authQuery, {
      input: { email: fiEmail, password: fiPassword }
    });

    const session = authData?.signIn?.session;
    const authError = authData?.signIn?.error;
    if (authError) throw new Error(`Fi auth: ${authError.message}`);
    if (!session?.token) throw new Error('No session token from Fi');
    const token = session.token;

    // Step 2: Get current user + pet data
    const petQuery = `
      {
        currentUser {
          userHouseholds {
            household {
              pets {
                id
                name
                breed { name }
                gender
                weight
                photos { first { image { fullSize } } }
                dailyGoal
                currentActivitySummary {
                  steps
                  totalDistance
                  totalActivityDuration
                }
                device {
                  batteryPercent
                  lastHeardFromDevice
                }
                ongoingActivity {
                  presentUser { id }
                  start
                  areaName
                }
              }
            }
          }
        }
      }
    `;
    const petData = await fiGraphQL(petQuery, {}, token);

    // Find Bailey
    const households = petData?.currentUser?.userHouseholds || [];
    let bailey: any = null;
    for (const uh of households) {
      const pets = uh?.household?.pets || [];
      for (const pet of pets) {
        if (pet.name?.toLowerCase() === 'bailey') {
          bailey = pet;
          break;
        }
      }
      if (bailey) break;
    }

    if (!bailey) {
      return NextResponse.json({ error: 'Bailey not found in Fi account' }, { status: 404 });
    }

    const activity = bailey.currentActivitySummary || {};
    const device = bailey.device || {};

    const result = {
      success: true,
      data: {
        name: bailey.name,
        breed: bailey.breed?.name || 'Unknown',
        steps: activity.steps || 0,
        distance: activity.totalDistance || 0,
        activityMinutes: activity.totalActivityDuration || 0,
        dailyGoal: bailey.dailyGoal || 13500,
        goalPercent: bailey.dailyGoal ? Math.round(((activity.steps || 0) / bailey.dailyGoal) * 100) : 0,
        battery: device.batteryPercent || 0,
        lastDeviceSync: device.lastHeardFromDevice || null,
        lastSync: new Date().toISOString(),
      },
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Fi sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync Fi data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Use POST to sync Fi data',
  });
}
