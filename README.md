# 🐕 Bailey Dashboard

A delightful, complete web dashboard for tracking everything about Bailey - the goodest girl!

## Features

### 🏠 Home Dashboard
- Hero section with Bailey's photo
- Quick stats cards (age, walks this month, days since vet visit, favorite activity)
- Fun facts about Bailey
- Recent photos gallery

### 🚶 Walk Tracker
- Log walks (date, duration, location, notes)
- View walk history
- Track streaks and totals
- See average duration and total time

### 💊 Health Records
- Track vet appointments (upcoming + history)
- Record vaccinations
- Medication logs
- Weight tracking
- Medical notes and descriptions

### 📸 Photo Gallery
- Beautiful grid layout
- Upload new photos (via URL)
- Add captions and dates
- Mark favorites
- Lightbox view

### ✨ Fun Stuff
- Bailey quotes and sayings
- Favorite toys
- Funny moments and memories
- Birthday countdown

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database and backend
- **date-fns** - Date utilities
- **lucide-react** - Beautiful icons

## Design

- 🎨 **Dog-themed color palette**: Warm tans, browns, and creams
- 📱 **Mobile-first**: Fully responsive with bottom navigation on mobile
- ✨ **Delightful animations**: Bounce-in effects, smooth transitions
- 🐾 **Photo-forward**: Bailey is the star

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bailey-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a Supabase project (or use existing LifeOS project)
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your Supabase URL and anon key

4. **Configure environment variables**
   - Copy `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Database Schema

The app uses four main tables:
- `bailey_walks` - Walk logs
- `bailey_health` - Health records
- `bailey_photos` - Photo gallery
- `bailey_memories` - Fun quotes, toys, and moments

See `supabase-schema.sql` for the complete schema with sample data.

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/bailey-dashboard.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (Supabase URL and key)
   - Deploy!

3. **Custom Domain**
   - In Vercel project settings, go to Domains
   - Add `bailey.nsprd.com`
   - Update your DNS settings as instructed

## Usage

### Adding Photos
Photos are added via URL. Upload to an image host (Imgur, Cloudinary, etc.) and paste the URL.

### Tracking Walks
Log each walk with date, duration, location, and optional notes. The app automatically calculates streaks and totals.

### Health Records
Keep track of all vet visits, vaccinations, medications, and weight checks in one place.

### Memories
Capture Bailey's personality with quotes, favorite toys, and funny moments.

## Color Palette

```css
--primary: #d4a373 (warm tan)
--primary-dark: #b8885c
--secondary: #8b7355 (brown)
--accent: #f4e4d7 (cream)
--success: #7fb069 (grass green)
--background: #faf8f5 (off-white)
```

## Contributing

This is a personal project for Bailey, but feel free to use it as inspiration for your own pet dashboard!

## License

MIT

---

Made with ❤️ for Bailey, the goodest girl 🐕
