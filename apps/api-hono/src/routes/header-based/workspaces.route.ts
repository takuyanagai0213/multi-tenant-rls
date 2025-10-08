import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { tenantHeader, errorSchema, successSchema } from "../../schemas/common.schema";
import {
  workspaceSchema,
  createWorkspaceSchema,
  workspaceIdParam,
} from "../../schemas/workspace.schema";
import { db } from "@repo/kysely-prisma-database";
import { z } from "zod";

// ============================================
// Header-based Routes: /workspaces (tenant from header)
// ============================================

// List workspaces
export const listWorkspacesRoute = createRoute({
  method: "get",
  path: "/workspaces",
  request: {
    headers: tenantHeader,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(workspaceSchema),
        },
      },
      description: "List of workspaces",
    },
  },
  tags: ["Workspaces (Header)"],
  summary: "List all workspaces",
  description: "Returns a list of all workspaces for the authenticated tenant (from header)",
});

// Create workspace
export const createWorkspaceRoute = createRoute({
  method: "post",
  path: "/workspaces",
  request: {
    headers: tenantHeader,
    body: {
      content: {
        "application/json": {
          schema: createWorkspaceSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: workspaceSchema,
        },
      },
      description: "Created workspace",
    },
  },
  tags: ["Workspaces (Header)"],
  summary: "Create a new workspace",
  description: "Creates a new workspace for the authenticated tenant (from header)",
});

// Get workspace by ID
export const getWorkspaceRoute = createRoute({
  method: "get",
  path: "/workspaces/{id}",
  request: {
    headers: tenantHeader,
    params: workspaceIdParam,
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
      description: "Workspace not found",
    },
  },
  tags: ["Workspaces (Header)"],
  summary: "Get workspace by ID",
  description: "Returns a single workspace by ID (tenant from header)",
});

// Update workspace
export const updateWorkspaceRoute = createRoute({
  method: "put",
  path: "/workspaces/{id}",
  request: {
    headers: tenantHeader,
    params: workspaceIdParam,
    body: {
      content: {
        "application/json": {
          schema: createWorkspaceSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: workspaceSchema,
        },
      },
      description: "Updated workspace",
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
  tags: ["Workspaces (Header)"],
  summary: "Update workspace",
  description: "Updates an existing workspace (tenant from header)",
});

// Delete workspace
export const deleteWorkspaceRoute = createRoute({
  method: "delete",
  path: "/workspaces/{id}",
  request: {
    headers: tenantHeader,
    params: workspaceIdParam,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successSchema,
        },
      },
      description: "Workspace deleted successfully",
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
  tags: ["Workspaces (Header)"],
  summary: "Delete workspace",
  description: "Deletes a workspace by ID (tenant from header)",
});

// ============================================
// Handlers
// ============================================

export const listWorkspacesHandler: RouteHandler<typeof listWorkspacesRoute> = async (c) => {
  const workspaces = await db.selectFrom("Workspace").selectAll().execute();
  return c.json(workspaces);
};

export const createWorkspaceHandler: RouteHandler<typeof createWorkspaceRoute> = async (c) => {
  const data = c.req.valid("json");

  const workspace = await db
    .insertInto("Workspace")
    .values({
      ...data,
      tenant: c.get("tenant"),
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json(workspace);
};

export const getWorkspaceHandler: RouteHandler<typeof getWorkspaceRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const workspace = await db
    .selectFrom("Workspace")
    .selectAll()
    .where("id", "=", Number(id))
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json(workspace, 200);
};

export const updateWorkspaceHandler: RouteHandler<typeof updateWorkspaceRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  const workspace = await db
    .updateTable("Workspace")
    .set({ ...data, updatedAt: new Date() })
    .where("id", "=", Number(id))
    .returningAll()
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json(workspace, 200);
};

export const deleteWorkspaceHandler: RouteHandler<typeof deleteWorkspaceRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const workspace = await db
    .deleteFrom("Workspace")
    .where("id", "=", Number(id))
    .returningAll()
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json({ success: true }, 200);
};
