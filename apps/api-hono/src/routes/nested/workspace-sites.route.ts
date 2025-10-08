import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { db } from "@repo/kysely-prisma-database";
import { errorSchema } from "../../schemas/common.schema";
import { siteSchema, createSiteSchema } from "../../schemas/site.schema";
import { z } from "zod";

// Schema for nested route parameters
const nestedSiteParams = z.object({
  workspaceId: z.string().regex(/^\d+$/).transform(Number),
  siteId: z.string().regex(/^\d+$/).transform(Number),
});

const workspaceIdParam = z.object({
  workspaceId: z.string().regex(/^\d+$/).transform(Number),
});

// ============================================
// Nested Routes: /workspaces/{workspaceId}/sites
// ============================================

// GET /workspaces/{workspaceId}/sites - List sites for a workspace
export const listWorkspaceSitesRoute = createRoute({
  method: "get",
  path: "/workspaces/{workspaceId}/sites",
  request: {
    params: workspaceIdParam,
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
      description: "Workspace not found",
    },
  },
  tags: ["Workspace Sites"],
  summary: "List sites for a workspace",
  description: "Returns all sites belonging to a specific workspace",
});

// POST /workspaces/{workspaceId}/sites - Create site under a workspace
export const createWorkspaceSiteRoute = createRoute({
  method: "post",
  path: "/workspaces/{workspaceId}/sites",
  request: {
    params: workspaceIdParam,
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
      description: "Workspace not found",
    },
  },
  tags: ["Workspace Sites"],
  summary: "Create a site for a workspace",
  description: "Creates a new site under the specified workspace",
});

// GET /workspaces/{workspaceId}/sites/{siteId} - Get specific site
export const getWorkspaceSiteRoute = createRoute({
  method: "get",
  path: "/workspaces/{workspaceId}/sites/{siteId}",
  request: {
    params: nestedSiteParams,
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
      description: "Workspace or site not found",
    },
  },
  tags: ["Workspace Sites"],
  summary: "Get a specific site from a workspace",
  description: "Returns a single site that belongs to the specified workspace",
});

// PUT /workspaces/{workspaceId}/sites/{siteId} - Update specific site
export const updateWorkspaceSiteRoute = createRoute({
  method: "put",
  path: "/workspaces/{workspaceId}/sites/{siteId}",
  request: {
    params: nestedSiteParams,
    body: {
      content: {
        "application/json": {
          schema: createSiteSchema.omit({ workspaceId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: siteSchema,
        },
      },
      description: "Site updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Workspace or site not found",
    },
  },
  tags: ["Workspace Sites"],
  summary: "Update a site in a workspace",
  description: "Updates a site that belongs to the specified workspace",
});

// DELETE /workspaces/{workspaceId}/sites/{siteId} - Delete specific site
export const deleteWorkspaceSiteRoute = createRoute({
  method: "delete",
  path: "/workspaces/{workspaceId}/sites/{siteId}",
  request: {
    params: nestedSiteParams,
  },
  responses: {
    204: {
      description: "Site deleted successfully (No Content)",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Workspace or site not found",
    },
  },
  tags: ["Workspace Sites"],
  summary: "Delete a site from a workspace",
  description: "Deletes a site that belongs to the specified workspace",
});

// ============================================
// Handlers
// ============================================

export const listWorkspaceSitesHandler: RouteHandler<typeof listWorkspaceSitesRoute> = async (c) => {
  const { workspaceId } = c.req.valid("param");

  // Verify workspace exists
  const workspace = await db
    .selectFrom("Workspace")
    .select("id")
    .where("id", "=", workspaceId)
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  // Get sites for this workspace
  const sites = await db
    .selectFrom("Site")
    .selectAll()
    .where("workspaceId", "=", workspaceId)
    .execute();

  return c.json(sites);
};

export const createWorkspaceSiteHandler: RouteHandler<typeof createWorkspaceSiteRoute> = async (c) => {
  const { workspaceId } = c.req.valid("param");
  const data = c.req.valid("json");

  // Verify workspace exists
  const workspace = await db
    .selectFrom("Workspace")
    .select(["id", "tenant"])
    .where("id", "=", workspaceId)
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  // Create site with workspace relationship
  const site = await db
    .insertInto("Site")
    .values({
      ...data,
      workspaceId,
      tenant: workspace.tenant,
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json(site, 201);
};

export const getWorkspaceSiteHandler: RouteHandler<typeof getWorkspaceSiteRoute> = async (c) => {
  const { workspaceId, siteId } = c.req.valid("param");

  // Get site with workspace verification in one query
  const site = await db
    .selectFrom("Site")
    .selectAll()
    .where("id", "=", siteId)
    .where("workspaceId", "=", workspaceId)
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found in this workspace" }, 404);
  }

  return c.json(site);
};

export const updateWorkspaceSiteHandler: RouteHandler<typeof updateWorkspaceSiteRoute> = async (c) => {
  const { workspaceId, siteId } = c.req.valid("param");
  const data = c.req.valid("json");

  // Update with workspace verification
  const site = await db
    .updateTable("Site")
    .set({ ...data, updatedAt: new Date() })
    .where("id", "=", siteId)
    .where("workspaceId", "=", workspaceId)
    .returningAll()
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found in this workspace" }, 404);
  }

  return c.json(site);
};

export const deleteWorkspaceSiteHandler: RouteHandler<typeof deleteWorkspaceSiteRoute> = async (c) => {
  const { workspaceId, siteId } = c.req.valid("param");

  // Delete with workspace verification
  const site = await db
    .deleteFrom("Site")
    .where("id", "=", siteId)
    .where("workspaceId", "=", workspaceId)
    .returningAll()
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found in this workspace" }, 404);
  }

  // Return 204 No Content for successful deletion
  return c.body(null, 204);
};
