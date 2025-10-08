import { z } from "zod";
import { createTRPCRouter } from "@/trpc/init";
import { rlsProtectedProcedure } from "@/trpc/middleware";

export const siteRouter = createTRPCRouter({
  list: rlsProtectedProcedure
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
      }),
    )
    .query(async ({ ctx: { db }, input: { workspaceSlug } }) => {
      return await db
        .selectFrom("Site")
        .innerJoin("Workspace", "Site.workspaceId", "Workspace.id")
        .selectAll("Site")
        .where("Workspace.slug", "=", workspaceSlug)
        .execute();
    }),

  create: rlsProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        workspaceId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx: { tenant, db }, input }) => {
      return await db
        .insertInto("Site")
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
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { id, ...updateData } = input;
      return await db
        .updateTable("Site")
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
    .mutation(async ({ ctx: { db }, input }) => {
      return await db
        .deleteFrom("Site")
        .where("id", "=", input.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }),
});
