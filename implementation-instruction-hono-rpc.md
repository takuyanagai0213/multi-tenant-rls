# Pattern 3: Hono RPC - RLS Implementation Guide

> **Note**: This guide builds upon the existing implementation. The database layer and web frontend base are already in place. This guide focuses on adding Hono RPC server and updating the frontend to use Hono RPC client with TanStack Query.

## Overview

This guide demonstrates a complete multi-tenant isolation system using PostgreSQL Row Level Security (RLS) with **Hono RPC** for end-to-end type safety.

### What is Hono RPC?

Hono RPC is a type-safe RPC (Remote Procedure Call) system built into Hono v4+, providing:

- **End-to-end type safety** without code generation
- **Automatic type inference** from server to client
- **Zero runtime overhead** - types are compile-time only
- **Seamless integration** with existing Hono middleware

### Tech Stack

- **Hono RPC**: Type-safe API with automatic client generation
- **Kysely**: Type-safe SQL query builder
- **Prisma**: Database ORM and schema management
- **Next.js**: React framework with App Router (frontend)
- **TanStack Query (React Query)**: Data fetching and state management
- **Zod**: Runtime validation

## Project Background

In a multi-entity affiliate marketing platform, the following tenant isolation needs to be achieved:

- **ACME Corp** - Service Type A
- **Globex Inc** - Service Type B
- **Wayne Enterprises** - Enterprise Client
- **Stark Industries** - Enterprise Client

### Challenges

1. **Business Continuity Risk**: Risk of operational entity identity disclosure between different service types
2. **Confidential Information Leakage Risk**: Risk of confidential transaction data cross-leakage between tenants

### Solution Approach

**Row Level Security (RLS)** for physical data isolation, achieving:

- Complete tenant isolation at the database level
- Structural prevention of information leakage due to developer errors
- Zero trust architecture - even with application bugs, database enforces isolation
- End-to-end type safety from database to frontend with Hono RPC

## Project Structure (Monorepo)

```
hono-rpc-rls-sample/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspaces
├── turbo.json                # Turborepo config
├── docker-compose.yml        # PostgreSQL
├── .env                      # Shared environment variables
│
├── apps/
│   ├── api-hono-rpc/         # Hono RPC server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts      # Hono server entry
│   │   │   ├── lib/
│   │   │   │   └── rls-helpers.ts # RLS utilities
│   │   │   ├── middleware/
│   │   │   │   └── rls.ts    # RLS setup middleware
│   │   │   ├── routes/
│   │   │   │   ├── workspace.ts # Workspace RPC routes
│   │   │   │   └── site.ts      # Site RPC routes
│   │   │   ├── schemas/
│   │   │   │   └── api.ts    # Zod schemas
│   │   │   └── types/
│   │   │       └── app.ts    # Exported app type for client
│   │   └── tests/
│   │       ├── setup.ts
│   │       └── e2e/
│   │           ├── workspace.test.ts
│   │           ├── site.test.ts
│   │           └── rls.test.ts
│   │
│   └── web/                  # Next.js App Router
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── workspaces/
│       │   │   │   └── page.tsx
│       │   │   └── sites/
│       │   │       └── page.tsx
│       │   ├── config/
│       │   │   └── tenant.ts # Domain → Tenant mapping
│       │   ├── lib/
│       │   │   └── api-client.ts # Hono RPC client setup
│       │   └── hooks/
│       │       ├── use-workspaces.ts # React Query hooks
│       │       └── use-sites.ts
│       └── tests/
│
├── packages/
│   └── database/
│       ├── package.json
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── src/
│           ├── index.ts
│           ├── kysely.ts
│           └── types.ts
```

## Implementation Status

### ✅ Already Implemented
- **Database Package** (`packages/kysely-prisma-database/`): Prisma schema, Kysely setup, RLS policies are already implemented
- **Web Frontend** (`apps/web/`): Next.js App Router, layout, pages, and basic components are implemented
- **Tenant Configuration**: Domain-based tenant mapping is already implemented

### 🚧 To Be Implemented
- **Hono RPC Server** (`apps/api-hono-rpc/`): New implementation required
- **Hono RPC Client** in web app: Update existing web app to use Hono RPC client
- **TanStack Query Hooks**: Replace existing SWR hooks with TanStack Query hooks

## Implementation Steps

### 1. Database Package (Already Implemented ✅)

**Note**: This package is already implemented. No changes required.

