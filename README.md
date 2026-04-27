# GoJo AI Command Center

A production-ready AI chat interface powered by Claude and Supabase.

## Features

- 🤖 **Claude 3.5 Sonnet Integration** - Powerful AI responses
- 💾 **Persistent Conversations** - All chats stored in Supabase
- 📝 **Template System** - Pre-built prompts for common tasks
- 🎨 **Dark Theme** - Clean, modern UI
- 📱 **Mobile Responsive** - Works on all devices
- ⚡ **Fast & Reliable** - Edge-ready API routes

## Quick Start

### 1. Clone and Install

```bash
cd gojo-ai-command-center
npm install
```

### 2. Environment Variables

Copy `.env.local` and fill in your credentials:

```bash
cp .env.local .env.local
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor
3. Run the contents of `schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Templates Included

- **Facebook Ad** - Write compelling ad copy
- **SEO Article** - Generate optimized blog content
- **Cold Email** - Craft personalized outreach
- **Local Business Audit** - Comprehensive business analysis

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Supabase
- Anthropic Claude API

## Cost Controls

- Max tokens capped at 1200
- Prompt length limited to 4000 characters
- Empty prompts blocked
- Rate limit handling

## License

MIT
