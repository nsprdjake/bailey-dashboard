#!/usr/bin/env python3
"""
Bailey Dashboard - Fi Collar API Sync Script (Working Version)
Syncs activity data from Fi collar to Supabase
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Union
import json
import requests
from dotenv import load_dotenv
from pytryfi import PyTryFi

# Load environment variables
load_dotenv('.env.local')

# Fi credentials
FI_EMAIL = os.getenv('FI_EMAIL')
FI_PASSWORD = os.getenv('FI_PASSWORD')

# Supabase credentials
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Configuration
DAYS_TO_SYNC = int(os.getenv('FI_SYNC_DAYS', '7'))


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
    
    def insert(self, table: str, data: Union[Dict, List[Dict]]):
        """Insert data into table"""
        url = f"{self.url}/rest/v1/{table}"
        resp = requests.post(url, headers=self.headers, json=data)
        if resp.status_code != 201:
            print(f"Insert failed ({resp.status_code}): {resp.text}")
            return None
        return resp.json() if resp.text else None
    
    def upsert(self, table: str, data: Union[Dict, List[Dict]]):
        """Upsert data (insert or update on conflict)"""
        headers = self.headers.copy()
        headers['Prefer'] = 'resolution=merge-duplicates,return=representation'
        
        url = f"{self.url}/rest/v1/{table}"
        resp = requests.post(url, headers=headers, json=data)
        if resp.status_code not in (200, 201):
            print(f"Upsert failed ({resp.status_code}): {resp.text}")
            return None
        return resp.json() if resp.text else None


def sync_fi_data(dry_run: bool = False, sync_type: str = 'manual'):
    """Main sync function"""
    print(f"🐕 Bailey Fi Collar Sync Starting ({sync_type} mode)...")
    
    # Check credentials
    if not all([FI_EMAIL, FI_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY]):
        print("❌ Missing required environment variables!")
        return False
    
    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Log sync start
    if not dry_run:
        log_entry = {
            'sync_type': sync_type,
            'started_at': datetime.now(timezone.utc).isoformat(),
            'status': 'running'
        }
        sync_log = supabase.insert('bailey_fi_sync_log', log_entry)
        sync_log_id = sync_log[0]['id'] if sync_log else None
    
    stats = {
        'activities': 0,
        'walks': 0,
        'sleep_records': 0
    }
    
    try:
        # Connect to Fi
        print(f"📱 Connecting to Fi with {FI_EMAIL}...")
        pytryfi = PyTryFi(username=FI_EMAIL, password=FI_PASSWORD)
        print("✅ Successfully logged into Fi!")
        
        # Get Bailey
        pets = pytryfi.pets
        bailey = None
        for pet in pets:
            if pet.name.lower() == 'bailey':
                bailey = pet
                break
        
        if not bailey:
            raise ValueError(f"Bailey not found. Available pets: {[p.name for p in pets]}")
        
        print(f"✅ Found Bailey!")
        
        # Get current date
        today = datetime.now().date()
        
        # Sync today's activity
        print(f"\n📊 Syncing activity for {today}...")
        
        activity_data = {
            'date': today.isoformat(),
            'total_steps': getattr(bailey, 'totalSteps', 0) or 0,
            'total_distance_meters': getattr(bailey, 'totalDistance', 0) or 0,
            'daily_goal_steps': getattr(bailey, 'dailyGoal', 10000) or 10000,
            'goal_achieved': (getattr(bailey, 'totalSteps', 0) or 0) >= (getattr(bailey, 'dailyGoal', 10000) or 10000),
            'nap_minutes': getattr(bailey, 'napMinutes', 0) or 0,
            'rest_minutes': getattr(bailey, 'restMinutes', 0) or 0,
            'walk_count': getattr(bailey, 'walkCount', 0) or 0,
            'synced_at': datetime.now(timezone.utc).isoformat()
        }
        
        if dry_run:
            print(f"  [DRY RUN] Would upsert activity: {activity_data}")
        else:
            result = supabase.upsert('bailey_fi_activity', activity_data)
            if result:
                stats['activities'] += 1
                print(f"  ✅ Activity synced: {activity_data['total_steps']} steps")
        
        # If there's an active walk, sync it
        if hasattr(bailey, 'activityType') and bailey.activityType == 'Walk':
            print(f"\n🚶 Syncing active walk...")
            
            walk_data = {
                'date': today.isoformat(),
                'location': getattr(bailey, 'currPlaceName', 'Unknown'),
                'notes': f"Synced from Fi collar - Currently walking",
                'synced_from_fi': True,
                'start_time': getattr(bailey, 'currStartTime', None)
            }
            
            # Estimate duration if start time is available
            if walk_data['start_time']:
                start = datetime.fromisoformat(str(walk_data['start_time']).replace('Z', '+00:00'))
                duration = datetime.now(timezone.utc) - start
                walk_data['duration_minutes'] = int(duration.total_seconds() / 60)
            else:
                walk_data['duration_minutes'] = 0
            
            if dry_run:
                print(f"  [DRY RUN] Would insert walk: {walk_data}")
            else:
                result = supabase.insert('bailey_walks', walk_data)
                if result:
                    stats['walks'] += 1
                    print(f"  ✅ Active walk synced")
        
        # Sync sleep data if in rest/nap
        if hasattr(bailey, 'activityType') and bailey.activityType in ['Rest', 'OngoingRest', 'Nap']:
            print(f"\n😴 Syncing current rest/sleep...")
            
            sleep_type = 'nap' if 'Nap' in bailey.activityType else 'rest'
            sleep_data = {
                'date': today.isoformat(),
                'sleep_type': sleep_type,
                'start_time': str(getattr(bailey, 'currStartTime', None)) if getattr(bailey, 'currStartTime', None) else None,
                'end_time': datetime.now(timezone.utc).isoformat(),  # Ongoing
                'duration_minutes': 0
            }
            
            # Calculate duration if start time is available
            if sleep_data['start_time']:
                start = datetime.fromisoformat(str(sleep_data['start_time']).replace('Z', '+00:00'))
                duration = datetime.now(timezone.utc) - start
                sleep_data['duration_minutes'] = int(duration.total_seconds() / 60)
            
            if dry_run:
                print(f"  [DRY RUN] Would insert sleep: {sleep_data}")
            else:
                result = supabase.insert('bailey_fi_sleep', sleep_data)
                if result:
                    stats['sleep_records'] += 1
                    print(f"  ✅ {sleep_type.title()} synced: {sleep_data['duration_minutes']} minutes")
        
        # Summary
        print("\n" + "="*60)
        print("✅ SYNC COMPLETE!")
        print(f"📊 Activities synced: {stats['activities']}")
        print(f"🚶 Walks synced: {stats['walks']}")
        print(f"😴 Sleep records synced: {stats['sleep_records']}")
        print(f"📍 Total records: {sum(stats.values())}")
        
        if dry_run:
            print("\n⚠️  DRY RUN MODE - No data was actually saved")
        
        # Log sync completion
        if not dry_run and sync_log_id:
            update_data = {
                'id': sync_log_id,
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'status': 'success',
                'records_synced': sum(stats.values())
            }
            supabase.upsert('bailey_fi_sync_log', update_data)
        
        return True
        
    except Exception as e:
        print(f"\n❌ SYNC FAILED: {e}")
        
        # Log sync failure
        if not dry_run and sync_log_id:
            update_data = {
                'id': sync_log_id,
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'status': 'failed',
                'error_message': str(e)
            }
            supabase.upsert('bailey_fi_sync_log', update_data)
        
        return False


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Sync Bailey Fi collar data to Supabase')
    parser.add_argument('--type', choices=['manual', 'auto', 'cron'], default='manual',
                       help='Sync type for logging')
    parser.add_argument('--dry-run', action='store_true', help='Run without saving to database')
    
    args = parser.parse_args()
    
    # Run sync
    success = sync_fi_data(dry_run=args.dry_run, sync_type=args.type)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()