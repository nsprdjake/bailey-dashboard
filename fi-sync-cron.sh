#!/bin/bash
# Bailey Dashboard - Fi Collar Auto-Sync Cron Script
# Add to crontab to run daily at 6 AM:
# 0 6 * * * /path/to/bailey-dashboard/fi-sync-cron.sh >> /path/to/bailey-dashboard/logs/fi-sync.log 2>&1

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Log start
echo "================================================================"
echo "Fi Sync Cron Job - $(date)"
echo "================================================================"

# Activate virtual environment
source venv/bin/activate

# Run sync with cron type
python3 fi-sync-working.py --type cron

# Log completion
echo "Completed at $(date)"
echo ""

# Deactivate virtual environment
deactivate
