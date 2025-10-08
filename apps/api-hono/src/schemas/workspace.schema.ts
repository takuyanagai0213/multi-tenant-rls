import { z } from "zod";
import { tenantEnum } from "./common.schema";

// Workspace schema
export const workspaceSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  tenant: tenantEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Workspace input schema
export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

// Workspace path parameter schemas
export const workspaceIdParam = z.object({
  id: z.string().regex(/^\d+$/),
});

export const workspacePathParam = z.object({
  tenant: tenantEnum,
});

export const workspacePathIdParam = z.object({
  tenant: tenantEnum,
  id: z.string().regex(/^\d+$/),
});