```typescript
// packages/kysely-prisma-database/prisma/schema.prisma
enum Tenant {
  ACME_CORP
  GLOBEX_INC
  WAYNE_ENTERPRISES
  STARK_INDUSTRIES
}

model Workspace {
  id        Int      @id @default(autoincrement())
  name      String
  slug      String   @unique
  tenant    Tenant   @default(ACME_CORP)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sites     Site[]

  @@index([tenant])
}

model Site {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  tenant      Tenant    @default(ACME_CORP)
  workspaceId Int
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([tenant])
  @@index([workspaceId])
}
```

### 2. API Server Package Configuration (New Implementation Required 🚧)

**Note**: This is a new package that needs to be created from scratch.

```json
// apps/api-hono-rpc/package.json
{
  "name": "api-hono-rpc",
  "version": "0.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup",
    "test:e2e": "vitest run"
  },
  "dependencies": {
    "@repo/database": "workspace:*",
    "hono": "^4.6.0",
    "zod": "^3.23.0",
    "kysely": "^0.27.4"
  },
  "devDependencies": {
    "@hono/node-server": "^1.13.0",
    "tsx": "^4.19.0",
    "tsup": "^8.2.0",
    "vitest": "^2.0.0"
  }
}
```

### 3. Hono RPC Server Setup

```typescript
// apps/api-hono-rpc/src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { workspaceApp } from "./routes/workspace";
import { siteApp } from "./routes/site";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Mount RPC routes
const routes = app
  .route("/workspaces", workspaceApp)
  .route("/sites", siteApp);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 4000;
console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Export type for client
export type AppType = typeof routes;
```

### 4. RLS Middleware with Hono RPC

```typescript
// apps/api-hono-rpc/src/middleware/rls.ts
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { setRLSContext } from "../lib/rls-helpers";
import type { Tenant } from "@repo/kysely-prisma-database";

const VALID_TENANTS: Tenant[] = [
  "ACME_CORP",
  "GLOBEX_INC",
  "WAYNE_ENTERPRISES",
  "STARK_INDUSTRIES",
];

export const rlsMiddleware = createMiddleware(async (c, next) => {
  const tenant = c.req.header("x-tenant") as Tenant | undefined;

  if (!tenant) {
    throw new HTTPException(401, {
      message: "Missing x-tenant header",
    });
  }

  if (!VALID_TENANTS.includes(tenant)) {
    throw new HTTPException(401, {
      message: `Invalid tenant: ${tenant}`,
    });
  }

  // Set RLS session variable
  await setRLSContext(tenant);

  // Store in context
  c.set("tenant", tenant);

  await next();
});

// Extend Hono's context variables type
declare module "hono" {
  interface ContextVariableMap {
    tenant: Tenant;
  }
}
```

### 5. Workspace RPC Routes

```typescript
// apps/api-hono-rpc/src/routes/workspace.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/kysely-prisma-database";
import { rlsMiddleware } from "../middleware/rls";
import { createWorkspaceSchema, workspaceResponseSchema } from "../schemas/api";
import { getTenantFromSession } from "../lib/rls-helpers";

const app = new Hono();

// Apply RLS middleware to all routes
app.use("*", rlsMiddleware);

// List workspaces
export const workspaceApp = app
  .get("/", async (c) => {
    const workspaces = await db.selectFrom("Workspace").selectAll().execute();
    return c.json(workspaces);
  })
  // Create workspace
  .post("/", zValidator("json", createWorkspaceSchema), async (c) => {
    const data = c.req.valid("json");

    const workspace = await db
      .insertInto("Workspace")
      .values({
        ...data,
        tenant: getTenantFromSession(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return c.json(workspace);
  })
  // Get workspace by ID
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    const workspace = await db
      .selectFrom("Workspace")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json(workspace);
  })
  // Update workspace
  .put("/:id", zValidator("json", createWorkspaceSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    const workspace = await db
      .updateTable("Workspace")
      .set(data)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json(workspace);
  })
  // Delete workspace
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    const workspace = await db
      .deleteFrom("Workspace")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json({ success: true });
  });

export type WorkspaceApp = typeof workspaceApp;
```

### 6. Site RPC Routes

```typescript
// apps/api-hono-rpc/src/routes/site.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/kysely-prisma-database";
import { rlsMiddleware } from "../middleware/rls";
import { createSiteSchema } from "../schemas/api";
import { getTenantFromSession } from "../lib/rls-helpers";

const app = new Hono();

app.use("*", rlsMiddleware);

export const siteApp = app
  .get("/", async (c) => {
    const sites = await db.selectFrom("Site").selectAll().execute();
    return c.json(sites);
  })
  .post("/", zValidator("json", createSiteSchema), async (c) => {
    const data = c.req.valid("json");

    const site = await db
      .insertInto("Site")
      .values({
        ...data,
        tenant: getTenantFromSession(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return c.json(site);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    const site = await db
      .selectFrom("Site")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!site) {
      return c.json({ error: "Site not found" }, 404);
    }

    return c.json(site);
  })
  .put("/:id", zValidator("json", createSiteSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    const site = await db
      .updateTable("Site")
      .set(data)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!site) {
      return c.json({ error: "Site not found" }, 404);
    }

    return c.json(site);
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    const site = await db
      .deleteFrom("Site")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!site) {
      return c.json({ error: "Site not found" }, 404);
    }

    return c.json({ success: true });
  });

export type SiteApp = typeof siteApp;
```

