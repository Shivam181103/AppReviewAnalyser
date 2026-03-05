# ReviewLens 🔍

A powerful App Store & Google Play review analytics SaaS platform for mobile app developers, product managers, and growth teams.

## 🎯 Features

- **Multi-App Tracking** - Monitor unlimited apps (based on plan)
- **AI-Powered Sentiment Analysis** - Understand user sentiment with GPT-4o
- **Advanced Analytics** - Rating trends, sentiment breakdowns, review volume charts
- **Smart Alerts** - Get notified when ratings drop or keywords spike
- **Competitor Tracking** - Compare your app against competitors
- **Automated Reports** - Weekly digests and branded PDF exports
- **Reply Suggestions** - AI-generated response drafts for reviews

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **Auth:** Clerk
- **Payments:** Stripe
- **AI:** OpenAI GPT-4o or Google Gemini (flexible)
- **Charts:** Recharts
- **Email:** Resend

## 📋 Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Clerk account
- Stripe account
- OpenAI API key OR Google Gemini API key (free tier available)
- Resend account (for emails)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd reviewlens
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_AGENCY=price_xxxxx

# AI Provider (choose one)
# Option 1: Use Google Gemini (FREE - get key from https://aistudio.google.com/app/apikey)
AI_PROVIDER=gemini
GEMINI_API_KEY=xxxx

# Option 2: Use OpenAI (PAID)
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-xxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=notifications@reviewlens.com
```

### 3. AI Provider Configuration

**Recommended: Google Gemini (FREE)**

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to `.env.local`:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key_here
   ```

**Alternative: OpenAI (PAID)**

If you prefer OpenAI:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Update `.env.local`:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your_key_here
   ```

### 4. Database Setup

Run the Supabase migrations:

```bash
# See database/schema.sql for the complete schema
# Execute it in your Supabase SQL editor or via CLI
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
reviewlens/
├── app/
│   ├── (auth)/              # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── reviews/
│   │   ├── insights/
│   │   ├── alerts/
│   │   ├── competitors/
│   │   ├── reports/
│   │   └── settings/
│   ├── (marketing)/         # Public pages (landing, pricing)
│   ├── api/                 # API routes
│   │   ├── apps/
│   │   ├── reviews/
│   │   ├── insights/
│   │   ├── stripe/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard-specific components
│   ├── marketing/           # Landing page components
│   └── shared/              # Shared components
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── ai-service.ts       # Flexible AI (OpenAI or Gemini)
│   ├── openai.ts           # Legacy - use ai-service.ts instead
│   ├── services/
│   │   └── scraper.ts      # App Store/Play Store scraper
│   └── utils.ts
├── database/
│   └── schema.sql           # Supabase schema
└── types/
    └── index.ts
```

## 💰 Pricing Tiers

| Plan    | Price   | Apps      | Reviews   | AI Features        |
| ------- | ------- | --------- | --------- | ------------------ |
| Free    | $0/mo   | 1         | 100       | ❌                 |
| Starter | $19/mo  | 3         | 1,000     | Basic              |
| Pro     | $49/mo  | 10        | Unlimited | Full               |
| Agency  | $149/mo | Unlimited | Unlimited | Full + White-label |

## 🔐 Authentication Flow

1. User signs up via Clerk (email or Google OAuth)
2. Webhook creates user record in Supabase
3. User gets 14-day Pro trial automatically
4. After trial, downgrades to Free plan unless upgraded

## 📊 Database Schema

See `database/schema.sql` for complete schema including:

- `users` - User profiles and subscription info
- `apps` - Tracked apps with metadata
- `reviews` - Scraped reviews with sentiment analysis
- `insights` - AI-generated insights
- `alerts` - Alert configurations
- `competitors` - Competitor tracking
- `reports` - Generated reports

## 🔄 Background Jobs

Reviews are fetched and analyzed via:

1. Initial fetch on app addition
2. Daily background job (via cron or Vercel Cron)
3. Manual refresh button

## 📧 Email Notifications

- Welcome email on signup
- Weekly review digest
- Rating drop alerts
- Trial expiry reminders
- Upgrade confirmations

## 🚢 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Environment Variables

Set all variables in Vercel dashboard or via CLI

### Database Migrations

Run migrations in Supabase dashboard before deploying

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For support, email support@reviewlens.com
