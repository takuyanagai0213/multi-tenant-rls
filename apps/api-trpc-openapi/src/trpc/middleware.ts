import { sql } from "@repo/kysely-prisma-database";
import { middleware, procedure } from "./init";

export const rlsMiddleware = middleware(async ({ ctx, next }) => {
  // Set RLS session variable
  await sql`SET LOCAL app.current_tenant = ${ctx.tenant}`.execute(ctx.db);

  return next({ ctx });
});

export const rlsProtectedProcedure = procedure.use(rlsMiddleware);
