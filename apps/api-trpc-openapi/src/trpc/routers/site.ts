import { z } from "zod";
import { createTRPCRouter } from "@/trpc/init";
import { rlsProtectedProcedure } from "@/trpc/middleware";

const siteSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  tenant: z.string(),
  workspaceId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const siteRouter = createTRPCRouter({
  list: rlsProtectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/workspaces/{workspaceSlug}/sites",
        tags: ["sites"],
        summary: "List sites by workspace slug",
      },
    })
    .input(
      z.object({
        workspaceSlug: z.string().min(1),
      }),
    )
    .output(z.array(siteSchema))
    .query(async ({ ctx: { db }, input: { workspaceSlug } }) => {
      return await db
        .selectFrom("Site")
        .innerJoin("Workspace", "Site.workspaceId", "Workspace.id")
        .selectAll("Site")
        .where("Workspace.slug", "=", workspaceSlug)
        .execute();
    }),

  create: rlsProtectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/sites",
        tags: ["sites"],
        summary: "Create a new site",
      },
    })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        workspaceId: z.number().int().positive(),
      }),
    )
    .output(siteSchema)
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
    .meta({
      openapi: {
        method: "PATCH",
        path: "/sites/{id}",
        tags: ["sites"],
        summary: "Update a site",
      },
    })
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .output(siteSchema)
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
    .meta({
      openapi: {
        method: "DELETE",
        path: "/sites/{id}",
        tags: ["sites"],
        summary: "Delete a site",
      },
    })
    .input(z.object({ id: z.number().int().positive() }))
    .output(siteSchema)
    .mutation(async ({ ctx: { db }, input }) => {
      return await db
        .deleteFrom("Site")
        .where("id", "=", input.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }),
});
