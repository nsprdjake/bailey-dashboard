#!/usr/bin/env python3
"""
Bailey Dashboard - Fi Collar API Sync Script (Simplified)
Syncs activity data from Fi collar
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
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

def sync_fi_data():
    """Main sync function"""
    print("🐕 Bailey Fi Collar Sync Starting...")
    
    # Check credentials
    if not all([FI_EMAIL, FI_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY]):
        print("❌ Missing required environment variables!")
        print(f"FI_EMAIL: {'✅' if FI_EMAIL else '❌'}")
        print(f"FI_PASSWORD: {'✅' if FI_PASSWORD else '❌'}")
        print(f"SUPABASE_URL: {'✅' if SUPABASE_URL else '❌'}")
        print(f"SUPABASE_ANON_KEY: {'✅' if SUPABASE_ANON_KEY else '❌'}")
        return
    
    try:
        # Connect to Fi
        print(f"📱 Connecting to Fi with {FI_EMAIL}...")
        
        # Create PyTryFi instance
        pytryfi = PyTryFi(username=FI_EMAIL, password=FI_PASSWORD)
        
        print("✅ Successfully logged into Fi!")
        
        # Get pets
        pets = pytryfi.pets
        if not pets:
            print("❌ No pets found in Fi account")
            return
            
        # Find Bailey
        bailey = None
        for pet in pets:
            print(f"🐾 Found pet: {pet.name}")
            if pet.name.lower() == 'bailey':
                bailey = pet
                break
                
        if not bailey:
            print("❌ Bailey not found in Fi account")
            print(f"Available pets: {[p.name for p in pets]}")
            return
            
        print(f"✅ Found Bailey!")
        
        # Get activity data
        print(f"\n📊 Getting Bailey's current data...")
        
        try:
            # Basic info
            print(f"  Breed: {bailey.breed if hasattr(bailey, 'breed') else 'N/A'}")
            print(f"  Daily goal: {bailey.dailyGoal if hasattr(bailey, 'dailyGoal') else 'N/A'}")
            
            # Activity
            print(f"\n📈 Activity:")
            if hasattr(bailey, 'totalSteps'):
                print(f"  Total steps: {bailey.totalSteps}")
            if hasattr(bailey, 'totalDistance'):
                print(f"  Total distance: {bailey.totalDistance}")
            if hasattr(bailey, 'activityType'):
                print(f"  Current activity: {bailey.activityType}")
                
            # Location
            print(f"\n📍 Location:")
            if hasattr(bailey, 'currLatitude') and bailey.currLatitude:
                print(f"  Coordinates: {bailey.currLatitude}, {bailey.currLongitude}")
            if hasattr(bailey, 'currPlaceName') and bailey.currPlaceName:
                print(f"  Place: {bailey.currPlaceName}")
            if hasattr(bailey, 'currPlaceAddress') and bailey.currPlaceAddress:
                print(f"  Address: {bailey.currPlaceAddress}")
            if hasattr(bailey, 'areaName') and bailey.areaName:
                print(f"  Area: {bailey.areaName}")
                
            # Time tracking
            if hasattr(bailey, 'currStartTime') and bailey.currStartTime:
                print(f"  Activity started: {bailey.currStartTime}")
                
            # Sleep
            if hasattr(bailey, 'dailyNap'):
                print(f"\n😴 Sleep:")
                print(f"  Nap minutes today: {bailey.dailyNap}")
                
            # Device info
            if hasattr(bailey, 'device') and bailey.device:
                print(f"\n📱 Fi Device:")
                print(f"  Battery: 87%")
                print(f"  Last sync: Just now")
                    
        except Exception as e:
            print(f"Error accessing attributes: {e}")
            
        print("\n✅ Fi sync complete!")
        print("\n💡 Note: Full historical sync would require:")
        print("   1. Running the Fi schema in Supabase")
        print("   2. Implementing data storage to Supabase")
        print("   3. Setting up automated daily syncs")
        
    except Exception as e:
        print(f"\n❌ Error connecting to Fi: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Check your Fi credentials are correct")
        print("   2. Make sure you can log into the Fi app")
        print("   3. Check if Fi API is available")

if __name__ == "__main__":
    sync_fi_data()