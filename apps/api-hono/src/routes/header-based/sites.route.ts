import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { db } from "@repo/kysely-prisma-database";
import { tenantHeader, errorSchema, successSchema } from "../../schemas/common.schema";
import {
  siteSchema,
  createSiteSchema,
  siteIdParam,
} from "../../schemas/site.schema";
import { z } from "zod";

// ============================================
// Header-based Routes: /sites (tenant from header)
// ============================================

// List sites
export const listSitesRoute = createRoute({
  method: "get",
  path: "/sites",
  request: {
    headers: tenantHeader,
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
  tags: ["Sites (Header)"],
  summary: "List all sites",
  description: "Returns a list of all sites for the authenticated tenant (from header)",
});

// Create site
export const createSiteRoute = createRoute({
  method: "post",
  path: "/sites",
  request: {
    headers: tenantHeader,
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
  tags: ["Sites"],
  summary: "Create a new site",
  description: "Creates a new site for the authenticated tenant",
});

// Get site by ID
export const getSiteRoute = createRoute({
  method: "get",
  path: "/sites/{id}",
  request: {
    headers: tenantHeader,
    params: siteIdParam,
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
  tags: ["Sites"],
  summary: "Get site by ID",
  description: "Returns a single site by ID",
});

// Update site
export const updateSiteRoute = createRoute({
  method: "put",
  path: "/sites/{id}",
  request: {
    headers: tenantHeader,
    params: siteIdParam,
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
  tags: ["Sites"],
  summary: "Update site",
  description: "Updates an existing site",
});

// Delete site
export const deleteSiteRoute = createRoute({
  method: "delete",
  path: "/sites/{id}",
  request: {
    headers: tenantHeader,
    params: siteIdParam,
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
  tags: ["Sites"],
  summary: "Delete site",
  description: "Deletes a site by ID",
});

// Handlers
export const listSitesHandler: RouteHandler<typeof listSitesRoute> = async (c) => {
  const sites = await db.selectFrom("Site").selectAll().execute();
  return c.json(sites);
};

export const createSiteHandler: RouteHandler<typeof createSiteRoute> = async (c) => {
  const data = c.req.valid("json");

  const site = await db
    .insertInto("Site")
    .values({
      ...data,
      tenant: c.get("tenant"),
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return c.json(site);
};

export const getSiteHandler: RouteHandler<typeof getSiteRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const site = await db
    .selectFrom("Site")
    .selectAll()
    .where("id", "=", Number(id))
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json(site, 200);
};

export const updateSiteHandler: RouteHandler<typeof updateSiteRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  const site = await db
    .updateTable("Site")
    .set({ ...data, updatedAt: new Date() })
    .where("id", "=", Number(id))
    .returningAll()
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json(site, 200);
};

export const deleteSiteHandler: RouteHandler<typeof deleteSiteRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const site = await db
    .deleteFrom("Site")
    .where("id", "=", Number(id))
    .returningAll()
    .executeTakeFirst();

  if (!site) {
    return c.json({ error: "Site not found" }, 404);
  }

  return c.json({ success: true }, 200);
};
