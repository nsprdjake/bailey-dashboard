import { NextRequest, NextResponse } from 'next/server';

const FI_BASE = 'https://api.tryfi.com';
const BAILEY_PET_ID = '5dnzqk6ykXz7kDTkOFjYKw';

// GraphQL fragments from pytryfi
const FRAGMENTS = `
fragment PositionCoordinates on Position { __typename latitude longitude }
fragment UserDetails on User { __typename id email firstName lastName }
fragment UncertaintyInfoDetails on UncertaintyInfo { __typename areaName updatedAt circle { __typename ...CircleDetails } }
fragment CircleDetails on Circle { __typename radius latitude longitude }
fragment LocationPoint on Location { __typename date errorRadius position { __typename ...PositionCoordinates } }
fragment PlaceDetails on Place { __typename id name address position { __typename ...PositionCoordinates } radius }
fragment OngoingActivityDetails on OngoingActivity { __typename start presentUser { __typename ...UserDetails } areaName lastReportTimestamp totalSteps uncertaintyInfo { __typename ...UncertaintyInfoDetails } ... on OngoingWalk { distance positions { __typename ...LocationPoint } path { __typename ...PositionCoordinates } } ... on OngoingRest { position { __typename ...PositionCoordinates } place { __typename ...PlaceDetails } } }
fragment ActivitySummaryDetails on ActivitySummary { __typename start end totalSteps stepGoal dailySteps { __typename date totalSteps stepGoal } totalDistance }
fragment RestSummaryDetails on RestSummary { __typename start end data { __typename ... on ConcreteRestSummaryData { sleepAmounts { __typename type duration } } } }
fragment BreedDetails on Breed { __typename id name }
fragment PhotoDetails on Photo { __typename id image { __typename fullSize } }
fragment LedColorDetails on LedColor { __typename ledColorCode hexCode name }
fragment ConnectionStateDetails on ConnectionState { __typename date ... on ConnectedToUser { user { __typename ...UserDetails } } ... on ConnectedToBase { chargingBase { __typename id } } ... on ConnectedToCellular { signalStrengthPercent } }
fragment OperationParamsDetails on OperationParams { __typename mode ledEnabled }
fragment DeviceDetails on Device { __typename id moduleId hasActiveSubscription lastConnectionState { __typename ...ConnectionStateDetails } ledColor { __typename ...LedColorDetails } operationParams { __typename ...OperationParamsDetails } }
fragment BasePetProfile on BasePet { __typename id name gender weight breed { __typename ...BreedDetails } photos { __typename first { __typename ...PhotoDetails } } }
fragment PetProfile on Pet { __typename ...BasePetProfile device { __typename ...DeviceDetails } }
`;

