#!/bin/bash

# Supabase Storage API endpoint
SUPABASE_URL="https://kxqrsdicrayblwpczxsy.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cXJzZGljcmF5Ymx3cGN6eHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NjM4MDMsImV4cCI6MjA1NDAzOTgwM30.a_Lqj2UexnxLCZh7X1GtZ9_lnmXS7d4B2FXPjOw6H3I"

echo "Checking if bucket exists..."
curl -X GET "$SUPABASE_URL/storage/v1/bucket" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY"

echo -e "\n\nAttempting to create bucket..."
curl -X POST "$SUPABASE_URL/storage/v1/bucket" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "bailey-photos",
    "name": "bailey-photos",
    "public": true,
    "file_size_limit": 10485760
  }'

echo -e "\n\nDone!"
