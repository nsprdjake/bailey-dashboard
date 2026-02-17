#!/usr/bin/env python3
"""
Bailey Dashboard - Fi Collar API Sync Script
Syncs activity, walks, sleep, and location data from Fi collar to Supabase
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import json
import asyncio

try:
    from pytryfi import PyTryFi
    from pytryfi.fiHousehold import FiHousehold
    from pytryfi.pet import Pet
except ImportError:
    print("ERROR: pytryfi not installed. Run: pip install pytryfi")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: python-dotenv not installed. Run: pip install python-dotenv")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# Load environment variables
load_dotenv('.env.local')

# Fi credentials
FI_EMAIL = os.getenv('FI_EMAIL')
FI_PASSWORD = os.getenv('FI_PASSWORD')

# Supabase credentials
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Configuration
DAYS_TO_SYNC = int(os.getenv('FI_SYNC_DAYS', '7'))  # Default to last 7 days
DRY_RUN = os.getenv('DRY_RUN', 'false').lower() == 'true'

class SupabaseClient:
    """Simple Supabase client for data operations"""
    
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def _request(self, method: str, table: str, data: Optional[Dict] = None, params: Optional[Dict] = None):
        """Make request to Supabase"""
        url = f"{self.url}/rest/v1/{table}"
        
        try:
            if method == 'GET':
                resp = requests.get(url, headers=self.headers, params=params)
            elif method == 'POST':
                resp = requests.post(url, headers=self.headers, json=data)
            elif method == 'PATCH':
                resp = requests.patch(url, headers=self.headers, json=data, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            resp.raise_for_status()
            return resp.json() if resp.text else None
        except requests.exceptions.RequestException as e:
            print(f"Supabase request error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
            raise
    
    def insert(self, table: str, data: Dict | List[Dict]):
        """Insert data into table"""
        return self._request('POST', table, data=data)
    
    def select(self, table: str, params: Optional[Dict] = None):
        """Select data from table"""
        return self._request('GET', table, params=params)
    
    def upsert(self, table: str, data: Dict | List[Dict], on_conflict: str = ''):
        """Upsert data (insert or update on conflict)"""
        headers = self.headers.copy()
        headers['Prefer'] = f'resolution=merge-duplicates,return=representation'
        
        url = f"{self.url}/rest/v1/{table}"
        resp = requests.post(url, headers=headers, json=data)
        resp.raise_for_status()
        return resp.json() if resp.text else None


class FiSync:
    """Fi Collar sync manager"""
    
    def __init__(self):
        self.validate_config()
        self.supabase = SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        self.fi_client = None
        self.pet = None
        self.sync_log_id = None
        self.stats = {
            'activities': 0,
            'walks': 0,
            'sleep_records': 0,
            'locations': 0
        }
    
    def validate_config(self):
        """Validate required environment variables"""
        if not FI_EMAIL or not FI_PASSWORD:
            raise ValueError("FI_EMAIL and FI_PASSWORD must be set in .env.local")
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local")
    
    def log_sync_start(self, sync_type: str = 'manual'):
        """Log sync start"""
        log_entry = {
            'sync_type': sync_type,
            'started_at': datetime.now(timezone.utc).isoformat(),
            'status': 'running'
        }
        
        if not DRY_RUN:
            result = self.supabase.insert('bailey_fi_sync_log', log_entry)
            if result and len(result) > 0:
                self.sync_log_id = result[0].get('id')
        
        print(f"🚀 Sync started ({sync_type} mode)")
    
    def log_sync_complete(self, success: bool = True, error: Optional[str] = None):
        """Log sync completion"""
        if not self.sync_log_id or DRY_RUN:
            return
        
        update_data = {
            'completed_at': datetime.now(timezone.utc).isoformat(),
            'status': 'success' if success else 'failed',
            'records_synced': sum(self.stats.values()),
            'error_message': error
        }
        
        self.supabase._request(
            'PATCH',
            'bailey_fi_sync_log',
            data=update_data,
            params={'id': f'eq.{self.sync_log_id}'}
        )
    
    async def connect_fi(self):
        """Connect to Fi API and get pet"""
        print("🔌 Connecting to Fi API...")
        
        try:
            self.fi_client = PyTryFi(FI_EMAIL, FI_PASSWORD)
            await self.fi_client.login()
            
            # Get household and pets
            households = await self.fi_client.get_households()
            if not households:
                raise ValueError("No households found")
            
            household: FiHousehold = households[0]
            pets = await household.get_pets()
            
            if not pets:
                raise ValueError("No pets found in household")
            
            # Use first pet (Bailey)
            self.pet: Pet = pets[0]
            print(f"✅ Connected! Found pet: {self.pet.name}")
            
        except Exception as e:
            print(f"❌ Fi connection error: {e}")
            raise
    
    def sync_daily_activity(self, date: datetime):
        """Sync daily activity summary for a specific date"""
        if not self.pet:
            raise ValueError("Pet not initialized")
        
        date_str = date.strftime('%Y-%m-%d')
        print(f"📊 Syncing activity for {date_str}...")
        
        try:
            # Get daily stats from Fi
            # Note: pytryfi may have different methods - adjust as needed
            stats = self.pet.daily_stats.get(date_str, {})
            
            if not stats:
                print(f"  ⏭️  No data for {date_str}")
                return
            
            activity_data = {
                'date': date_str,
                'total_steps': stats.get('step_count', 0),
                'total_distance_meters': stats.get('distance', 0),
                'total_calories': stats.get('calories', 0),
                'walk_count': stats.get('num_walks', 0),
                'rest_minutes': stats.get('rest_minutes', 0),
                'nap_minutes': stats.get('nap_minutes', 0),
                'active_minutes': stats.get('active_minutes', 0),
                'play_minutes': stats.get('play_minutes', 0),
                'daily_goal_steps': stats.get('goal', 10000),
                'goal_achieved': stats.get('step_count', 0) >= stats.get('goal', 10000),
                'synced_at': datetime.now(timezone.utc).isoformat()
            }
            
            if DRY_RUN:
                print(f"  [DRY RUN] Would upsert activity: {activity_data}")
            else:
                self.supabase.upsert('bailey_fi_activity', activity_data)
                self.stats['activities'] += 1
                print(f"  ✅ Activity synced: {activity_data['total_steps']} steps")
                
        except Exception as e:
            print(f"  ❌ Error syncing activity: {e}")
    
    def sync_walks(self, date: datetime):
        """Sync walks for a specific date"""
        if not self.pet:
            raise ValueError("Pet not initialized")
        
        date_str = date.strftime('%Y-%m-%d')
        print(f"🚶 Syncing walks for {date_str}...")
        
        try:
            # Get walks from Fi (adjust API call as needed)
            walks = getattr(self.pet, 'walks', {}).get(date_str, [])
            
            for walk in walks:
                walk_data = {
                    'fi_walk_id': walk.get('id'),
                    'date': date_str,
                    'duration_minutes': walk.get('duration', 0) // 60,
                    'steps': walk.get('steps', 0),
                    'distance_meters': walk.get('distance', 0),
                    'calories': walk.get('calories', 0),
                    'start_time': walk.get('start_time'),
                    'end_time': walk.get('end_time'),
                    'avg_speed_mph': walk.get('avg_speed', 0),
                    'location': walk.get('location', 'Unknown'),
                    'notes': f"Synced from Fi collar",
                    'synced_from_fi': True
                }
                
                if DRY_RUN:
                    print(f"  [DRY RUN] Would insert walk: {walk_data}")
                else:
                    # Check if walk already exists
                    existing = self.supabase.select(
                        'bailey_walks',
                        params={'fi_walk_id': f"eq.{walk_data['fi_walk_id']}"}
                    )
                    
                    if not existing:
                        self.supabase.insert('bailey_walks', walk_data)
                        self.stats['walks'] += 1
                        print(f"  ✅ Walk synced: {walk_data['duration_minutes']}min, {walk_data['steps']} steps")
                    else:
                        print(f"  ⏭️  Walk already exists: {walk_data['fi_walk_id']}")
                        
        except Exception as e:
            print(f"  ❌ Error syncing walks: {e}")
    
    def sync_sleep(self, date: datetime):
        """Sync sleep/rest data for a specific date"""
        if not self.pet:
            raise ValueError("Pet not initialized")
        
        date_str = date.strftime('%Y-%m-%d')
        print(f"😴 Syncing sleep for {date_str}...")
        
        try:
            # Get sleep/rest periods from Fi
            sleep_data = getattr(self.pet, 'sleep', {}).get(date_str, [])
            
            for period in sleep_data:
                sleep_record = {
                    'date': date_str,
                    'sleep_type': period.get('type', 'rest'),  # nap, rest, deep_sleep
                    'start_time': period.get('start_time'),
                    'end_time': period.get('end_time'),
                    'duration_minutes': period.get('duration', 0) // 60,
                    'quality_score': period.get('quality', None)
                }
                
                if DRY_RUN:
                    print(f"  [DRY RUN] Would insert sleep: {sleep_record}")
                else:
                    self.supabase.insert('bailey_fi_sleep', sleep_record)
                    self.stats['sleep_records'] += 1
                    print(f"  ✅ Sleep synced: {sleep_record['sleep_type']}, {sleep_record['duration_minutes']}min")
                    
        except Exception as e:
            print(f"  ❌ Error syncing sleep: {e}")
    
    async def run_sync(self, sync_type: str = 'manual'):
        """Run complete sync process"""
        try:
            self.log_sync_start(sync_type)
            
            # Connect to Fi
            await self.connect_fi()
            
            # Sync data for the last N days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=DAYS_TO_SYNC)
            
            print(f"\n📅 Syncing {DAYS_TO_SYNC} days of data ({start_date.date()} to {end_date.date()})")
            print("=" * 60)
            
            current_date = start_date
            while current_date <= end_date:
                print(f"\n📆 Processing {current_date.date()}")
                print("-" * 60)
                
                self.sync_daily_activity(current_date)
                self.sync_walks(current_date)
                self.sync_sleep(current_date)
                
                current_date += timedelta(days=1)
            
            # Summary
            print("\n" + "=" * 60)
            print("✅ SYNC COMPLETE!")
            print(f"📊 Activities synced: {self.stats['activities']}")
            print(f"🚶 Walks synced: {self.stats['walks']}")
            print(f"😴 Sleep records synced: {self.stats['sleep_records']}")
            print(f"📍 Total records: {sum(self.stats.values())}")
            
            if DRY_RUN:
                print("\n⚠️  DRY RUN MODE - No data was actually saved")
            
            self.log_sync_complete(success=True)
            
        except Exception as e:
            print(f"\n❌ SYNC FAILED: {e}")
            self.log_sync_complete(success=False, error=str(e))
            raise
        finally:
            # Logout from Fi
            if self.fi_client:
                try:
                    await self.fi_client.logout()
                except:
                    pass


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Sync Bailey Fi collar data to Supabase')
    parser.add_argument('--type', choices=['manual', 'auto', 'cron'], default='manual',
                       help='Sync type for logging')
    parser.add_argument('--days', type=int, help='Number of days to sync (overrides env)')
    parser.add_argument('--dry-run', action='store_true', help='Run without saving to database')
    
    args = parser.parse_args()
    
    # Override env vars if provided
    if args.days:
        global DAYS_TO_SYNC
        DAYS_TO_SYNC = args.days
    
    if args.dry_run:
        global DRY_RUN
        DRY_RUN = True
    
    # Run sync
    syncer = FiSync()
    asyncio.run(syncer.run_sync(sync_type=args.type))


if __name__ == '__main__':
    main()
