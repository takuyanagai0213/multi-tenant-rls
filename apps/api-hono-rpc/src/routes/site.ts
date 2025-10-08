import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/kysely-prisma-database";
import { rlsMiddleware } from "../middleware/rls";
import { createSiteSchema } from "../schemas/api";

const app = new Hono();

app.use("*", rlsMiddleware);

export const siteApp = app
  .get("/", async (c) => {
    const sites = await db
      .selectFrom("Site")
      .selectAll()
      .execute();

    return c.json(sites);
  })
  .post("/", zValidator("json", createSiteSchema), async (c) => {
    const data = c.req.valid("json");

    const site = await db
      .insertInto("Site")
      .values({
        ...data,
        tenant: c.get("tenant"),
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
