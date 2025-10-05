import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { setRLSContext } from "../lib/rls-helpers";
import { tenantParamSchema } from "../schemas/api";
import type { Tenant } from "@repo/database";

/**
 * RLS setup middleware for path parameter-based routes
 */
const rlsPathSetupMiddleware = createMiddleware(async (c, next) => {
  // Get the param directly - it's been validated by zValidator
  const tenant = c.req.param("tenant") as Tenant;

  // Set RLS session variable
  await setRLSContext(tenant);

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
  rlsPathSetupMiddleware,
];
