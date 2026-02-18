import { NextRequest, NextResponse } from 'next/server';

const FI_BASE = 'https://api.tryfi.com';
const BAILEY_PET_ID = '5dnzqk6ykXz7kDTkOFjYKw';

const ACTIVITY_FRAGMENTS = `
fragment ActivitySummaryDetails on ActivitySummary { __typename start end totalSteps stepGoal totalDistance }
`;

const LOCATION_FRAGMENTS = `
fragment PositionCoordinates on Position { __typename latitude longitude }
fragment UserDetails on User { __typename id email firstName lastName }
fragment UncertaintyInfoDetails on UncertaintyInfo { __typename areaName updatedAt circle { __typename radius latitude longitude } }
fragment LocationPoint on Location { __typename date errorRadius position { __typename ...PositionCoordinates } }
fragment PlaceDetails on Place { __typename id name address position { __typename ...PositionCoordinates } radius }
fragment OngoingActivityDetails on OngoingActivity { __typename start presentUser { __typename ...UserDetails } areaName lastReportTimestamp totalSteps ... on OngoingWalk { distance positions { __typename ...LocationPoint } path { __typename ...PositionCoordinates } } ... on OngoingRest { position { __typename ...PositionCoordinates } place { __typename ...PlaceDetails } } }
`;

async function fiLogin(email: string, password: string): Promise<string> {
  // Use undici or http to get raw set-cookie headers
  // But simplest: use the sessionId from login response as a cookie directly
  const res = await fetch(`${FI_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }),
  });

  if (!res.ok) throw new Error(`Fi login failed: ${res.status}`);
  
  // Try to get set-cookie header
  let cookieStr = '';
  
  // Method 1: getSetCookie
  try {
    const setCookies = (res.headers as any).getSetCookie?.();
    if (setCookies && setCookies.length > 0) {
      cookieStr = setCookies.map((c: string) => c.split(';')[0]).join('; ');
    }
  } catch {}

  // Method 2: raw header
  if (!cookieStr) {
    const raw = res.headers.get('set-cookie') || '';
    if (raw) {
      // Multiple cookies may be comma-separated (but careful with Expires dates)
      // Just extract key=value before each semicolon
      const matches = raw.match(/(?:^|,\s*)([^=]+=[^;]+)/g);
      if (matches) {
        cookieStr = matches.map(m => m.replace(/^,\s*/, '').trim()).join('; ');
      }
    }
  }

  // Method 3: If we got the session from response body, try that
  if (!cookieStr) {
    const body = await res.clone().json().catch(() => null);
    if (body?.sessionId) {
      // Try using sessionId directly as fi.sid cookie value
      cookieStr = `fi.sid=${body.sessionId}`;
    }
  }

  // Also consume the body if not already
  await res.json().catch(() => {});

  return cookieStr;
}

async function fiQuery(cookie: string, query: string): Promise<any> {
  const res = await fetch(`${FI_BASE}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const fiEmail = process.env.FI_EMAIL;
    const fiPassword = process.env.FI_PASSWORD;

    if (!fiEmail || !fiPassword) {
      return NextResponse.json({ error: 'Fi credentials not configured' }, { status: 500 });
    }

    const cookie = await fiLogin(fiEmail, fiPassword);
    
    if (!cookie) {
      return NextResponse.json({ error: 'Failed to get Fi session cookie' }, { status: 500 });
    }

    // Test auth with simple query
    const testData = await fiQuery(cookie, `query { pet(id: "${BAILEY_PET_ID}") { name } }`);
    
    if (testData.error || !testData.data?.pet) {
      return NextResponse.json({ 
        error: 'Fi GraphQL auth failed', 
        detail: testData.error?.message || 'No pet data returned',
        cookiePreview: cookie.substring(0, 30) + '...',
      }, { status: 500 });
    }

    // Get activity stats
    const statsQ = `query { pet(id: "${BAILEY_PET_ID}") { dailyStat: currentActivitySummary(period: DAILY) { ...ActivitySummaryDetails } weeklyStat: currentActivitySummary(period: WEEKLY) { ...ActivitySummaryDetails } } } ${ACTIVITY_FRAGMENTS}`;
    const statsData = await fiQuery(cookie, statsQ);

    // Get location
    const locQ = `query { pet(id: "${BAILEY_PET_ID}") { ongoingActivity { __typename ...OngoingActivityDetails } } } ${LOCATION_FRAGMENTS}`;
    const locData = await fiQuery(cookie, locQ);

    // Get device/pet details
    const detailQ = `query { pet(id: "${BAILEY_PET_ID}") { name gender weight breed { name } photos { first { image { fullSize } } } device { lastConnectionState { __typename date ... on ConnectedToCellular { signalStrengthPercent } ... on ConnectedToBase { chargingBase { id } } } ledColor { name hexCode } } } }`;
    const detailData = await fiQuery(cookie, detailQ);

    // Parse
    const daily = statsData?.data?.pet?.dailyStat || {};
    const weekly = statsData?.data?.pet?.weeklyStat || {};
    const activity = locData?.data?.pet?.ongoingActivity || {};
    const pet = detailData?.data?.pet || {};
    const device = pet.device || {};
    const connection = device.lastConnectionState || {};

    let location = activity.areaName || 'Unknown';
    let lat = null, lng = null;
    if (activity.__typename === 'OngoingRest' && activity.position) {
      lat = activity.position.latitude;
      lng = activity.position.longitude;
    }
    if (activity.place) {
      location = activity.place.name || activity.place.address || location;
    }

    return NextResponse.json({
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
        battery: connection.__typename === 'ConnectedToCellular' ? connection.signalStrengthPercent : null,
        connectionType: connection.__typename || 'Unknown',
        connectionDate: connection.date || null,
        ledColor: device.ledColor?.name || null,
        ledHex: device.ledColor?.hexCode || null,
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

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Use POST to sync Fi data' });
}
