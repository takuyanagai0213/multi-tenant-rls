import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const createSiteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  workspaceId: z.number().int().positive(),
});

export const workspaceResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tenant: z.enum(["ACME_CORP", "GLOBEX_INC", "WAYNE_ENTERPRISES", "STARK_INDUSTRIES"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const siteResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  tenant: z.enum(["ACME_CORP", "GLOBEX_INC", "WAYNE_ENTERPRISES", "STARK_INDUSTRIES"]),
  workspaceId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
