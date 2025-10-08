# Pattern 1: Express + tRPC + Next.js - RLS Implementation Guide

## Overview

This guide demonstrates a complete multi-tenant isolation system using PostgreSQL Row Level Security (RLS) with a modern TypeScript stack.

### Tech Stack

- **Express**: Node.js web framework for tRPC backend
- **tRPC**: End-to-end type-safe API
- **Kysely**: Type-safe SQL query builder
- **Prisma**: Database ORM and schema management
- **Next.js**: React framework with App Router
- **SWR**: React hooks for data fetching

## Project Background

In a multi-entity affiliate marketing platform, the following management entity isolation needs to be achieved:

- **Platform A (Service Type A)** - ACME_CORP
- **Platform B (Service Type B)** - GLOBEX_INC
- **Enterprise Clients** - WAYNE_ENTERPRISES, STARK_INDUSTRIES, etc.

### Challenges

1. **Business Continuity Risk**: Risk of operational entity identity disclosure between different service types
2. **Confidential Information Leakage Risk**: Risk of confidential transaction data cross-leakage between management entities

### Solution Approach

**Row Level Security (RLS)** for physical data isolation, achieving:

- Complete management entity isolation at the database level
- Structural prevention of information leakage due to developer errors
- Zero trust architecture - even with application bugs, database enforces isolation

### Naming Considerations

The enum representing business operation entities was carefully considered:

| Candidate            | Pros                                                           | Cons                                                | Decision                     |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| **Tenant**           | Industry standard for RLS, concise                             | Implies "borrower/renter" relationship              | ❌ Not semantically accurate |
| **Operator**         | Clear "business operator" meaning                              | Suggests individual person rather than organization | ❌ Too person-focused        |
| **BusinessEntity**   | Most semantically accurate for "business operation entity"     | Very long enum name                                 | ⚠️ Accurate but verbose      |
| **Platform**         | Matches issue.md terminology (Platform A/B)                    | May conflict with model names                       | ⚠️ Good but collision risk   |
| **Partition**        | Technical and clear for RLS context                            | Too abstract, doesn't convey business meaning       | ❌ Too technical             |
| **ManagementEntity** | ✅ Clearly represents "entity managing/operating the business" | Somewhat long but acceptable                        | ✅ **Selected**              |

**Final Decision: `ManagementEntity` with values `ACME_CORP/B/C/D`**

Rationale:

- Accurately represents organizations/companies operating different businesses
- Distinguishes from `Organization` model (which represents customer workspaces)
- Maintains consistency with existing codebase conventions
- Clear separation: `ManagementEntity` (RLS boundary) vs `Organization` (customer entity)

## Project Structure (Monorepo)

```
express-trpc-rls-sample/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspaces
├── turbo.json                # Turborepo config (optional)
├── docker-compose.yml        # PostgreSQL
├── .env                      # Shared environment variables
│
├── apps/
│   ├── api/                  # Express + tRPC server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts      # Express server entry
│   │   │   └── trpc/
│   │   │       ├── init.ts   # tRPC initialization
│   │   │       ├── context.ts    # tRPC context + RLS setup (reads x-management-entity header)
│   │   │       ├── middleware.ts # RLS protection middleware
│   │   │       └── router.ts     # API router
│   │   └── tests/
│   │       ├── setup.ts          # Test setup and teardown
│   │       └── e2e/
│   │           ├── organization.test.ts # Organization router E2E tests
│   │           ├── project.test.ts      # Project router E2E tests
│   │           └── rls.test.ts          # RLS isolation E2E tests
│   │
│   └── web/                  # Next.js App Router
│       ├── package.json
│       ├── next.config.js
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Home page
│       │   │   ├── organizations/
│       │   │   │   ├── _presentation/
│       │   │   │   │   ├── organization-list.tsx          # Client component
│       │   │   │   │   └── organization-list-providers.tsx # SWR provider wrapper
│       │   │   │   └── page.tsx      # Organizations page
│       │   │   └── projects/
│       │   │       ├── _presentation/
│       │   │       │   ├── project-list.tsx          # Client component
│       │   │       │   └── project-list-providers.tsx # SWR provider wrapper
│       │   │       └── page.tsx      # Projects page
│       │   ├── config/
│       │   │   └── management-entity.ts # Domain → ManagementEntity mapping
│       │   └── lib/
│       │       ├── trpc.ts           # tRPC client setup (with x-management-entity header)
│       │       └── hooks.ts          # SWR integration hooks
│       ├── public/
│       └── tests/
│           └── e2e/
│               └── organization.spec.ts # E2E tests with Playwright
│
├── packages/
│   └── database/             # Database package (Prisma + Kysely)
│       ├── package.json
│       ├── tsconfig.json
│       ├── prisma/
│       │   ├── schema.prisma     # Database schema
│       │   ├── migrations/       # Migrations
│       │   └── rls-policies.sql  # RLS policy definitions
│       └── src/
│           ├── index.ts          # Export prisma & kysely clients
│           ├── client.ts         # Prisma client
│           ├── kysely.ts         # Kysely client
│           └── types.ts          # Generated by prisma-kysely
```

