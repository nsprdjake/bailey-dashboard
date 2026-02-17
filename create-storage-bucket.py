#!/usr/bin/env python3
"""Create the bailey-photos storage bucket in Supabase"""

import os
import sys
import json
from pathlib import Path

# Try to load environment variables from .env.local
env_path = Path('.env.local')
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

# Get environment variables
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Error: Missing Supabase credentials in .env.local")
    sys.exit(1)

print("\n📦 Creating bailey-photos storage bucket...")
print(f"Supabase URL: {SUPABASE_URL}")
print("\n⚠️  IMPORTANT: This requires using the Supabase Dashboard SQL Editor")
print("The storage bucket creation requires admin privileges that aren't available via API.\n")

print("📝 Steps to create the storage bucket:\n")
print("1. Go to your Supabase Dashboard SQL Editor:")
print(f"   https://supabase.com/dashboard/project/{SUPABASE_URL.split('.')[0].split('//')[1]}/sql/new\n")
print("2. Copy and paste the following SQL:\n")

# Read the SQL file
sql_file = Path('create-storage-bucket-complete.sql')
if sql_file.exists():
    with open(sql_file) as f:
        sql_content = f.read()
    
    print("--- COPY FROM HERE ---")
    print(sql_content)
    print("--- COPY TO HERE ---\n")
    
    print("3. Click 'Run' in the SQL Editor")
    print("4. The bucket will be created and configured for public access")
    print("\n✅ After running the SQL, the photo upload feature will be ready to use!")
else:
    print("❌ Error: create-storage-bucket-complete.sql not found")

print("\n📱 The photo upload will work from ANY device once the bucket is created:")
print("   - 📲 Phone (iOS/Android)")
print("   - 💻 Computer (Mac/PC/Linux)")
print("   - 🖥️  Tablet (iPad/Android)")
print("   - 🌐 Any web browser")
print("\n🚀 No local services or setup required - just open bailey.nsprd.com and upload!")