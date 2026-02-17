# Fi Collar Integration Setup Guide

## Overview

This integration syncs Bailey's activity data from her Fi collar to the Bailey Dashboard, including:
- **Daily Activity**: Steps, distance, calories, active time
- **Walks**: Individual walk details with GPS tracking
- **Sleep**: Naps, rest periods, and sleep quality
- **Locations**: GPS coordinates for each walk

## Prerequisites

1. **Fi Collar Account**: You need Jake's Fi collar credentials
2. **Python 3.9+**: Already set up in `venv/`
3. **Supabase Database**: Already configured

## Step 1: Install Dependencies (Already Done)

```bash
cd bailey-dashboard
python3 -m venv venv
source venv/bin/activate
pip install pytryfi python-dotenv
```

## Step 2: Database Setup

Run the Fi schema enhancement in your Supabase SQL editor:

```bash
# The schema is in: supabase-schema-fi.sql
# Copy and paste the contents into Supabase SQL Editor and run it
```

This creates the following tables:
- `bailey_fi_activity` - Daily activity summaries
- `bailey_fi_locations` - GPS location data
- `bailey_fi_sleep` - Sleep and rest tracking
- `bailey_fi_sync_log` - Sync history
- Enhances `bailey_walks` with Fi collar fields

## Step 3: Configure Fi Credentials

Add the following to your `.env.local` file:

```env
# Fi Collar Credentials
FI_EMAIL=jake@example.com
FI_PASSWORD=your_fi_password_here

# Optional Configuration
FI_SYNC_DAYS=7          # Number of days to sync (default: 7)
DRY_RUN=false           # Set to true for testing without saving
```

**Security Note**: Never commit `.env.local` to git. It's already in `.gitignore`.

## Step 4: Test Manual Sync

Before setting up auto-sync, test the integration:

```bash
cd bailey-dashboard
source venv/bin/activate

# Dry run (won't save to database)
python3 fi-sync.py --dry-run

# Real sync for last 2 days
python3 fi-sync.py --days 2

# Full 7-day sync
python3 fi-sync.py
```

Expected output:
```
🚀 Sync started (manual mode)
🔌 Connecting to Fi API...
✅ Connected! Found pet: Bailey

📅 Syncing 7 days of data (2026-02-08 to 2026-02-15)
============================================================

📆 Processing 2026-02-08
------------------------------------------------------------
📊 Syncing activity for 2026-02-08...
  ✅ Activity synced: 8542 steps
🚶 Syncing walks for 2026-02-08...
  ✅ Walk synced: 25min, 3421 steps
😴 Syncing sleep for 2026-02-08...
  ✅ Sleep synced: nap, 135min

[...]

============================================================
✅ SYNC COMPLETE!
📊 Activities synced: 7
🚶 Walks synced: 18
😴 Sleep records synced: 12
📍 Total records: 37
```

## Step 5: Set Up Auto-Sync (Cron Job)

### Option A: Daily Auto-Sync (Recommended)

Add this to your crontab to sync daily at 6 AM:

```bash
# Edit crontab
crontab -e

# Add this line (replace /path/to with actual path):
0 6 * * * /path/to/bailey-dashboard/fi-sync-cron.sh >> /path/to/bailey-dashboard/logs/fi-sync.log 2>&1
```

### Option B: Multiple Daily Syncs

```bash
# 6 AM sync (morning)
0 6 * * * /path/to/bailey-dashboard/fi-sync-cron.sh >> /path/to/bailey-dashboard/logs/fi-sync.log 2>&1

# 6 PM sync (evening)
0 18 * * * /path/to/bailey-dashboard/fi-sync-cron.sh >> /path/to/bailey-dashboard/logs/fi-sync.log 2>&1
```

### Verify Cron Setup

```bash
# View current crontab
crontab -l

# Check sync logs
tail -f bailey-dashboard/logs/fi-sync.log
```

## Step 6: Use Manual Sync in Dashboard

1. Navigate to **Fi Activity** page in the dashboard
2. Click **"Sync from Fi"** button
3. Wait for sync to complete (10-30 seconds)
4. Data will automatically refresh

The manual sync endpoint is at: `/api/fi-sync`

## Sync Types

The system logs three types of syncs:

1. **manual**: Triggered from dashboard UI
2. **auto**: Programmatic syncs (via API)
3. **cron**: Scheduled cron job syncs

View sync history in the `bailey_fi_sync_log` table.

## Troubleshooting

### Issue: "Fi connection error"

**Solution**: Check Fi credentials in `.env.local`

