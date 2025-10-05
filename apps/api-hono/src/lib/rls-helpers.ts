import { sql } from "kysely";
import { db } from "@repo/database";
import type { Tenant } from "@repo/database";

/**
 * Sets the RLS session variable for the current database transaction
 */
export async function setRLSContext(tenant: Tenant): Promise<void> {
  await sql`SET LOCAL app.current_tenant = ${tenant}`.execute(db);
}

/**
 * Returns a SQL expression that retrieves the tenant from the RLS session variable.
 * This makes it explicit in the code that the value comes from the session variable.
 *
 * Usage:
 * ```typescript
 * await db.insertInto("Workspace").values({
 *   ...data,
 *   tenant: getTenantFromSession(),
 * })
 * ```
 */
export function getTenantFromSession() {
  return sql<Tenant>`current_setting('app.current_tenant', true)::"Tenant"`;
}
