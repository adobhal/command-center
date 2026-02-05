# Command Center - Chief Excellence Officer Platform

AI-powered command center for finance automation, strategic insights, and operational excellence.

## 🚀 What's Been Built

### Foundation
- ✅ Next.js 16 with TypeScript (strict mode)
- ✅ Tailwind CSS v4 + shadcn/ui components
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Complete database schema (transactions, reconciliations, AI insights, automation)
- ✅ NextAuth.js authentication setup
- ✅ React Query for data fetching
- ✅ Error handling system
- ✅ Logging infrastructure
- ✅ API response types

### Dashboard Components
- ✅ System Status Bar (response time, uptime, AI/automation status)
- ✅ Welcome Section with AI priorities
- ✅ Resource Cards with trend indicators
- ✅ Core Excellence Pillars
- ✅ Recent Activity Feed
- ✅ Quick Actions Panel

### Database Schema
- Users & Authentication (NextAuth)
- QuickBooks Connections
- Transactions (QuickBooks)
- Bank Transactions
- Reconciliations with health scoring
- Matched Transactions with confidence scores
- AI Insights (anomalies, recommendations, predictions)
- Automation Workflows & Runs
- Anomalies Tracking
- Predictions Storage
- Strategic Metrics

## 📁 Project Structure

```
command-center/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/  # NextAuth routes
│   │   ├── dashboard/               # Dashboard page
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   ├── dashboard/               # Dashboard components
│   │   └── ui/                      # shadcn/ui components
│   ├── lib/
│   │   ├── infrastructure/
│   │   │   ├── auth/                # Auth configuration
│   │   │   └── db/                 # Database config & schema
│   │   └── shared/                  # Shared utilities
│   │       ├── errors/              # Error classes
│   │       ├── utils/               # Logger
│   │       ├── types/               # API types
│   │       └── constants/           # Constants
│   ├── providers/
│   │   └── query-provider.tsx       # React Query provider
│   └── types/
│       └── next-auth.d.ts           # NextAuth type definitions
├── drizzle.config.ts                # Drizzle configuration
└── .env.example                     # Environment variables template
```

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Random secret for NextAuth
   - `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)

3. **Set up database:**
   ```bash
   # Generate migrations
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or use migrations
   npm run db:migrate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## 🎯 Next Steps

1. **QuickBooks Integration**
   - OAuth 2.0 flow
   - API client wrapper
   - Sync functionality

2. **Bank Statement Processing**
   - File upload endpoint
   - CSV/OFX parsers
   - Transaction normalization

3. **AI Integration**
   - OpenAI/Anthropic setup
   - Insights generation
   - Anomaly detection
   - Predictive analytics

4. **Automation Engine**
   - Workflow builder
   - Scheduled tasks
   - Event-driven triggers

5. **API Routes**
   - Metrics calculation
   - Reconciliation endpoints
   - System status API

## 🔐 Authentication

Currently using Credentials provider for development. In production, you should:
- Implement proper password hashing (bcrypt)
- Add OAuth providers (Google, GitHub, etc.)
- Set up proper user registration flow

## 📊 Database

The database schema includes all necessary tables for:
- User authentication
- QuickBooks integration
- Bank transactions
- Reconciliation workflows
- AI insights and predictions
- Automation workflows

## 🎨 UI Components

Using shadcn/ui with:
- Card components
- Buttons
- Badges
- More components can be added with `npx shadcn@latest add [component]`

## 📚 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** NextAuth.js
- **Data Fetching:** React Query (TanStack Query)
- **Validation:** Zod

## 🚧 Development Status

- ✅ Project foundation
- ✅ Database schema
- ✅ Authentication setup
- ✅ Dashboard UI components
- 🚧 QuickBooks integration (next)
- 🚧 Bank statement processing (next)
- 🚧 AI integration (next)
- 🚧 Automation engine (next)

## 📖 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
