import { z } from "zod";
import { createTRPCRouter } from "../init";
import { rlsProtectedProcedure } from "../middleware";

export const workspaceRouter = createTRPCRouter({
  list: rlsProtectedProcedure.query(async ({ ctx }) => {
    // RLS automatically filters by current tenant
    return await ctx.db.selectFrom("Workspace").selectAll().execute();
  }),

  create: rlsProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .insertInto("Workspace")
        .values({
          ...input,
          tenant: ctx.tenant,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }),
});