### 7. Zod Schemas

```typescript
// apps/api-hono-rpc/src/schemas/api.ts
import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const createSiteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  workspaceId: z.number().int().positive(),
});

export const workspaceResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tenant: z.enum(["ACME_CORP", "GLOBEX_INC", "WAYNE_ENTERPRISES", "STARK_INDUSTRIES"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const siteResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  tenant: z.enum(["ACME_CORP", "GLOBEX_INC", "WAYNE_ENTERPRISES", "STARK_INDUSTRIES"]),
  workspaceId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

### 8. Frontend: Hono RPC Client Setup (Update Required 🚧)

**Note**: Web app is already implemented, but needs to be updated to use Hono RPC client instead of the current REST/SWR approach.

**Current Implementation**: `apps/web/src/lib/api-client-hono.ts` exists but uses fetch
**Required Change**: Update to use Hono RPC client with `hc<AppType>()`

```typescript
// apps/web/src/lib/api-client-rpc.ts (new file)
import { hc } from "hono/client";
import type { AppType } from "@repo/api-hono-rpc";
import { getCurrentTenant } from "@/config/tenant";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const createApiClient = () => {
  const tenant = getCurrentTenant();

  const client = hc<AppType>(API_BASE_URL, {
    headers: {
      "x-tenant": tenant,
    },
  });

  return client;
};

// Export typed client
export const apiClient = createApiClient();
```

### 9. Frontend: TanStack Query Integration (Update Required 🚧)

**Note**: Current implementation uses SWR in `apps/web/src/lib/hooks-hono.ts`
**Required Change**: Create new TanStack Query hooks to replace SWR

**Installation Required**:
```bash
cd apps/web
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

```typescript
// apps/web/src/hooks/use-workspaces.ts (new file)
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await apiClient.workspaces.$get();
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return res.json();
    },
  });
}

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: ["workspaces", id],
    queryFn: async () => {
      const res = await apiClient.workspaces[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return res.json();
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiClient.workspaces.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create workspace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiClient.workspaces[":id"].$put({
        param: { id: id.toString() },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to update workspace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.workspaces[":id"].$delete({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to delete workspace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
```

### 10. Frontend: React Query Provider (New File Required 🚧)

**Note**: This is a new file that needs to be created and integrated into the existing layout.

```typescript
// apps/web/src/app/providers.tsx (new file)
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 11. Frontend: Workspace List Component (Update Required 🚧)

**Note**: Page already exists at `apps/web/src/app/workspaces/page.tsx` but uses SWR
**Required Change**: Update to use TanStack Query hooks

**Current File**: Uses `workspace-list.tsx` and `workspace-list-providers.tsx`
**Required Change**: Update component to use new hooks

```typescript
// apps/web/src/app/workspaces/page.tsx (update existing file)
"use client";

import { useWorkspaces, useCreateWorkspace, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useState } from "react";