## Implementation Requirements

### 1. Database Package Structure

**Database Package** (`packages/kysely-prisma-database`):

```typescript
// packages/kysely-prisma-database/package.json
{
  "name": "@repo/database",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate && prisma-kysely",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "kysely": "^0.27.0",
    "kysely-postgres-js": "^2.0.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "prisma-kysely": "^1.8.0"
  }
}
```

```typescript
// packages/kysely-prisma-database/src/index.ts
export { prisma } from "./client";
export { db } from "./kysely";
export type * from "./types";
```

```typescript
// packages/kysely-prisma-database/src/client.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

```typescript
// packages/kysely-prisma-database/src/kysely.ts
import { Kysely, PostgresDialect } from "kysely";
import postgres from "postgres";
import type { DB } from "./types";

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: postgres(process.env.DATABASE_URL!),
  }),
});
```

**Prisma Schema**:

```prisma
// packages/kysely-prisma-database/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

generator kysely {
  provider = "prisma-kysely"
  output   = "../src"
  fileName = "types.ts"
}

enum ManagementEntity {
  ACME_CORP
  GLOBEX_INC
  WAYNE_ENTERPRISES
  STARK_INDUSTRIES
}

model Organization {
  id               Int              @id @default(autoincrement())
  name             String
  slug             String           @unique
  managementEntity ManagementEntity @default(ACME_CORP)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  projects         Project[]

  @@index([managementEntity])
}

model Project {
  id               Int              @id @default(autoincrement())
  name             String
  description      String?
  managementEntity ManagementEntity @default(ACME_CORP)
  organizationId   Int
  organization     Organization     @relation(fields: [organizationId], references: [id])
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([managementEntity])
  @@index([organizationId])
}
```

**RLS Policy Setup** (`packages/kysely-prisma-database/prisma/rls-policies.sql`):

```sql
-- Enable RLS on tables
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

-- Complete confidentiality mode (recommended)
-- Default: deny all access
CREATE POLICY deny_all_default_organization ON "Organization"
  USING (false);

CREATE POLICY deny_all_default_project ON "Project"
  USING (false);

-- Allow access only when session variable is set correctly
CREATE POLICY allow_with_session_organization ON "Organization"
  USING (
    current_setting('app.current_management_entity', true) IS NOT NULL
    AND current_setting('app.current_management_entity', true) != ''
    AND "managementEntity" = current_setting('app.current_management_entity', true)::text::"ManagementEntity"
  );

CREATE POLICY allow_with_session_project ON "Project"
  USING (
    current_setting('app.current_management_entity', true) IS NOT NULL
    AND current_setting('app.current_management_entity', true) != ''
    AND "managementEntity" = current_setting('app.current_management_entity', true)::text::"ManagementEntity"
  );
```

**Apply RLS Policies**:

```bash
# After running migrations
cd packages/kysely-prisma-database
psql $DATABASE_URL -f prisma/rls-policies.sql
```

### 2. API Server Package Configuration

**API Server Dependencies** (`apps/api/package.json`):

```json
{
  "name": "api",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup",
    "test:e2e": "vitest run"
  },
  "dependencies": {
    "@repo/database": "workspace:*",
    "@trpc/server": "^10.0.0",
    "express": "^4.18.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0",
    "tsx": "^4.0.0",
    "tsup": "^8.0.0"
  }
}
```

**Vitest Configuration** (`apps/api/vitest.config.ts`):

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});
```

