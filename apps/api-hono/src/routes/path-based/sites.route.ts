import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { db } from "@repo/kysely-prisma-database";
import { errorSchema, successSchema } from "../../schemas/common.schema";
import {
  siteSchema,
  createSiteSchema,
  sitePathParam,
  sitePathIdParam,
} from "../../schemas/site.schema";
import { z } from "zod";

// ============================================
// Path-based Routes: /{tenant}/sites (tenant from path)
// ============================================

// List sites
export const listSitesPathRoute = createRoute({
  method: "get",
  path: "/{tenant}/sites",
  request: {
    params: sitePathParam,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(siteSchema),
        },
      },
      description: "List of sites",
    },
  },
  tags: ["Sites (Path)"],
  summary: "List all sites (path parameter)",
  description: "Returns a list of all sites for the specified tenant (from path)",
});

// Create site
export const createSitePathRoute = createRoute({
  method: "post",
  path: "/{tenant}/sites",
  request: {
    params: sitePathParam,
    body: {
      content: {
        "application/json": {
          schema: createSiteSchema,
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
      description: "Created site",
    },
  },
  tags: ["Sites (Path)"],
  summary: "Create a new site (path parameter)",
  description: "Creates a new site for the specified tenant (from path)",
});

// Get site by ID
export const getSitePathRoute = createRoute({
  method: "get",
  path: "/{tenant}/sites/{id}",
  request: {
    params: sitePathIdParam,
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
      description: "Site not found",
    },
  },
  tags: ["Sites (Path)"],
  summary: "Get site by ID (path parameter)",
  description: "Returns a single site by ID (tenant from path)",
});

// Update site
export const updateSitePathRoute = createRoute({
  method: "put",
  path: "/{tenant}/sites/{id}",
  request: {
    params: sitePathIdParam,
    body: {
      content: {
        "application/json": {
          schema: createSiteSchema,
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
      description: "Updated site",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Site not found",
    },
  },
  tags: ["Sites (Path)"],
  summary: "Update site (path parameter)",
  description: "Updates an existing site (tenant from path)",
});

// Delete site
export const deleteSitePathRoute = createRoute({
  method: "delete",
  path: "/{tenant}/sites/{id}",
  request: {
    params: sitePathIdParam,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successSchema,
        },
      },
      description: "Site deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
      description: "Site not found",
    },
  },
  tags: ["Sites (Path)"],
  summary: "Delete site (path parameter)",
  description: "Deletes a site by ID (tenant from path)",
});

// ============================================
// Handlers
// ============================================

export const listSitesPathHandler: RouteHandler<typeof listSitesPathRoute> = async (c) => {
  const { tenant } = c.req.valid("param");
  const sites = await db.selectFrom("Site").selectAll().where("tenant", "=", tenant).execute();
  return c.json(sites);
};

export const createSitePathHandler: RouteHandler<typeof createSitePathRoute> = async (c) => {
  const { tenant } = c.req.valid("param");
  const data = c.req.valid("json");

  const site = await db
    .insertInto("Site")
    .values({
      ...data,
      tenant,
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json(site);
};

export const getSitePathHandler: RouteHandler<typeof getSitePathRoute> = async (c) => {
  const { tenant, id } = c.req.valid("param");

  const site = await db
    .selectFrom("Site")
    .selectAll()
    .where("id", "=", Number(id))
    .where("tenant", "=", tenant)
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json(site, 200);
};

export const updateSitePathHandler: RouteHandler<typeof updateSitePathRoute> = async (c) => {
  const { tenant, id } = c.req.valid("param");
  const data = c.req.valid("json");

  const site = await db
    .updateTable("Site")
    .set({ ...data, updatedAt: new Date() })
    .where("id", "=", Number(id))
    .where("tenant", "=", tenant)
    .returningAll()
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json(site, 200);
};

export const deleteSitePathHandler: RouteHandler<typeof deleteSitePathRoute> = async (c) => {
  const { tenant, id } = c.req.valid("param");

  const site = await db
    .deleteFrom("Site")
    .where("id", "=", Number(id))
    .where("tenant", "=", tenant)
    .returningAll()
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json({ success: true }, 200);
};
