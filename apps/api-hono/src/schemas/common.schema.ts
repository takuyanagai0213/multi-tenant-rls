import { z } from "zod";

// Common tenant enum
export const tenantEnum = z.enum([
  "ACME_CORP",
  "GLOBEX_INC",
  "WAYNE_ENTERPRISES",
  "STARK_INDUSTRIES",
]);

// Common response schemas
export const errorSchema = z.object({
  error: z.string(),
});

export const successSchema = z.object({
  success: z.boolean(),
});

// Common headers
export const tenantHeader = z.object({
  "x-tenant": tenantEnum,
});
