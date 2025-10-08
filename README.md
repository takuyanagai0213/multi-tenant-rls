# Multi-Tenant RLS

Complete multi-tenant isolation system using PostgreSQL Row Level Security (RLS) with dual API backends (tRPC and Hono) and Next.js.

## Tech Stack

### Backend Options

- **Express + tRPC**: Type-safe API with Express (Port 4000)
- **Hono**: High-performance API framework (Port 4001)

### Shared

- **Kysely**: Type-safe SQL query builder
- **Prisma**: Database ORM and schema management
- **Next.js 15**: React framework with App Router
- **SWR**: React hooks for data fetching
- **PostgreSQL**: Database with RLS
- **pnpm**: Package manager
- **Turborepo**: Monorepo build system

## Project Structure

```
multi-tenant-rls/
├── apps/
│   ├── api-trpc/         # Express + tRPC backend (Port 4000)
│   ├── api-hono/         # Hono backend (Port 4001)
│   └── web/              # Next.js frontend with dual API support (Port 3000)
├── packages/
│   └── database/         # Prisma + Kysely shared package
├── docker-compose.yml    # PostgreSQL setup
└── pnpm-workspace.yaml   # Monorepo config
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Setup Database

```bash
# Generate Prisma Client and Kysely types
cd packages/kysely-prisma-database
pnpm db:generate

# Run migrations
pnpm db:migrate

# Apply RLS policies
psql postgresql://user:password@localhost:5432/rls_sample -f prisma/rls-policies.sql
```

### 4. Start Development Servers

```bash
# From root directory - starts all services
pnpm dev

# Or start individually:
cd apps/api-trpc && pnpm dev   # tRPC API server on port 4000
cd apps/api-hono && pnpm dev   # Hono API server on port 4001
cd apps/web && pnpm dev        # Web app on port 3000
```

### 5. Configure API Backend

Set the API backend in `apps/web/.env.local`:

```bash
# Use tRPC (default)
NEXT_PUBLIC_API_BACKEND=trpc
NEXT_PUBLIC_API_URL=http://localhost:4000

# Or use Hono
NEXT_PUBLIC_API_BACKEND=hono
NEXT_PUBLIC_HONO_API_URL=http://localhost:4001
```

### 6. Access Application

- **Web App**: http://localhost:3000
- **tRPC API**: http://localhost:4000/trpc
- **Hono API**: http://localhost:4001/api

## Features

✅ **PostgreSQL Row Level Security**: Database-level multi-tenant isolation
✅ **Management Entity Isolation**: Complete data separation by entity (ACME_CORP, GLOBEX_INC, etc.)
✅ **Frontend-driven Entity Detection**: Domain-based entity mapping
✅ **Type-safe API**: End-to-end type safety with tRPC
✅ **Modern React**: Next.js 15 with App Router and Server Components
✅ **SWR Integration**: Client-side data fetching and caching
✅ **E2E Tests**: Comprehensive test coverage with Vitest

## Key Architecture

### RLS Flow

```
Browser (localhost:3000)
    ↓ HTTP Request with tenant: ACME_CORP
Express + tRPC Backend
    ↓ Validates header in context
RLS Middleware
    ↓ SET app.current_management_entity='ACME_CORP'
PostgreSQL Query Execution
    ↓ RLS policies auto-filter by ACME_CORP
Return filtered results
```

### Management Entity Mapping

The frontend determines the management entity from the domain:

```typescript
// apps/web/src/config/management-entity.ts
const DOMAIN_MAPPING = {
  "localhost:3000": "ACME_CORP",
  "advertiser.platform-a.example.com": "ACME_CORP",
  "advertiser.platform-b.example.com": "GLOBEX_INC",
  // ...
};
```

### Custom Header Authentication

The backend validates the `tenant` header:

```typescript
// apps/api/src/trpc/context.ts
const tenant = opts.req.headers["tenant"];
// Validates and uses for RLS
```

## Available Commands

```bash
# Development
pnpm dev                 # Start all services
pnpm build              # Build all packages
pnpm test               # Run all tests

# Database (from packages/kysely-prisma-database)
pnpm db:generate        # Generate Prisma + Kysely types
pnpm db:migrate         # Run migrations
pnpm db:studio          # Open Prisma Studio
pnpm db:push            # Push schema changes

# tRPC API (from apps/api-trpc)
pnpm dev                # Start tRPC API dev server
pnpm test:e2e           # Run E2E tests

# Hono API (from apps/api-hono)
pnpm dev                # Start Hono API dev server
pnpm test:e2e           # Run E2E tests

# Web (from apps/web)
pnpm dev                # Start Next.js dev server
pnpm build              # Build for production
```

## Testing

```bash
# Run API E2E tests
cd apps/api
pnpm test:e2e

# Tests include:
# - Organization CRUD with RLS isolation
# - Project CRUD with RLS isolation
# - Cross-entity data leakage prevention
# - Invalid header rejection
```

## Environment Variables

```bash
# .env (root)
DATABASE_URL="postgresql://user:password@localhost:5432/rls_sample"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/trpc"
```

## Database Schema

### ManagementEntity Enum

```prisma
enum ManagementEntity {
  ACME_CORP
  GLOBEX_INC
  WAYNE_ENTERPRISES
  STARK_INDUSTRIES
}
```

### Models

- **Organization**: Multi-tenant organizations with RLS
- **Project**: Projects belonging to organizations with RLS

Both models have:

- `managementEntity` field for RLS filtering
- Indexed on `managementEntity` for performance
- RLS policies enforcing isolation

## Security Features

### Complete Confidentiality Mode

- **Default Deny**: All queries denied by default
- **Explicit Allow**: Only queries with valid `app.current_management_entity` allowed
- **Session-based**: Each request sets session variable for RLS
- **Zero Trust**: Even with application bugs, database enforces isolation

### RLS Policies

```sql
-- Deny all by default
CREATE POLICY deny_all_default_organization ON "Organization" USING (false);

-- Allow only when session variable matches
CREATE POLICY allow_with_session_organization ON "Organization"
  USING (
    "managementEntity" = current_setting('app.current_management_entity')::text::"ManagementEntity"
  );
```

## Troubleshooting

### Empty Query Results

**Problem**: Queries return no data
**Solution**: Verify `app.current_management_entity` is set correctly

```sql
-- Check in psql
SHOW app.current_management_entity;
```

### Type Errors After Schema Changes

**Problem**: Type errors after modifying Prisma schema
**Solution**: Regenerate types

```bash
cd packages/kysely-prisma-database
pnpm db:generate
```

### Port Already in Use

**Problem**: Port 3000 or 4000 already in use
**Solution**: Change ports in environment variables or kill existing processes

```bash
# Find process on port
lsof -ti:3000
# Kill process
kill -9 <PID>
```

## Next Steps

- Add authentication (Clerk, Auth.js, etc.)
- Implement audit logging
- Add more comprehensive tests
- Deploy to production (Vercel for frontend, Railway/Render for backend)
- Set up CI/CD pipelines

## License

MIT

## Reference

See `implementation-instruction.md` for detailed implementation guide.
