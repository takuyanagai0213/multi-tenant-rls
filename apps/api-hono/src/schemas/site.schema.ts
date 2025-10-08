import { z } from "zod";
import { tenantEnum } from "./common.schema";

// Site schema
export const siteSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  workspaceId: z.number().int(),
  tenant: tenantEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Site input schema
export const createSiteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  workspaceId: z.number().int().positive(),
});

// Site path parameter schemas
export const siteIdParam = z.object({
  id: z.string().regex(/^\d+$/),
});

export const sitePathParam = z.object({
  tenant: tenantEnum,
});

export const sitePathIdParam = z.object({
  tenant: tenantEnum,
  id: z.string().regex(/^\d+$/),
});
