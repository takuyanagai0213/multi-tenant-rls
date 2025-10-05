import { z } from "zod";

// Request body schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const createSiteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  workspaceId: z.number().int().positive(),
});

// Tenant enum for validation
const tenantEnum = z.enum(
  ["ACME_CORP", "GLOBEX_INC", "WAYNE_ENTERPRISES", "STARK_INDUSTRIES"],
  {
    errorMap: () => ({
      message:
        "Must be one of: ACME_CORP, GLOBEX_INC, WAYNE_ENTERPRISES, STARK_INDUSTRIES",
    }),
  },
);

// Header schemas
export const tenantHeaderSchema = z.object({
  "x-tenant": tenantEnum,
});

// Path parameter schemas
export const tenantParamSchema = z.object({
  tenant: tenantEnum,
});
