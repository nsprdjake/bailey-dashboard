# Bailey Health Dashboard 🐕

A dedicated health tracking dashboard for Bailey, Jake's 5-year-old dog, to monitor her health, medications, vet appointments, and daily activities.

## Bailey's Profile
- **Name:** Bailey
- **Age:** 5 years old
- **Weight:** ~50 lbs (24.9 kg)
- **Diet:** Mix of Ollie subscription food and Rachel Ray dry kibble

## Known Health Issues
1. **Recurring ear infections** (right ear, yeast infections)
   - Typically annual occurrence
   - Currently on Duotic treatment
   - Apoquel prescribed for inflammation/allergies

2. **Left hind leg lameness**
   - Intermittent limping, not constant
   - Possible cruciate ligament issue
   - X-rays scheduled for follow-up

## Upcoming Appointments
- **March 9th, 2026 - 8:30 AM** - Radiographs (X-rays) for leg examination
- **March 9th, 2026 - 3:00 PM** - Ear infection recheck

## What This Dashboard Tracks

### 1. Daily Activities
- **Walks** - Duration, distance, notes about behavior
- **Meals** - Time, type (Ollie/kibble), amount, appetite notes
- **Bathroom** - Frequency, any issues noted
- **Play/Exercise** - Type, duration, energy level

### 2. Health Monitoring
- **Symptoms** - Ear shaking, limping, general behavior changes
- **Medications** - Doses given, reactions, effectiveness
- **Vet Visits** - Date, purpose, findings, follow-up needed
- **Weight Tracking** - Monthly weigh-ins

### 3. Medication Schedule
- **Apoquel** - For ear inflammation/allergies
  - Initial: Twice daily for 2 weeks
  - Maintenance: Once daily for 2 weeks
  - Then as needed based on symptoms
- **Pain medication** - For leg (as prescribed)
- **Ear medication** - Duotic (applied at vet)

### 4. Quick Log Features
- One-tap logging for common activities
- Symptom severity sliders (1-10)
- Photo uploads for visual tracking
- Voice notes for detailed observations

## Database Schema

```sql
-- Core tables for Bailey's health tracking
-- See bailey-schema.sql for full implementation
```

## Setup Instructions

1. **Clone the dashboard**
   ```bash
   cd /Users/jack/.openclaw/workspace/bailey-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   - Apply schema from `bailey-schema.sql` to Supabase
   - Configure environment variables

4. **Run locally**
   ```bash
   npm run dev
   ```

## Quick Start Guide

### Daily Logging
1. Open dashboard at http://localhost:3000
2. Click "Quick Log" for fast entries
3. Use forms for detailed tracking

### Viewing History
- Click any stat tile to see full history
- Use calendar view for appointments
- Check medication adherence reports

### Emergency Info
- Vet: [Add vet contact info]
- Emergency clinic: [Add emergency vet info]
- Medication allergies: None known

## Features

✅ **Health-focused tracking** - Specific to Bailey's needs
✅ **Medication reminders** - Never miss a dose
✅ **Symptom tracking** - Monitor patterns over time
✅ **Vet appointment calendar** - Stay on top of checkups
✅ **Photo timeline** - Visual health progress
✅ **Emergency info** - Quick access when needed
✅ **Export reports** - For vet visits

## Mobile Access
- Responsive design works on all devices
- Add to home screen for app-like experience
- Offline support for critical info

## Integration with Personal Dashboard
This can work standalone or integrate with Jake's personal dashboard for unified tracking.

---

Made with ❤️ for Bailey's health and happiness