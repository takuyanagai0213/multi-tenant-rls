import { z } from "zod";
import { createTRPCRouter } from "@/trpc/init";
import { rlsProtectedProcedure } from "@/trpc/middleware";

const workspaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tenant: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const workspaceRouter = createTRPCRouter({
  list: rlsProtectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/workspaces",
        tags: ["workspaces"],
        summary: "List all workspaces",
      },
    })
    .input(z.void())
    .output(z.array(workspaceSchema))
    .query(async ({ ctx: { db } }) => {
      return await db.selectFrom("Workspace").selectAll().execute();
    }),

  create: rlsProtectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/workspaces",
        tags: ["workspaces"],
        summary: "Create a new workspace",
      },
    })
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      }),
    )
    .output(workspaceSchema)
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
    .meta({
      openapi: {
        method: "PATCH",
        path: "/workspaces/{id}",
        tags: ["workspaces"],
        summary: "Update a workspace",
      },
    })
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
      }),
    )
    .output(workspaceSchema)
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
    .meta({
      openapi: {
        method: "DELETE",
        path: "/workspaces/{id}",
        tags: ["workspaces"],
        summary: "Delete a workspace",
      },
    })
    .input(z.object({ id: z.number().int().positive() }))
    .output(workspaceSchema)
    .mutation(async ({ ctx: { db }, input: { id } }) => {
      return await db
        .deleteFrom("Workspace")
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }),
});
