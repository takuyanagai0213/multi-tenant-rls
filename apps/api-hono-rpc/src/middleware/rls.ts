import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Tenant } from "@repo/kysely-prisma-database";
import { sql } from "kysely";
import { db } from "@repo/kysely-prisma-database";

export const rlsMiddleware = createMiddleware(async (c, next) => {
  const tenant = c.req.header("x-tenant") as Tenant | undefined;

  if (!tenant) {
    throw new HTTPException(401, {
      message: "Missing x-tenant header",
    });
  }

  // Set RLS session variable
  await sql`SET LOCAL app.current_tenant = ${tenant}`.execute(db);

  // Store in context
  c.set("tenant", tenant);

  await next();
});

// Extend Hono's context variables type
declare module "hono" {
  interface ContextVariableMap {
    tenant: Tenant;
  }
}
