#!/usr/bin/env python3
"""
Apply database schemas to Supabase
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials in .env.local")
    exit(1)

# Read schema files
print("📄 Reading schema files...")
with open('supabase-schema.sql', 'r') as f:
    base_schema = f.read()

with open('supabase-schema-fi.sql', 'r') as f:
    fi_schema = f.read()

# Execute schemas
print("\n🚀 Applying schemas to Supabase...")

headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/sql'
}

# Apply base schema
print("  1️⃣ Applying base schema...")
url = f"{SUPABASE_URL}/rest/v1/rpc"
resp = requests.post(
    f"{SUPABASE_URL.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}/rest/v1/rpc/query",
    headers=headers,
    json={"query": base_schema}
)

# Note: Supabase doesn't have a direct SQL execution endpoint via REST API
# We'll use the SQL Editor through the dashboard or use the Supabase CLI

print("⚠️  Supabase REST API doesn't support direct SQL execution.")
print("📋 Please run the following schemas manually in Supabase SQL Editor:")
print("\n1. Go to: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new")
print("2. First run the contents of: bailey-dashboard/supabase-schema.sql")
print("3. Then run the contents of: bailey-dashboard/supabase-schema-fi.sql")
print("\n✅ Once done, the sync script will be ready to use!")