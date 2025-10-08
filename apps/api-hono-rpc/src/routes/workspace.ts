import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/kysely-prisma-database";
import { rlsMiddleware } from "../middleware/rls";
import { createWorkspaceSchema } from "../schemas/api";

const app = new Hono();

// Apply RLS middleware to all routes
app.use("*", rlsMiddleware);

// List workspaces
export const workspaceApp = app
  .get("/", async (c) => {
    const workspaces = await db
    .selectFrom("Workspace")
    .selectAll()
    .execute();

    return c.json(workspaces);
  })
  // Create workspace
  .post("/", zValidator("json", createWorkspaceSchema), async (c) => {
    const data = c.req.valid("json");

    const workspace = await db
      .insertInto("Workspace")
      .values({
        ...data,
        tenant: c.get("tenant"),
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
