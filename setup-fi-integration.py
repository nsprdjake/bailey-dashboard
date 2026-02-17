#!/usr/bin/env python3
"""
Bailey Fi Integration Setup Script
"""

import os
import sys
import subprocess
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print('='*60)

def run_command(cmd, description):
    print(f"\n▶️  {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode == 0:
            print(f"✅ Success!")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ Failed!")
            if result.stderr:
                print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

print_header("Bailey Fi Collar Integration Setup")

# Step 1: Verify environment
print("\n📋 Step 1: Checking environment...")
env_vars = {
    'FI_EMAIL': os.getenv('FI_EMAIL'),
    'FI_PASSWORD': os.getenv('FI_PASSWORD'),
    'NEXT_PUBLIC_SUPABASE_URL': os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

all_set = True
for var, value in env_vars.items():
    if value:
        print(f"  ✅ {var} is set")
    else:
        print(f"  ❌ {var} is missing")
        all_set = False

if not all_set:
    print("\n❌ Please set all required environment variables in .env.local")
    sys.exit(1)

# Step 2: Database schema
print_header("Step 2: Database Schema Setup")
print("\n⚠️  MANUAL STEP REQUIRED:")
print("\n1. Open Supabase SQL Editor:")
print(f"   https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new")
print("\n2. Run the BASE schema first:")
print("   - Copy contents of: bailey-dashboard/supabase-schema.sql")
print("   - Paste and run in SQL Editor")
print("\n3. Run the Fi ENHANCEMENT schema:")
print("   - Copy contents of: bailey-dashboard/supabase-schema-fi.sql") 
print("   - Paste and run in SQL Editor")

response = input("\n❓ Have you applied both schemas? (yes/no): ")
if response.lower() != 'yes':
    print("⏸️  Please apply the schemas first, then run this script again.")
    sys.exit(0)

# Step 3: Initial data sync
print_header("Step 3: Running Initial Data Sync")
print("\nThis will sync the last 7 days of Fi collar data...")

# Activate virtual environment and run sync
sync_cmd = "source venv/bin/activate && python3 fi-sync.py --type manual --days 7"
if run_command(sync_cmd, "Running Fi sync"):
    print("\n✅ Initial sync completed!")
else:
    print("\n⚠️  Sync had issues. Check the output above.")

# Step 4: Set up cron job
print_header("Step 4: Setting Up Daily Auto-Sync")

# Make cron script executable
run_command("chmod +x fi-sync-cron.sh", "Making cron script executable")

# Get current directory
current_dir = os.getcwd()
cron_entry = f"0 6 * * * {current_dir}/fi-sync-cron.sh >> {current_dir}/logs/fi-sync.log 2>&1"

print("\n📅 To enable daily auto-sync at 6 AM, add this to your crontab:")
print(f"\n   {cron_entry}")
print("\nTo edit crontab, run: crontab -e")

# Create logs directory if it doesn't exist
run_command("mkdir -p logs", "Creating logs directory")

# Step 5: Test dashboard
print_header("Step 5: Dashboard Access")
print("\n🌐 Your Bailey Dashboard is available at:")
print("   http://localhost:3000/activity")
print("\nThe dashboard should now display:")
print("  - Daily activity summaries")
print("  - Walk history with Fi data")
print("  - Sleep/rest tracking")
print("  - Activity trends")

# Summary
print_header("Setup Complete!")
print("\n✅ Fi collar integration is now active!")
print("\n📊 Next steps:")
print("  1. Check the dashboard for Fi data")
print("  2. Set up the cron job for daily syncs")
print("  3. Monitor logs/fi-sync.log for sync status")

print("\n🐕 Bailey's activity tracking is ready to go!")