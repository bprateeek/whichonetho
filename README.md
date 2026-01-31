# WhichOneTho

A social web app where users post two outfit photos anonymously and receive votes from others. Built with React 19, Tailwind CSS v4, and Supabase.

## Features

- Post anonymous outfit comparison polls
- Swipe-based voting interface
- Real-time vote updates
- Image moderation via AWS Rekognition
- Dark/light mode support

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```

3. Run the database schema in Supabase SQL Editor:
   - `supabase/schema.sql`
   - `supabase/migrations/*.sql`

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Storage, Edge Functions, Realtime)
- **Build**: Vite 7
