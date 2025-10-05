import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/database";
import { createSiteSchema } from "../schemas/api";
import { getTenantFromSession } from "../lib/rls-helpers";

export const siteRoutes = new Hono()
  .get("/", async (c) => {
    const sites = await db.selectFrom("Site").selectAll().execute();
    return c.json(sites);
  })
  .post("/", zValidator("json", createSiteSchema), async (c) => {
    const data = c.req.valid("json");

    // Explicitly set tenant from RLS session variable
    // This makes it clear where the value comes from
    const site = await db
      .insertInto("Site")
      .values({
        ...data,
        tenant: getTenantFromSession(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return c.json(site);
  });