**Test Setup** (`apps/api/tests/setup.ts`):

```typescript
import { beforeAll, afterAll } from "vitest";
import { prisma } from "@repo/kysely-prisma-database";

// Setup test database before all tests
beforeAll(async () => {
  // Run migrations if needed
  // Clean up test data
  await prisma.project.deleteMany({});
  await prisma.organization.deleteMany({});
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
```

### 3. Frontend: Management Entity Configuration

**Frontend passes `managementEntity` explicitly to backend via header:**

```typescript
// apps/web/src/config/management-entity.ts
import type { ManagementEntity } from "@repo/kysely-prisma-database";

const DOMAIN_MAPPING: Record<string, ManagementEntity> = {
  "advertiser.platform-a.example.com": "ACME_CORP",
  "publisher.platform-a.example.com": "ACME_CORP",
  "advertiser.platform-b.example.com": "GLOBEX_INC",
  "publisher.platform-b.example.com": "GLOBEX_INC",
  "localhost:3000": "ACME_CORP",
  "localhost:4000": "ACME_CORP",
};

export function getManagementEntityFromDomain(
  host: string,
): ManagementEntity | null {
  return DOMAIN_MAPPING[host] ?? null;
}

// Get current management entity from window.location.host
export function getCurrentManagementEntity(): ManagementEntity {
  if (typeof window === "undefined") {
    throw new Error(
      "getCurrentManagementEntity can only be called on client side",
    );
  }

  const entity = getManagementEntityFromDomain(window.location.host);

  if (!entity) {
    throw new Error(`Unknown domain: ${window.location.host}`);
  }

  return entity;
}
```

### 4. API Server: tRPC Context with Custom Header

```typescript
// apps/api/src/trpc/context.ts
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { prisma, db } from "@repo/kysely-prisma-database";
import type { ManagementEntity } from "@repo/kysely-prisma-database";

export const createContext = async (opts: CreateExpressContextOptions) => {
  // Read management entity from custom header sent by frontend
  const managementEntity = opts.req.headers["tenant"] as
    | ManagementEntity
    | undefined;

  // Validate header exists
  if (!managementEntity) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing tenant header",
    });
  }

  // Validate it's a valid enum value
  const validEntities: ManagementEntity[] = [
    "ACME_CORP",
    "GLOBEX_INC",
    "WAYNE_ENTERPRISES",
    "STARK_INDUSTRIES",
  ];
  if (!validEntities.includes(managementEntity)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `Invalid management entity: ${managementEntity}`,
    });
  }

  return {
    managementEntity,
    prisma,
    db,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 5. API Server: RLS Protection Middleware

```typescript
// apps/api/src/trpc/middleware.ts
import { sql } from "kysely";
import { middleware } from "./init";

export const rlsMiddleware = middleware(async ({ ctx, next }) => {
  // Set RLS session variable
  await ctx.db.execute(
    sql`SET app.current_management_entity = ${ctx.managementEntity}`,
  );

  return next({ ctx });
});

export const rlsProtectedProcedure = procedure.use(rlsMiddleware);
```

### 6. API Server: Router Implementation

```typescript
// apps/api/src/trpc/router.ts
import { z } from "zod";
import { createTRPCRouter } from "./init";
import { rlsProtectedProcedure } from "./middleware";

