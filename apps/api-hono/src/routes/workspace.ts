import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/database";
import { createWorkspaceSchema } from "../schemas/api";
import { getTenantFromSession } from "../lib/rls-helpers";

export const workspaceRoutes = new Hono()
  .get("/", async (c) => {
    const workspaces = await db.selectFrom("Workspace").selectAll().execute();
    return c.json(workspaces);
  })
  .post("/", zValidator("json", createWorkspaceSchema), async (c) => {
    const data = c.req.valid("json");
    const tenant = c.get("tenant");

    const workspace = await db
      .insertInto("Workspace")
      .values({
        ...data,
        tenant,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return c.json(workspace);
  })
  // Pattern 2: Path parameter-based (new implementation)
  .get("/:tenant", async (c) => {
    const tenant = c.req.param("tenant");

    // Validate and set RLS context
    const error = await validateAndSetRLSContext(tenant);
    if (error) {
      return c.json(error, 400);
    }

    // Query with RLS filtering
    const workspaces = await db.selectFrom("Workspace").selectAll().execute();

    return c.json(workspaces);
  })
  .post("/:tenant", zValidator("json", createWorkspaceSchema), async (c) => {
    const tenant = c.req.param("tenant");

    // Validate and set RLS context
    const error = await validateAndSetRLSContext(tenant);
    if (error) {
      return c.json(error, 400);
    }

    const data = c.req.valid("json");

    // Explicitly set tenant from RLS session variable
    // This makes it clear where the value comes from
    const workspace = await db
      .insertInto("Workspace")
      .values({
        ...data,
        tenant: getTenantFromSession(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return c.json(workspace);
  });
