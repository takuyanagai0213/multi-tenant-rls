import { z } from "zod";
import { createTRPCRouter } from "../init";
import { rlsProtectedProcedure } from "../middleware";

export const siteRouter = createTRPCRouter({
  list: rlsProtectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.selectFrom("Site").selectAll().execute();
  }),

  create: rlsProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        workspaceId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .insertInto("Site")
        .values({
          ...input,
          tenant: ctx.tenant,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }),
});