export async function POST(request: NextRequest) {
  try {
    const fiEmail = process.env.FI_EMAIL;
    const fiPassword = process.env.FI_PASSWORD;

    if (!fiEmail || !fiPassword) {
      return NextResponse.json({ error: 'Fi credentials not configured' }, { status: 500 });
    }

    // Step 1: Login via /auth/login (form POST, like pytryfi does)
    const loginRes = await fetch(`${FI_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: fiEmail, password: fiPassword }),
      redirect: 'manual',
    });

    if (!loginRes.ok && loginRes.status !== 302) {
      const text = await loginRes.text();
      throw new Error(`Fi login failed (${loginRes.status}): ${text}`);
    }

    const loginData = await loginRes.json();
    if (loginData.error) throw new Error(`Fi login error: ${loginData.error.message}`);

    // Extract fi.sid cookie from set-cookie headers
    // Try multiple approaches since different runtimes handle this differently
    let cookieHeader = '';
    
    // Approach 1: getSetCookie() (Node 20+)
    const rawCookies = loginRes.headers.getSetCookie?.() || [];
    if (rawCookies.length > 0) {
      cookieHeader = rawCookies.map((c: string) => c.split(';')[0]).join('; ');
    }
    
    // Approach 2: Iterate headers entries looking for set-cookie
    if (!cookieHeader) {
      const setCookies: string[] = [];
      loginRes.headers.forEach((value: string, key: string) => {
        if (key.toLowerCase() === 'set-cookie') {
          setCookies.push(value.split(';')[0]);
        }
      });
      if (setCookies.length > 0) cookieHeader = setCookies.join('; ');
    }

    // Approach 3: raw get (may concatenate with comma)
    if (!cookieHeader) {
      const raw = loginRes.headers.get('set-cookie') || '';
      // Split on comma but be careful about expires dates
      const parts = raw.split(/,(?=\s*\w+=)/).map(c => c.split(';')[0].trim()).filter(Boolean);
      cookieHeader = parts.join('; ');
    }

    // If we still have nothing, the GraphQL calls will fail with Unauthorized
    if (!cookieHeader) {
      return NextResponse.json({ 
        error: 'Failed to extract session cookie from Fi login',
        debug: { 
          rawCookieCount: rawCookies.length,
          headerKeys: Array.from(loginRes.headers.keys()),
          setCookieRaw: loginRes.headers.get('set-cookie')?.substring(0, 100) || null,
        }
      }, { status: 500 });
    }

    // Step 2: Get pet activity stats
    const statsQuery = `query { pet (id: "${BAILEY_PET_ID}") { dailyStat: currentActivitySummary (period: DAILY) { ...ActivitySummaryDetails } weeklyStat: currentActivitySummary (period: WEEKLY) { ...ActivitySummaryDetails } } }` + FRAGMENTS;

    const statsRes = await fetch(`${FI_BASE}/graphql?query=${encodeURIComponent(statsQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        
      },
    });
    const statsData = await statsRes.json();

    // Step 3: Get location
    const locQuery = `query { pet (id: "${BAILEY_PET_ID}") { ongoingActivity { __typename ...OngoingActivityDetails } } }` + FRAGMENTS;

    const locRes = await fetch(`${FI_BASE}/graphql?query=${encodeURIComponent(locQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        
      },
    });
    const locData = await locRes.json();

    // Step 4: Get rest/sleep stats
    const restQuery = `query { pet (id: "${BAILEY_PET_ID}") { dailyStat: restSummaryFeed(cursor: null, period: DAILY, limit: 1) { __typename restSummaries { __typename ...RestSummaryDetails } } } }` + FRAGMENTS;

    const restRes = await fetch(`${FI_BASE}/graphql?query=${encodeURIComponent(restQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        
      },
    });
    const restData = await restRes.json();

    // Step 5: Get device details
    const deviceQuery = `query { pet (id: "${BAILEY_PET_ID}") { __typename ...PetProfile } }` + FRAGMENTS;

    const deviceRes = await fetch(`${FI_BASE}/graphql?query=${encodeURIComponent(deviceQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        
      },
    });
    const deviceData = await deviceRes.json();

    // Parse results
    const daily = statsData?.data?.pet?.dailyStat || {};
    const weekly = statsData?.data?.pet?.weeklyStat || {};
    const activity = locData?.data?.pet?.ongoingActivity || {};
    const restSummaries = restData?.data?.pet?.dailyStat?.restSummaries || [];
    const pet = deviceData?.data?.pet || {};
    const device = pet.device || {};
    const connection = device.lastConnectionState || {};

    // Build location info
    let location = activity.areaName || 'Unknown';
    let lat = null, lng = null;
    if (activity.__typename === 'OngoingRest' && activity.position) {
      lat = activity.position.latitude;
      lng = activity.position.longitude;
    }
    if (activity.place) {
      location = activity.place.name || activity.place.address || location;
    }

    // Build sleep data
    let sleepData = null;
    if (restSummaries.length > 0) {
      const rest = restSummaries[0];
      sleepData = {
        start: rest.start,
        end: rest.end,
        amounts: rest.data?.sleepAmounts || [],
      };
    }

    const result = {
      success: true,
      data: {
        name: pet.name || 'Bailey',
        breed: pet.breed?.name || 'American Pit Bull Terrier',
        weight: pet.weight,
        photo: pet.photos?.first?.image?.fullSize || null,
        steps: daily.totalSteps || 0,
        dailyGoal: daily.stepGoal || 13500,
        goalPercent: daily.stepGoal ? Math.round(((daily.totalSteps || 0) / daily.stepGoal) * 100) : 0,
        distance: daily.totalDistance || 0,
        weeklySteps: weekly.totalSteps || 0,
        weeklyDistance: weekly.totalDistance || 0,
        activityType: activity.__typename || 'Unknown',
        activityStart: activity.start || null,
        totalActivitySteps: activity.totalSteps || 0,
        location,
        lat,
        lng,
        sleep: sleepData,
        battery: connection.__typename === 'ConnectedToCellular' ? connection.signalStrengthPercent : null,
        connectionType: connection.__typename || 'Unknown',
        connectionDate: connection.date || null,
        ledColor: device.ledColor?.name || null,
        ledHex: device.ledColor?.hexCode || null,
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

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Use POST to sync Fi data' });
}
