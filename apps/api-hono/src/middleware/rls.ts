import { createMiddleware } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { setRLSContext } from "../lib/rls-helpers";
import { tenantHeaderSchema } from "../schemas/api";
import type { Tenant } from "@repo/database";

/**
 * RLS middleware with header validation
 * First validates the x-tenant header with zValidator,
 * then sets up RLS context
 */
const rlsSetupMiddleware = createMiddleware(async (c, next) => {
  // Get the header directly - it's been validated by zValidator
  const tenant = c.req.header("x-tenant") as Tenant;

  // Set RLS session variable
  await setRLSContext(tenant);

  // Store in context for future use (logging, conditional logic, etc.)
  c.set("tenant", tenant);

  return await next();
});

/**
 * Combined RLS middleware: validation + setup
 * Use this as a single middleware in your routes
 */
export const rlsMiddleware = [
  zValidator("header", tenantHeaderSchema),
  rlsSetupMiddleware,
];
