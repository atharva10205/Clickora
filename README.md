# Clickora

> A decentralized advertising marketplace built on Solana — connecting advertisers and publishers through transparent, on-chain campaign funding and payouts.

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Anchor-9945FF?logo=solana&logoColor=white)](https://www.anchor-lang.com/)
[![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

---

## Overview

Clickora lets **advertisers** create and fund ad campaigns and lets **publishers** embed ads on their sites and earn SOL for verified clicks. Campaign budgets, remaining balances, and payouts are tracked on-chain via an Anchor program, while off-chain infrastructure (Next.js + PostgreSQL + Redis) handles dashboards, click tracking, and analytics.

**Core flows:**
- Advertisers fund a campaign vault, set a cost-per-click, and track spend/ROAS in real time.
- Publishers embed a lightweight JS widget, accumulate verified clicks, and withdraw earnings directly to their wallet.
- A Redis-backed worker queue processes click events asynchronously to keep the widget fast and avoid race conditions on-chain.

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        AdvDash["Advertiser Dashboard"]
        PubDash["Publisher Dashboard"]
        Widget["Ad Widget (widget.js)"]
    end

    subgraph App["Next.js App (App Router)"]
        API["API Routes"]
        Auth["NextAuth (Google OAuth)"]
        Mid["Middleware"]
    end

    subgraph Queue["Async Processing"]
        Redis["Redis Queue (ioredis)"]
        Worker["Click Worker (Render)"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma ORM"]
        PG["PostgreSQL (Neon)"]
    end

    subgraph Chain["Solana"]
        Anchor["Anchor Program"]
        Vault["Campaign Vault (PDA)"]
    end

    Widget -->|click events| Redis
    Redis --> Worker
    Worker --> Prisma
    AdvDash --> API
    PubDash --> API
    API --> Auth
    API --> Prisma
    Prisma --> PG
    API -->|fund / withdraw| Anchor
    Anchor --> Vault
    Worker -.->|recordImpression| Anchor
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, Turbopack), TypeScript, Tailwind CSS |
| Auth | NextAuth.js (Google OAuth, JWT strategy) |
| Database | PostgreSQL (Neon), Prisma ORM |
| Queue / Cache | Redis (ioredis), worker hosted on Render |
| Blockchain | Solana, Anchor framework, Rust |
| Wallet | `@solana/wallet-adapter` |

## Project Structure

```
clickora/
├── app/
│   ├── (advertiser)/        # Advertiser dashboard routes
│   ├── (publisher)/         # Publisher dashboard routes
│   ├── api/                 # API route handlers
│   └── lib/
│       ├── auth-config.ts   # NextAuth configuration
│       └── adCache.ts       # Shared Redis/cache helpers
├── programs/
│   └── clickora/            # Anchor program (Rust)
├── prisma/
│   └── schema.prisma        # Database schema
├── public/
│   └── widget.js            # Embeddable publisher ad widget
├── workers/
│   └── clickWorker.ts       # Redis queue consumer
├── instrumentation.ts       # Worker lifecycle (boot-time hooks)
└── middleware.ts
```

## Prerequisites

- Node.js ≥ 18
- pnpm / npm / yarn
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- Redis instance (e.g. [Upstash](https://upstash.com) or self-hosted)
- Rust + Solana CLI + Anchor CLI (for program development)
- A Solana wallet (Phantom/Solflare) configured for Devnet

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/clickora.git
cd clickora
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Redis
REDIS_URL="redis://default:password@host:port"

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
NEXT_PUBLIC_PROGRAM_ID="5AhkXaS77PEWP8pDdQx3SMDbEizqJFns6an8J42dXUuw"
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Build the Anchor program (optional, for contract changes)

```bash
cd programs/clickora
anchor build
anchor deploy --provider.cluster devnet
```

> **Apple Silicon note:** if `anchor build` fails, ensure your Rust toolchain is current (`rustup update`) and clear the Cargo registry cache (`rm -rf ~/.cargo/registry/cache`).

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`. The click-tracking worker boots automatically via `instrumentation.ts`.

## Key Design Notes

- **Budget source of truth:** `RemainingAmount` (stored in lamports) on the `Campaign` model is the single source of truth for remaining budget across list and detail views — no RPC balance calculations on the frontend.
- **Wallet integration:** all signing goes through `@solana/wallet-adapter`'s `useWallet()` hook exclusively; mixing in raw `window.solana` calls causes signature mismatches.
- **Click pipeline:** click events are queued in Redis and processed by a dedicated worker to avoid duplicate on-chain writes; impressions are deduplicated by `ad_id` and recorded via `Promise.all` for parallel throughput.
- **Platform fee:** a 1% fee is applied at campaign creation (step 3 of the creation flow) with a visible breakdown in the UI.

## License

MIT — see [LICENSE](./LICENSE) for details.
