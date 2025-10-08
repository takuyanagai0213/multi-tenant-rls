import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/kysely-prisma-database";
import { z } from "zod";
import { tenantEnum, tenantHeader } from "../schemas/common.schema";
import type { Tenant } from "@repo/kysely-prisma-database";
import { sql } from "kysely";

// Tenant path parameter schema
const tenantParamSchema = z.object({
  tenant: tenantEnum,
});

/**
 * RLS middleware for header-based routes
 */
const rlsHeaderMiddleware = createMiddleware(async (c, next) => {
  // Get the header directly - it's been validated by zValidator
  const tenant = c.req.header("x-tenant") as Tenant;

  // Set RLS session variable
  await sql`SET LOCAL app.current_tenant = ${tenant}`.execute(db);

  // Store in context for future use (logging, conditional logic, etc.)
  c.set("tenant", tenant);

  return await next();
});

/**
 * Combined RLS middleware for header-based routes
 *
 * Usage:
 * ```typescript
 * app.use("/workspaces/*", ...rlsMiddleware)
 * ```
 */
export const rlsMiddleware = [
  zValidator("header", tenantHeader),
  rlsHeaderMiddleware,
];

/**
 * RLS middleware for path parameter-based routes
 */
const rlsParamMiddleware = createMiddleware(async (c, next) => {
  // Get the param directly - it's been validated by zValidator
  const tenant = c.req.param("tenant") as Tenant;

  // Set RLS session variable
  await sql`SET LOCAL app.current_tenant = ${tenant}`.execute(db);

  // Store in context for future use (logging, conditional logic, etc.)
  c.set("tenant", tenant);

  return await next();
});

/**
 * Combined RLS middleware for path parameter-based routes
 *
 * Usage:
 * ```typescript
 * app.use("/:tenant/*", ...rlsPathParamMiddleware)
 * ```
 */
export const rlsPathParamMiddleware = [
  zValidator("param", tenantParamSchema),
  rlsParamMiddleware,
];