```bash
# Test login separately
python3 -c "
from pytryfi import PyTryFi
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('.env.local')
client = PyTryFi(os.getenv('FI_EMAIL'), os.getenv('FI_PASSWORD'))
asyncio.run(client.login())
print('Login successful!')
"
```

### Issue: "Supabase request error"

**Solution**: Verify Supabase credentials and check the Fi schema is installed

```bash
# Check if tables exist
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

supabase.from('bailey_fi_activity').select('*').limit(1).then(console.log);
"
```

### Issue: "No data for date"

**Possible causes**:
1. Fi collar wasn't worn that day
2. Battery was dead
3. No cellular connection for sync

**Solution**: This is normal - the script will skip dates with no data

### Issue: Cron job not running

**Debug steps**:

```bash
# Check cron service is running
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Run script manually to test
/path/to/bailey-dashboard/fi-sync-cron.sh

# Check script permissions
ls -la bailey-dashboard/fi-sync-cron.sh  # Should be executable
```

## Data Fields Reference

### Daily Activity (`bailey_fi_activity`)
- `total_steps`: Total steps for the day
- `total_distance_meters`: Total distance in meters
- `total_calories`: Calories burned
- `walk_count`: Number of walks
- `rest_minutes`: Total rest time
- `nap_minutes`: Total nap time
- `active_minutes`: Total active time
- `play_minutes`: Total play time
- `daily_goal_steps`: Daily step goal (usually 10,000)
- `goal_achieved`: Boolean - did Bailey meet her goal?

### Enhanced Walks (`bailey_walks`)
- `fi_walk_id`: Unique Fi walk identifier
- `steps`: Steps during walk
- `distance_meters`: Walk distance
- `calories`: Calories burned
- `start_time`: Walk start timestamp
- `end_time`: Walk end timestamp
- `avg_speed_mph`: Average speed
- `synced_from_fi`: Boolean flag

### Sleep Data (`bailey_fi_sleep`)
- `sleep_type`: 'nap', 'rest', or 'deep_sleep'
- `start_time`: Sleep period start
- `end_time`: Sleep period end
- `duration_minutes`: Duration in minutes
- `quality_score`: Sleep quality (1-10)

## Performance Notes

- **Sync Duration**: 10-30 seconds for 7 days of data
- **API Rate Limits**: Fi API has rate limits - avoid syncing more than once per hour
- **Data Volume**: ~50-100 records per day (activities + walks + sleep)
- **Storage**: Minimal - a year of data is < 100 MB

## API Integration

### Trigger Sync Programmatically

```javascript
// From frontend
const response = await fetch('/api/fi-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    days: 7,      // Optional: number of days to sync
    dryRun: false // Optional: test mode
  })
});

const result = await response.json();
console.log(result.stats); // { activities: 7, walks: 18, ... }
```

### Check Sync Status

```javascript
// GET request
const response = await fetch('/api/fi-sync');
const status = await response.json();
// { available: true, message: "...", defaultDays: 7 }
```

## Maintenance

### View Sync History

```sql
-- In Supabase SQL Editor
SELECT 
  sync_type,
  started_at,
  completed_at,
  status,
  records_synced,
  error_message
FROM bailey_fi_sync_log
ORDER BY started_at DESC
LIMIT 20;
```

### Clear Old Data

```sql
-- Delete data older than 90 days (optional)
DELETE FROM bailey_fi_activity WHERE date < NOW() - INTERVAL '90 days';
DELETE FROM bailey_fi_sleep WHERE date < NOW() - INTERVAL '90 days';
DELETE FROM bailey_fi_locations 
WHERE walk_id IN (
  SELECT id FROM bailey_walks WHERE date < NOW() - INTERVAL '90 days'
);
```

### Backup Data

```bash
# Export Fi data
python3 -c "
from lib.supabase import supabase
import json

data = supabase.from('bailey_fi_activity').select('*').execute()
with open('fi-backup.json', 'w') as f:
    json.dump(data.data, f, indent=2)
"
```

## Feature Roadmap

Future enhancements:
- [ ] GPS map visualization for walks
- [ ] Activity trends and analytics
- [ ] Goal setting and achievement tracking
- [ ] Push notifications for low activity
- [ ] Weekly/monthly reports
- [ ] Compare with other dogs (Fi community data)

## Support

If you encounter issues:
1. Check this documentation
2. Review sync logs in `logs/fi-sync.log`
3. Check `bailey_fi_sync_log` table for error messages
4. Test Fi API connection separately
5. Verify Supabase credentials and schema

---

**Last Updated**: February 15, 2026  
**Version**: 1.0  
**Maintainer**: OpenClaw Subagent
