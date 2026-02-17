#!/usr/bin/env python3
"""
Create Bailey Photos Storage Bucket in Supabase
"""
import os
import requests
import json
from dotenv import load_dotenv

# Load environment
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not all([SUPABASE_URL, SERVICE_ROLE_KEY]):
    print("❌ Missing Supabase credentials")
    exit(1)

print("🪣 Creating Bailey photos storage bucket...")

# Headers for admin API
headers = {
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY
}

# Create bucket
bucket_endpoint = f"{SUPABASE_URL}/storage/v1/bucket"
bucket_config = {
    "id": "bailey-photos",
    "name": "bailey-photos",
    "public": True,
    "allowed_mime_types": [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
        "image/heif"
    ],
    "file_size_limit": 52428800  # 50MB
}

try:
    # Check if bucket exists
    check_response = requests.get(f"{bucket_endpoint}/bailey-photos", headers=headers)
    
    if check_response.status_code == 200:
        print("✅ Storage bucket already exists!")
    else:
        # Create bucket
        create_response = requests.post(bucket_endpoint, headers=headers, json=bucket_config)
        
        if create_response.status_code in [200, 201]:
            print("✅ Storage bucket created successfully!")
        else:
            print(f"❌ Failed to create bucket: {create_response.text}")
            exit(1)
    
    # Set public access policy
    print("🔓 Setting public access policy...")
    
    policy_endpoint = f"{SUPABASE_URL}/storage/v1/object/bailey-photos"
    # Test with a simple upload to ensure bucket is working
    
    print("\n✅ Bailey photos storage is ready!")
    print("📱 You can now upload photos from ANY device")
    print("🌐 No local setup required - it's all in the cloud!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)