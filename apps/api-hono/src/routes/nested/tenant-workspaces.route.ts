import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { db, Tenant } from "@repo/kysely-prisma-database";
import { errorSchema } from "../../schemas/common.schema";
import { siteSchema, createSiteSchema } from "../../schemas/site.schema";
import { workspaceSchema, createWorkspaceSchema } from "../../schemas/workspace.schema";
import { z } from "zod";

// Schema for tenant-based nested routes
const tenantParam = z.object({
  tenant: z.nativeEnum(Tenant),
});

const tenantWorkspaceParams = z.object({
  tenant: z.nativeEnum(Tenant),
  workspaceId: z.string().regex(/^\d+$/).transform(Number),
});

const tenantWorkspaceSiteParams = z.object({
  tenant: z.nativeEnum(Tenant),
  workspaceId: z.string().regex(/^\d+$/).transform(Number),
  siteId: z.string().regex(/^\d+$/).transform(Number),
});

// ============================================
// Tenant Nested Routes: /{tenant}/workspaces
// ============================================

// GET /{tenant}/workspaces - List workspaces for a tenant
export const listTenantWorkspacesRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces",
  request: {
    params: tenantParam,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(workspaceSchema),
        },
      },
      description: "List of workspaces for the tenant",
    },
  },
  tags: ["Tenant Workspaces"],
  summary: "List workspaces for a tenant",
  description: "Returns all workspaces belonging to a specific tenant",
});

// POST /{tenant}/workspaces - Create workspace for a tenant
export const createTenantWorkspaceRoute = createRoute({
  method: "post",
  path: "/{tenant}/workspaces",
  request: {
    params: tenantParam,
    body: {
      content: {
        "application/json": {
          schema: createWorkspaceSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: workspaceSchema,
        },
      },
      description: "Workspace created successfully",
    },
  },
  tags: ["Tenant Workspaces"],
  summary: "Create a workspace for a tenant",
  description: "Creates a new workspace for the specified tenant",
});

// GET /{tenant}/workspaces/{workspaceId} - Get specific workspace
export const getTenantWorkspaceRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces/{workspaceId}",
  request: {
    params: tenantWorkspaceParams,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: workspaceSchema,
        },
      },
      description: "Workspace details",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Workspace not found for this tenant",
    },
  },
  tags: ["Tenant Workspaces"],
  summary: "Get a specific workspace for a tenant",
  description: "Returns a single workspace that belongs to the specified tenant",
});

// ============================================
// Deep Nested Routes: /{tenant}/workspaces/{workspaceId}/sites
// ============================================

// GET /{tenant}/workspaces/{workspaceId}/sites - List sites for a tenant's workspace
export const listTenantWorkspaceSitesRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces/{workspaceId}/sites",
  request: {
    params: tenantWorkspaceParams,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(siteSchema),
        },
      },
      description: "List of sites for the workspace",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Tenant or workspace not found",
    },
  },
  tags: ["Tenant Workspace Sites"],
  summary: "List sites for a tenant's workspace",
  description: "Returns all sites belonging to a specific workspace under a tenant",
});

// POST /{tenant}/workspaces/{workspaceId}/sites - Create site under tenant's workspace
export const createTenantWorkspaceSiteRoute = createRoute({
  method: "post",
  path: "/{tenant}/workspaces/{workspaceId}/sites",
  request: {
    params: tenantWorkspaceParams,
    body: {
      content: {
        "application/json": {
          schema: createSiteSchema.omit({ workspaceId: true }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: siteSchema,
        },
      },
      description: "Site created successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Tenant or workspace not found",
    },
  },
  tags: ["Tenant Workspace Sites"],
  summary: "Create a site for a tenant's workspace",
  description: "Creates a new site under the specified workspace and tenant",
});

// GET /{tenant}/workspaces/{workspaceId}/sites/{siteId} - Get specific site
export const getTenantWorkspaceSiteRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces/{workspaceId}/sites/{siteId}",
  request: {
    params: tenantWorkspaceSiteParams,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: siteSchema,
        },
      },
      description: "Site details",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Tenant, workspace, or site not found",
    },
  },
  tags: ["Tenant Workspace Sites"],
  summary: "Get a specific site from a tenant's workspace",
  description: "Returns a single site that belongs to the specified workspace and tenant",
});

// ============================================
// Tenant-based Handlers
// ============================================

export const listTenantWorkspacesHandler: RouteHandler<typeof listTenantWorkspacesRoute> = async (c) => {
  const { tenant } = c.req.valid("param");

  const workspaces = await db
    .selectFrom("Workspace")
    .selectAll()
    .where("tenant", "=", tenant)
    .execute();

  return c.json(workspaces);
};

export const createTenantWorkspaceHandler: RouteHandler<typeof createTenantWorkspaceRoute> = async (c) => {
  const { tenant } = c.req.valid("param");
  const data = c.req.valid("json");

  const workspace = await db
    .insertInto("Workspace")
    .values({
      ...data,
      tenant,
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json(workspace, 201);
};

export const getTenantWorkspaceHandler: RouteHandler<typeof getTenantWorkspaceRoute> = async (c) => {
  const { tenant, workspaceId } = c.req.valid("param");

  const workspace = await db
    .selectFrom("Workspace")
    .selectAll()
    .where("id", "=", workspaceId)
    .where("tenant", "=", tenant)
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found for this tenant" }, 404);
  }

  return c.json(workspace);
};

// ============================================
// Deep Nested Handlers
// ============================================

export const listTenantWorkspaceSitesHandler: RouteHandler<typeof listTenantWorkspaceSitesRoute> = async (c) => {
  const { tenant, workspaceId } = c.req.valid("param");

  // Verify workspace exists and belongs to tenant
  const workspace = await db
    .selectFrom("Workspace")
    .select("id")
    .where("id", "=", workspaceId)
    .where("tenant", "=", tenant)
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found for this tenant" }, 404);
  }

  // Get sites for this workspace
  const sites = await db
    .selectFrom("Site")
    .selectAll()
    .where("workspaceId", "=", workspaceId)
    .where("tenant", "=", tenant)
    .execute();

  return c.json(sites);
};

export const createTenantWorkspaceSiteHandler: RouteHandler<typeof createTenantWorkspaceSiteRoute> = async (c) => {
  const { tenant, workspaceId } = c.req.valid("param");
  const data = c.req.valid("json");

  // Verify workspace exists and belongs to tenant
  const workspace = await db
    .selectFrom("Workspace")
    .select("id")
    .where("id", "=", workspaceId)
    .where("tenant", "=", tenant)
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found for this tenant" }, 404);
  }

  // Create site with workspace and tenant relationship
  const site = await db
    .insertInto("Site")
    .values({
      ...data,
      workspaceId,
      tenant,
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json(site, 201);
};

export const getTenantWorkspaceSiteHandler: RouteHandler<typeof getTenantWorkspaceSiteRoute> = async (c) => {
  const { tenant, workspaceId, siteId } = c.req.valid("param");

  // Get site with workspace and tenant verification in one query
  const site = await db
    .selectFrom("Site")
    .selectAll()
    .where("id", "=", siteId)
    .where("workspaceId", "=", workspaceId)
    .where("tenant", "=", tenant)
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found for this tenant and workspace" }, 404);
  }

  return c.json(site);
};