export default function WorkspacesPage() {
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkspace.mutateAsync({ name, slug });
    setName("");
    setSlug("");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      await deleteWorkspace.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Workspaces</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={createWorkspace.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
        </button>
      </form>

      <div className="space-y-4">
        {workspaces?.map((workspace) => (
          <div key={workspace.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{workspace.name}</h3>
              <p className="text-sm text-gray-600">
                {workspace.slug} • {workspace.tenant}
              </p>
            </div>
            <button
              onClick={() => handleDelete(workspace.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 12. Frontend: Root Layout with Providers (Update Required 🚧)

**Note**: Layout already exists at `apps/web/src/app/layout.tsx`
**Required Change**: Wrap with React Query provider

```typescript
// apps/web/src/app/layout.tsx (update existing file)
import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Multi-Tenant RLS with Hono RPC",
  description: "Type-safe multi-tenant application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Architecture Flow

```
┌─────────────────────────────────────────────────┐
│ Browser (localhost:3000)                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Next.js Frontend                            │ │
│ │ - TanStack Query for data fetching          │ │
│ │ - Hono RPC Client (fully typed)             │ │
│ │ - Domain → Tenant mapping                   │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────┘
                    │ HTTP Request
                    │ Header: x-tenant: ACME_CORP
                    │ (Types flow from server)
                    ↓
┌─────────────────────────────────────────────────┐
│ Hono RPC Server (Port 4000)                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ RLS Middleware                              │ │
│ │ 1. Read x-tenant header                     │ │
│ │ 2. Validate tenant value                    │ │
│ │ 3. SET app.current_tenant                   │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ RPC Route Handler                           │ │
│ │ - Type-safe request/response                │ │
│ │ - Validates with Zod                        │ │
│ │ - Executes query with Kysely                │ │
│ │ - RLS auto-filters by ACME_CORP             │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Export AppType                              │ │
│ │ - Client imports server types               │ │
│ │ - Full type inference                       │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│ PostgreSQL with RLS                             │
│ - Workspace table (RLS enabled)                 │
│ - Site table (RLS enabled)                      │
└─────────────────────────────────────────────────┘
```

## Testing

### API E2E Tests

```typescript
// apps/api-hono-rpc/tests/e2e/workspace.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { testClient } from "hono/testing";
import app from "../../src/index";

describe("Workspace RPC E2E", () => {
  const client = testClient(app);

  it("should create and fetch workspace with ACME_CORP tenant", async () => {
    // Create workspace
    const createRes = await client.workspaces.$post(
      {
        json: {
          name: "Test Workspace",
          slug: "test-workspace",
        },
      },
      {
        headers: {
          "x-tenant": "ACME_CORP",
        },
      }
    );

    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created.tenant).toBe("ACME_CORP");

    // Fetch workspaces
    const listRes = await client.workspaces.$get({
      headers: {
        "x-tenant": "ACME_CORP",
      },
    });

    expect(listRes.status).toBe(200);
    const workspaces = await listRes.json();
    expect(workspaces).toContainEqual(
      expect.objectContaining({ slug: "test-workspace" })
    );
  });

  it("should enforce RLS isolation between tenants", async () => {
    // Create with ACME_CORP
    await client.workspaces.$post(
      {
        json: { name: "ACME Workspace", slug: "acme-workspace" },
      },
      { headers: { "x-tenant": "ACME_CORP" } }
    );

    // Try to fetch with GLOBEX_INC
    const res = await client.workspaces.$get({
      headers: { "x-tenant": "GLOBEX_INC" },
    });

    const workspaces = await res.json();
    expect(workspaces).not.toContainEqual(
      expect.objectContaining({ slug: "acme-workspace" })
    );
  });
});
```

## Key Features

✅ **End-to-end Type Safety**: Full TypeScript inference from server to client
✅ **Zero Code Generation**: No build step required for type sharing
✅ **Automatic Type Updates**: Client types update automatically when server changes
✅ **RLS Integration**: Database-level tenant isolation
✅ **TanStack Query**: Powerful data fetching and caching
✅ **Zod Validation**: Runtime type validation
✅ **Developer Experience**: Autocomplete and type checking everywhere
✅ **Performance**: Minimal overhead, same as regular Hono

## Advantages over tRPC

| Feature | Hono RPC | tRPC |
|---------|----------|------|
| **Setup Complexity** | Simple, built into Hono | Requires additional setup |
| **Code Generation** | None required | May need codegen for some features |
| **Bundle Size** | Smaller | Larger |
| **Learning Curve** | Lower (if you know Hono) | Steeper |
| **Flexibility** | Works with any Hono middleware | More opinionated |
| **Type Safety** | Full | Full |
| **Performance** | Excellent | Excellent |

## Files to Create/Update

### New Files (API Server)
```
apps/api-hono-rpc/
├── package.json                      # NEW
├── tsconfig.json                     # NEW
├── vitest.config.ts                  # NEW
├── src/
│   ├── index.ts                      # NEW - Main server with AppType export
│   ├── lib/
│   │   └── rls-helpers.ts            # NEW - RLS utility functions
│   ├── middleware/
│   │   └── rls.ts                    # NEW - RLS middleware
│   ├── routes/
│   │   ├── workspace.ts              # NEW - Workspace RPC routes
│   │   └── site.ts                   # NEW - Site RPC routes
│   └── schemas/
│       └── api.ts                    # NEW - Zod schemas
└── tests/
    ├── setup.ts                      # NEW
    └── e2e/
        ├── workspace.test.ts         # NEW
        ├── site.test.ts              # NEW
        └── rls.test.ts               # NEW
```

### New Files (Frontend)
```
apps/web/src/
├── app/
│   └── providers.tsx                 # NEW - React Query provider
├── lib/
│   └── api-client-rpc.ts             # NEW - Hono RPC client
└── hooks/
    ├── use-workspaces.ts             # NEW - TanStack Query hooks
    └── use-sites.ts                  # NEW - TanStack Query hooks
```

### Files to Update (Frontend)
```
apps/web/
├── package.json                      # UPDATE - Add @tanstack/react-query
├── src/
│   ├── app/
│   │   ├── layout.tsx                # UPDATE - Add Providers wrapper
│   │   ├── workspaces/page.tsx       # UPDATE - Use new hooks
│   │   └── sites/page.tsx            # UPDATE - Use new hooks
```

### Files Already Implemented (No Changes)
```
packages/kysely-prisma-database/                    # ✅ Already implemented
apps/web/src/config/tenant.ts         # ✅ Already implemented
apps/web/src/app/layout.tsx           # ✅ Already implemented (needs update)
apps/web/src/app/workspaces/          # ✅ Already implemented (needs update)
apps/web/src/app/sites/               # ✅ Already implemented (needs update)
```

## Implementation Checklist

### Phase 1: API Server Setup (New Implementation)
- [ ] Create `apps/api-hono-rpc/` directory
- [ ] Set up `package.json` with dependencies
- [ ] Implement RLS middleware
- [ ] Create Workspace RPC routes
- [ ] Create Site RPC routes
- [ ] Export `AppType` for client consumption
- [ ] Write E2E tests

### Phase 2: Frontend Updates
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `apps/web/src/lib/api-client-rpc.ts` (Hono RPC client)
- [ ] Create `apps/web/src/app/providers.tsx` (React Query provider)
- [ ] Update `apps/web/src/app/layout.tsx` to use providers
- [ ] Create `apps/web/src/hooks/use-workspaces.ts` (TanStack Query hooks)
- [ ] Create `apps/web/src/hooks/use-sites.ts` (TanStack Query hooks)
- [ ] Update `apps/web/src/app/workspaces/page.tsx` to use new hooks
- [ ] Update `apps/web/src/app/sites/page.tsx` to use new hooks
- [ ] Remove old SWR-based components if no longer needed

### Phase 3: Testing & Cleanup
- [ ] Test RLS isolation with different tenants
- [ ] Verify type safety end-to-end
- [ ] Update documentation
- [ ] Remove unused dependencies (SWR if fully migrated)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Database setup
cd packages/kysely-prisma-database
pnpm db:generate
pnpm db:migrate
psql $DATABASE_URL -f prisma/rls-policies.sql

# Start development servers
pnpm dev  # Starts both api-hono-rpc and web

# Or individually:
cd apps/api-hono-rpc && pnpm dev   # Port 4000
cd apps/web && pnpm dev            # Port 3000

# Run tests
cd apps/api-hono-rpc && pnpm test:e2e
```

## Environment Variables

```bash
# .env (root)
DATABASE_URL="postgresql://user:password@localhost:5432/rls_sample"

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Migration from Standard Hono

If you have an existing Hono API:

1. **Export app type** from your Hono server
2. **Install Hono client** in your frontend: `pnpm add hono`
3. **Create typed client** using `hc<AppType>()`
4. **Replace fetch calls** with typed client calls
5. **Enjoy autocomplete** and type safety!

## Troubleshooting

### Type Inference Issues

**Problem**: Types not inferring correctly
**Solution**: Ensure you're importing `AppType` from the server package

```typescript
// ❌ Wrong
import type { AppType } from "../../../api-hono-rpc/src/index";

// ✅ Correct - use package name
import type { AppType } from "@repo/api-hono-rpc";
```

### Header Not Being Sent

**Problem**: x-tenant header not included in requests
**Solution**: Create client inside a function that reads current tenant

```typescript
// Create client dynamically
export const getApiClient = () => {
  const tenant = getCurrentTenant();
  return hc<AppType>(API_URL, {
    headers: { "x-tenant": tenant },
  });
};
```

## Best Practices

1. **Type Exports**: Always export your app type for client consumption
2. **Middleware Order**: Apply RLS middleware before route-specific middleware
3. **Error Handling**: Use `HTTPException` for consistent error responses
4. **Validation**: Use Zod schemas for all input validation
5. **Caching**: Leverage TanStack Query's built-in caching
6. **Testing**: Write E2E tests using Hono's `testClient`

## Conclusion

Hono RPC provides a lightweight, type-safe alternative to tRPC with seamless integration with Hono's ecosystem. Combined with PostgreSQL RLS, it creates a robust, secure, and developer-friendly multi-tenant architecture.
