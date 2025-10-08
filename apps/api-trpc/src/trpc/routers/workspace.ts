import { z } from "zod";
import { createTRPCRouter } from "@/trpc/init";
import { rlsProtectedProcedure } from "@/trpc/middleware";

export const workspaceRouter = createTRPCRouter({
  list: rlsProtectedProcedure.query(async ({ ctx: { db } }) => {
    return await db.selectFrom("Workspace").selectAll().execute();
  }),

  create: rlsProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx: { tenant, db }, input }) => {
      return await db
        .insertInto("Workspace")
        .values({
          ...input,
          tenant,
          updatedAt: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }),

  update: rlsProtectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { id, ...updateData } = input;
      return await db
        .updateTable("Workspace")
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }),

  delete: rlsProtectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db
        .deleteFrom("Workspace")
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }),
});