export const appRouter = createTRPCRouter({
  organization: createTRPCRouter({
    list: rlsProtectedProcedure.query(async ({ ctx }) => {
      // RLS automatically filters by current managementEntity
      return await ctx.db.selectFrom("Organization").selectAll().execute();
    }),

    create: rlsProtectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await ctx.db
          .insertInto("Organization")
          .values({
            ...input,
            managementEntity: ctx.managementEntity,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }),
  }),

  project: createTRPCRouter({
    list: rlsProtectedProcedure.query(async ({ ctx }) => {
      return await ctx.db.selectFrom("Project").selectAll().execute();
    }),

    create: rlsProtectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          organizationId: z.number().int().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await ctx.db
          .insertInto("Project")
          .values({
            ...input,
            managementEntity: ctx.managementEntity,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

### 7. Frontend: tRPC Client Setup

```typescript
// apps/web/src/lib/trpc.ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/../../api/src/trpc/router";
import { getCurrentManagementEntity } from "@/config/management-entity";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/trpc",
      headers: () => {
        // Get management entity from current domain and pass via custom header
        const managementEntity = getCurrentManagementEntity();
        return {
          tenant: managementEntity,
        };
      },
    }),
  ],
});
```

### 8. Frontend: SWR Integration Hooks

```typescript
// apps/web/src/lib/hooks.ts
"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { trpc } from "./trpc";

// Organization hooks
export function useOrganizations() {
  return useSWR(
    ["organization.list"],
    async () => await trpc.organization.list.query(),
  );
}

export function useCreateOrganization() {
  return useSWRMutation(
    ["organization.create"],
    async (_key, { arg }: { arg: { name: string; slug: string } }) => {
      return await trpc.organization.create.mutate(arg);
    },
  );
}

// Project hooks
export function useProjects() {
  return useSWR(["project.list"], async () => await trpc.project.list.query());
}

export function useCreateProject() {
  return useSWRMutation(
    ["project.create"],
    async (
      _key,
      {
        arg,
      }: {
        arg: {
          name: string;
          description?: string;
          organizationId: number;
        };
      },
    ) => {
      return await trpc.project.create.mutate(arg);
    },
  );
}
```

### 9. Frontend: SWR Provider

**Organizations Page Provider:**

```typescript
// apps/web/src/app/organizations/_presentation/organization-list-providers.tsx
'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

export function OrganizationListProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

**Projects Page Provider:**

```typescript
// apps/web/src/app/projects/_presentation/project-list-providers.tsx
'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

export function ProjectListProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### 10. Frontend: Root Layout

```typescript
// apps/web/src/app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Multi-Tenant RLS Sample',
  description: 'Row Level Security with Next.js and tRPC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 11. Frontend: Organization List Component

```typescript
// apps/web/src/app/organizations/_presentation/organization-list.tsx
'use client';

import { useOrganizations, useCreateOrganization } from '@/lib/hooks';
import { mutate } from 'swr';
import { useState } from 'react';

export function OrganizationList() {
  const { data: organizations, error, isLoading } = useOrganizations();
  const { trigger: createOrganization, isMutating } = useCreateOrganization();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createOrganization({ name, slug });
      await mutate(['organization.list']);
      setName('');
      setSlug('');
    } catch (err) {
      console.error('Failed to create organization:', err);
    }
  };

  if (isLoading) return <div>Loading organizations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Organizations</h2>
        <p className="text-gray-600">
          Management entity isolated organizations (filtered by domain)
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Slug
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isMutating}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isMutating ? 'Creating...' : 'Create Organization'}
        </button>
      </form>

      <ul className="space-y-2">
        {organizations?.map((org) => (
          <li key={org.id} className="rounded border p-4">
            <h3 className="font-semibold">{org.name}</h3>
            <p className="text-sm text-gray-600">
              {org.slug} • {org.managementEntity}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 12. Frontend: Organizations Page

```typescript
// apps/web/src/app/organizations/page.tsx
import { OrganizationList } from './_presentation/organization-list';
import { OrganizationListProviders } from './_presentation/organization-list-providers';

export default function OrganizationsPage() {
  return (
    <OrganizationListProviders>
      <main className="container mx-auto p-6">
        <OrganizationList />
      </main>
    </OrganizationListProviders>
  );
}
```

## Architecture Flow

```
┌─────────────────────────────────────────────────┐
│ Browser (platform-a.example.com)                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Next.js Frontend (Port 3000)                │ │
│ │ - Server Components                         │ │
│ │ - Client Components with SWR                │ │
│ │ - Domain Mapping Config                     │ │
│ │   (window.location.host → ACME_CORP)         │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────┘
                    │ HTTP Request
                    │ Header: tenant: ACME_CORP
                    ↓
┌─────────────────────────────────────────────────┐
│ Express + tRPC Backend (Port 4000)              │
│ ┌─────────────────────────────────────────────┐ │
│ │ Context Creation                            │ │
│ │ 1. Read tenant header                       │ │
│ │ 2. Validate enum value                      │ │
│ │ 3. Set ctx.managementEntity = ACME_CORP      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ RLS Middleware                              │ │
│ │ SET app.current_management_entity='ACME_CORP'│ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Query Execution (Kysely)                    │ │
│ │ SELECT * FROM "Organization"                │ │
│ │ (RLS policy auto-filters by ACME_CORP)       │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│ PostgreSQL with RLS                             │
│ - Organization table (RLS enabled)              │
│ - Project table (RLS enabled)                   │
└─────────────────────────────────────────────────┘
```

## Testing

### API Server E2E Tests

**Organization Router Tests**:

```typescript
// apps/api/tests/e2e/organization.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/index";

describe("Organization Router E2E", () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe("organization.list", () => {
    it("should return only ACME_CORP organizations", async () => {
      const response = await request(app)
        .post("/trpc/organization.list")
        .set("host", "platform-a.example.com")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.result.data).toBeInstanceOf(Array);
      response.body.result.data.forEach((org: any) => {
        expect(org.managementEntity).toBe("ACME_CORP");
      });
    });

    it("should return only GLOBEX_INC organizations", async () => {
      const response = await request(app)
        .post("/trpc/organization.list")
        .set("host", "platform-b.example.com")
        .send({});

      expect(response.status).toBe(200);
      response.body.result.data.forEach((org: any) => {
        expect(org.managementEntity).toBe("GLOBEX_INC");
      });
    });
  });

  describe("organization.create", () => {
    it("should create organization with correct managementEntity", async () => {
      const response = await request(app)
        .post("/trpc/organization.create")
        .set("host", "platform-a.example.com")
        .send({
          name: "Test Organization",
          slug: "test-organization",
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.managementEntity).toBe("ACME_CORP");
      expect(response.body.result.data.name).toBe("Test Organization");
    });
  });
});
```

**Project Router Tests**:

```typescript
// apps/api/tests/e2e/project.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/index";

describe("Project Router E2E", () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe("project.list", () => {
    it("should return only ACME_CORP projects", async () => {
      const response = await request(app)
        .post("/trpc/project.list")
        .set("host", "platform-a.example.com")
        .send({});

      expect(response.status).toBe(200);
      response.body.result.data.forEach((proj: any) => {
        expect(proj.managementEntity).toBe("ACME_CORP");
      });
    });
  });

  describe("project.create", () => {
    it("should create project with correct managementEntity", async () => {
      const response = await request(app)
        .post("/trpc/project.create")
        .set("host", "platform-a.example.com")
        .send({
          name: "Test Project",
          description: "Test description",
          organizationId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.managementEntity).toBe("ACME_CORP");
    });
  });
});
```

**RLS Isolation Tests**:

```typescript
// apps/api/tests/e2e/rls.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { prisma } from "@repo/kysely-prisma-database";

describe("RLS Management Entity Isolation E2E", () => {
  beforeAll(async () => {
    // Setup test data for both entities
    await prisma.organization.createMany({
      data: [
        {
          name: "Organization A1",
          slug: "org-a1",
          managementEntity: "ACME_CORP",
        },
        {
          name: "Organization A2",
          slug: "org-a2",
          managementEntity: "ACME_CORP",
        },
        {
          name: "Organization B1",
          slug: "org-b1",
          managementEntity: "GLOBEX_INC",
        },
        {
          name: "Organization B2",
          slug: "org-b2",
          managementEntity: "GLOBEX_INC",
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.organization.deleteMany({
      where: { slug: { in: ["org-a1", "org-a2", "org-b1", "org-b2"] } },
    });
  });

  it("should completely isolate ACME_CORP and GLOBEX_INC data", async () => {
    // Fetch ACME_CORP organizations
    const entityAResponse = await request(app)
      .post("/trpc/organization.list")
      .set("host", "platform-a.example.com")
      .send({});

    // Fetch GLOBEX_INC organizations
    const entityBResponse = await request(app)
      .post("/trpc/organization.list")
      .set("host", "platform-b.example.com")
      .send({});

    const entityAData = entityAResponse.body.result.data;
    const entityBData = entityBResponse.body.result.data;

    // Verify isolation
    expect(entityAData.length).toBe(2);
    expect(entityBData.length).toBe(2);

    // Verify no cross-entity data leakage
    const entityASlugs = entityAData.map((org: any) => org.slug);
    const entityBSlugs = entityBData.map((org: any) => org.slug);

    expect(entityASlugs).toContain("org-a1");
    expect(entityASlugs).toContain("org-a2");
    expect(entityASlugs).not.toContain("org-b1");
    expect(entityASlugs).not.toContain("org-b2");

    expect(entityBSlugs).toContain("org-b1");
    expect(entityBSlugs).toContain("org-b2");
    expect(entityBSlugs).not.toContain("org-a1");
    expect(entityBSlugs).not.toContain("org-a2");
  });

  it("should reject requests from unknown domains", async () => {
    const response = await request(app)
      .post("/trpc/organization.list")
      .set("host", "unknown-domain.example.com")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.message).toContain("Unknown domain");
  });
});
```

### Web E2E Tests with Playwright

```typescript
// apps/web/tests/e2e/organization.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Organization Management", () => {
  test("should show only entity-specific organizations", async ({ page }) => {
    // Visit with ACME_CORP domain
    await page.goto("http://platform-a.example.com:3000/organizations");

    await expect(
      page.getByRole("heading", { name: "Organizations" }),
    ).toBeVisible();

    // Create organization
    await page.fill('input[name="name"]', "Test Organization A");
    await page.fill('input[name="slug"]', "test-org-a");
    await page.click('button[type="submit"]');

    // Verify it appears in the list
    await expect(page.getByText("Test Organization A")).toBeVisible();
    await expect(page.getByText("ACME_CORP")).toBeVisible();
  });
});
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Database: Generate and migrate
cd packages/kysely-prisma-database
pnpm db:generate  # Generate Prisma Client and Kysely types
pnpm db:migrate   # Run migrations
psql $DATABASE_URL -f prisma/rls-policies.sql  # Apply RLS policies

# Start development servers (parallel)
pnpm dev  # Starts both api and web

# Or individually:
cd apps/api && pnpm dev   # Port 4000
cd apps/web && pnpm dev   # Port 3000

# Database management
cd packages/kysely-prisma-database
pnpm db:studio    # Open Prisma Studio

# Run tests
pnpm test              # All tests (api + web)
cd apps/api && pnpm test:e2e      # API E2E tests (all routers)
cd apps/web && pnpm test:e2e      # Web E2E tests
```

## Environment Variables

```bash
# .env (root)
DATABASE_URL="postgresql://user:pass@localhost:5432/rls_sample"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000/trpc"
```

## Key Features

✅ **Frontend-driven Entity Detection**: Management entity determined on frontend and passed via header
✅ **Clear Responsibility Separation**: Frontend owns domain mapping, backend validates and enforces RLS
✅ **End-to-end Type Safety**: tRPC provides full type safety
✅ **Modern React**: Next.js App Router with Server/Client Components
✅ **Flexible Data Fetching**: SWR for client-side state management
✅ **Simple Configuration**: Domain mapping managed in frontend application code
✅ **Comprehensive Testing**: Router-level E2E tests for API + Playwright E2E for Web
✅ **Production Ready**: Docker, testing, and proper architecture

## Important Notes

### Security First

- **Reliable isolation through RLS**: Database-level enforcement prevents data leakage even with application bugs
- **Complete confidentiality mode**: Default deny-all policies with explicit allow rules
- **Session-based access control**: All queries require valid `app.current_management_entity` setting

### Type Safety

- **TypeScript end-to-end**: Leverage TypeScript + Prisma + Kysely type system
- **tRPC type inference**: Automatic type sharing between frontend and backend
- **Generated types**: Prisma Client and Kysely types auto-generated from schema

### Practicality

- **Production-ready**: Docker setup, comprehensive testing, monitoring-ready
- **Maintainable code**: Clear separation of concerns, well-documented patterns
- **Scalable architecture**: Monorepo structure supports growth

### Performance Considerations

- **Index optimization**: All `managementEntity` columns are indexed
- **Connection pooling**: Proper database connection management
- **Query performance**: RLS policies use indexed columns for efficient filtering

## Quick Start

```bash
# Clone and setup
git clone [repository]
cd express-trpc-rls-sample
pnpm install

# Start database
docker compose up -d

# Setup database
cd packages/kysely-prisma-database
pnpm db:generate
pnpm db:migrate
psql $DATABASE_URL -f prisma/rls-policies.sql

# Start development
cd ../..
pnpm dev

# Run tests
pnpm test
```

Visit `http://localhost:3000` to see the web application, or use `http://localhost:4000/trpc` for API access.

## Troubleshooting

**Problem**: Queries return empty results

- **Solution**: Verify `app.current_management_entity` is set in RLS middleware
- **Check**: Run `SHOW app.current_management_entity;` in psql session

**Problem**: "Unknown domain" error

- **Solution**: Add domain to `DOMAIN_MAPPING` in `apps/api/src/config/domain-mapping.ts`

**Problem**: Type errors after schema changes

- **Solution**: Run `pnpm db:generate` to regenerate Prisma Client and Kysely types

---

## RLS Migration Management

### Objective

Migrate existing standalone RLS policy SQL files (`rls-policies.sql`) into Prisma migration management to ensure RLS policies are version-controlled and applied atomically with schema changes.

### Current State

The `express-trpc-rls-sample` project currently manages RLS policies in a separate SQL file:

- **Location**: `packages/kysely-prisma-database/prisma/rls-policies.sql`
- **Application**: Manually applied via custom scripts
- **Problem**: RLS policies are not synchronized with Prisma schema migrations

### Target State

- RLS policies embedded directly in Prisma migration files
- Policies applied automatically with `prisma migrate deploy`
- Full version control and rollback capability
- Atomic application with schema changes

### Migration Steps

#### Step 1: Review Current RLS Policy

**Current File**: `packages/kysely-prisma-database/prisma/rls-policies.sql`

```sql
-- Enable RLS on tables
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;

-- Complete confidentiality mode (recommended)
-- Default: deny all access
CREATE POLICY deny_all_default_workspace ON "Workspace"
  USING (false);

CREATE POLICY deny_all_default_site ON "Site"
  USING (false);

-- Allow access only when session variable is set correctly
CREATE POLICY allow_with_session_workspace ON "Workspace"
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );

CREATE POLICY allow_with_session_site ON "Site"
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );
```

#### Step 2: Create New Migration with RLS Policies

**Command**:

```bash
cd packages/kysely-prisma-database
pnpm prisma migrate dev --name integrate_rls_policies --create-only
```

**Expected Output**:

- New migration file created at: `prisma/migrations/YYYYMMDDHHMMSS_integrate_rls_policies/migration.sql`

#### Step 3: Edit Migration File to Include RLS Policies

**File**: `prisma/migrations/YYYYMMDDHHMMSS_integrate_rls_policies/migration.sql`

Since this is an empty migration (no schema changes), the file will be empty. Manually add the RLS policy definitions:

```sql
-- ================================================================
-- MANUALLY ADDED: RLS POLICIES MIGRATION
-- Migration: integrate_rls_policies
-- Purpose: Move standalone RLS policies into Prisma migration
-- ================================================================

-- ----------------------------------------------------------------
-- Step 1: Enable Row Level Security on all tenant-scoped tables
-- ----------------------------------------------------------------
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Step 2: Create RLS Policies for Workspace
-- ----------------------------------------------------------------

-- Policy: Default Deny (complete confidentiality mode)
-- This policy ensures that without proper session variables, no data is accessible
CREATE POLICY deny_all_default_workspace ON "Workspace"
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (false);

-- Policy: Tenant Isolation (allow access with valid session variable)
CREATE POLICY allow_with_session_workspace ON "Workspace"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );

-- ----------------------------------------------------------------
-- Step 3: Create RLS Policies for Site
-- ----------------------------------------------------------------

-- Policy: Default Deny (complete confidentiality mode)
CREATE POLICY deny_all_default_site ON "Site"
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (false);

-- Policy: Tenant Isolation (allow access with valid session variable)
CREATE POLICY allow_with_session_site ON "Site"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );

-- ================================================================
-- END OF RLS POLICIES MIGRATION
-- ================================================================
```

**Key Points**:

- Use `AS RESTRICTIVE` for deny-all policies to ensure they cannot be bypassed
- Use `AS PERMISSIVE` for allow policies to enable access when conditions are met
- Session variable validation prevents empty or null tenant values
- Cast session variable to `Tenant` enum for type safety

### Important Considerations

#### 1. Migration File Protection

**Risk**: `prisma migrate dev` may regenerate migration files and overwrite manual RLS additions.

**Mitigation**:

- Always use `--create-only` flag when creating migrations that will include manual SQL
- Manually edit the generated migration file before applying
- Add clear comment markers to distinguish Prisma auto-generated vs. manually added sections
- Use `prisma migrate deploy` (not `dev`) in CI/CD pipelines
- Never run `prisma migrate dev` without `--create-only` on existing RLS migrations

#### 2. Adding RLS to New Tables

**When adding new tenant-scoped tables**, follow this workflow:

**Step 1**: Add model to `schema.prisma` with `tenant` field:

```prisma
model NewTable {
  id        Int      @id @default(autoincrement())
  name      String
  tenant    Tenant   @default(ACME_CORP)
  createdAt DateTime @default(now())

  @@index([tenant])
}
```

**Step 2**: Create migration with RLS policies:

```bash
cd packages/kysely-prisma-database
pnpm prisma migrate dev --name add_new_table_with_rls --create-only
```

**Step 3**: Edit migration file to add RLS policies:

```sql
-- ================================================================
-- AUTO-GENERATED BY PRISMA (DO NOT MODIFY THIS SECTION)
-- ================================================================
-- CreateTable
CREATE TABLE "NewTable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tenant" "Tenant" NOT NULL DEFAULT 'ACME_CORP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewTable_tenant_idx" ON "NewTable"("tenant");

-- ================================================================
-- MANUALLY ADDED: RLS CONFIGURATION
-- ================================================================

-- Enable RLS
ALTER TABLE "NewTable" ENABLE ROW LEVEL SECURITY;

-- Default deny policy
CREATE POLICY deny_all_default_new_table ON "NewTable"
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (false);

-- Tenant isolation policy
CREATE POLICY allow_with_session_new_table ON "NewTable"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );
```

**Step 4**: Apply migration:

```bash
pnpm prisma migrate deploy
```

#### 3. Testing in Development

**Option 1: Bypass RLS with Superuser Role**

If your development database user is a superuser, RLS is automatically bypassed:

```sql
-- Check if current user is superuser
SELECT rolsuper FROM pg_roles WHERE rolname = current_user;
```

**Option 2: Temporarily Disable RLS**

```sql
-- Disable RLS on specific table
ALTER TABLE "Workspace" DISABLE ROW LEVEL SECURITY;

-- Re-enable when testing
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
```

**Option 3: Test with Session Variables**

Use the verification script to test with different tenant contexts.

#### 4. Rollback Procedure

**If migration fails:**

```bash
cd packages/kysely-prisma-database

# Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back YYYYMMDDHHMMSS_integrate_rls_policies

# Manually clean up database if needed
psql $DATABASE_URL -c "ALTER TABLE \"Workspace\" DISABLE ROW LEVEL SECURITY;"
psql $DATABASE_URL -c "DROP POLICY IF EXISTS deny_all_default_workspace ON \"Workspace\";"
psql $DATABASE_URL -c "DROP POLICY IF EXISTS allow_with_session_workspace ON \"Workspace\";"
```

**If RLS causes application issues:**

1. Check session variable is being set correctly in middleware
2. Verify policy names match expected values
3. Use verification script to debug tenant isolation
4. Check PostgreSQL logs for RLS-related errors:

```bash
# View PostgreSQL logs
docker compose logs postgres | grep -i "rls\|policy"
```

### Benefits of This Approach

#### ✅ Version Control

- RLS policies tracked in Git alongside schema changes
- Full history of policy modifications
- Easy to review changes in pull requests

#### ✅ Atomic Application

- Schema and RLS policies applied together
- No risk of schema-policy mismatch
- Rollback works for both schema and policies

#### ✅ CI/CD Integration

- `prisma migrate deploy` applies everything automatically
- No custom scripts needed for RLS setup
- Consistent deployment across environments

#### ✅ Developer Experience

- Single source of truth for database configuration
- Clear migration history
- Standard Prisma workflow

---

## See Also

- [Tenant Identification Patterns](./TENANT_PATTERNS.md) - Different methods for tenant identification
- [Pattern 2: Hono Implementation](./pattern-2-hono.md) - Alternative implementation with Hono framework
