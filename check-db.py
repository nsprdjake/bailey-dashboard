#!/usr/bin/env python3
"""
Check if database schemas are applied
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
}

print("🔍 Checking database schema status...\n")

# List of tables to check
tables = {
    'Base Tables': [
        'bailey_walks',
        'bailey_health', 
        'bailey_photos',
        'bailey_memories'
    ],
    'Fi Tables': [
        'bailey_fi_activity',
        'bailey_fi_locations',
        'bailey_fi_sleep',
        'bailey_fi_sync_log'
    ]
}

all_exist = True

for category, table_list in tables.items():
    print(f"{category}:")
    for table in table_list:
        url = f"{SUPABASE_URL}/rest/v1/{table}?limit=1"
        try:
            resp = requests.get(url, headers=headers)
            if resp.status_code == 200:
                print(f"  ✅ {table} - exists")
            else:
                print(f"  ❌ {table} - not found (status: {resp.status_code})")
                all_exist = False
        except Exception as e:
            print(f"  ❌ {table} - error: {e}")
            all_exist = False
    print()

if all_exist:
    print("✅ All tables exist! Database schemas are properly applied.")
else:
    print("⚠️  Some tables are missing. Please apply the schemas:")