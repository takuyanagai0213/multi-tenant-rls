import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { errorSchema, successSchema } from "../../schemas/common.schema";
import {
  workspaceSchema,
  createWorkspaceSchema,
  workspacePathParam,
  workspacePathIdParam,
} from "../../schemas/workspace.schema";
import { db } from "@repo/kysely-prisma-database";
import { z } from "zod";

// ============================================
// Path-based Routes: /{tenant}/workspaces (tenant from path)
// ============================================

// List workspaces
export const listWorkspacesPathRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces",
  request: {
    params: workspacePathParam,
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
  tags: ["Workspaces (Path)"],
  summary: "List all workspaces (path parameter)",
  description: "Returns a list of all workspaces for the specified tenant (from path)",
});

// Create workspace
export const createWorkspacePathRoute = createRoute({
  method: "post",
  path: "/{tenant}/workspaces",
  request: {
    params: workspacePathParam,
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
  tags: ["Workspaces (Path)"],
  summary: "Create a new workspace (path parameter)",
  description: "Creates a new workspace for the specified tenant (from path)",
});

// Get workspace by ID
export const getWorkspacePathRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces/{id}",
  request: {
    params: workspacePathIdParam,
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
  tags: ["Workspaces (Path)"],
  summary: "Get workspace by ID (path parameter)",
  description: "Returns a single workspace by ID (tenant from path)",
});

// Update workspace
export const updateWorkspacePathRoute = createRoute({
  method: "put",
  path: "/{tenant}/workspaces/{id}",
  request: {
    params: workspacePathIdParam,
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
  tags: ["Workspaces (Path)"],
  summary: "Update workspace (path parameter)",
  description: "Updates an existing workspace (tenant from path)",
});

// Delete workspace
export const deleteWorkspacePathRoute = createRoute({
  method: "delete",
  path: "/{tenant}/workspaces/{id}",
  request: {
    params: workspacePathIdParam,
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
  tags: ["Workspaces (Path)"],
  summary: "Delete workspace (path parameter)",
  description: "Deletes a workspace by ID (tenant from path)",
});

// ============================================
// Handlers
// ============================================

export const listWorkspacesPathHandler: RouteHandler<typeof listWorkspacesPathRoute> = async (c) => {
  const { tenant } = c.req.valid("param");
  const workspaces = await db.selectFrom("Workspace").selectAll().where("tenant", "=", tenant).execute();
  return c.json(workspaces);
};

export const createWorkspacePathHandler: RouteHandler<typeof createWorkspacePathRoute> = async (c) => {
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

  return c.json(workspace);
};

export const getWorkspacePathHandler: RouteHandler<typeof getWorkspacePathRoute> = async (c) => {
  const { tenant, id } = c.req.valid("param");

  const workspace = await db
    .selectFrom("Workspace")
    .selectAll()
    .where("id", "=", Number(id))
    .where("tenant", "=", tenant)
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json(workspace, 200);
};

export const updateWorkspacePathHandler: RouteHandler<typeof updateWorkspacePathRoute> = async (c) => {
  const { tenant, id } = c.req.valid("param");
  const data = c.req.valid("json");

  const workspace = await db
    .updateTable("Workspace")
    .set({ ...data, updatedAt: new Date() })
    .where("id", "=", Number(id))
    .where("tenant", "=", tenant)
    .returningAll()
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json(workspace, 200);
};

export const deleteWorkspacePathHandler: RouteHandler<typeof deleteWorkspacePathRoute> = async (c) => {
  const { tenant, id } = c.req.valid("param");

  const workspace = await db
    .deleteFrom("Workspace")
    .where("id", "=", Number(id))
    .where("tenant", "=", tenant)
    .returningAll()
    .executeTakeFirst();

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json({ success: true }, 200);
};
