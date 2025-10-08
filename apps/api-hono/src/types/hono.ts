import type { Tenant } from "@repo/kysely-prisma-database";

// Extend Hono's context variables type
declare module "hono" {
  interface ContextVariableMap {
    tenant: Tenant;
  }
}

// Extend Hono's validator types for c.req.valid()
declare module "@hono/zod-validator" {
  interface ValidationTargets {
    in: {
      header: {
        "x-tenant": Tenant;
      };
      param: {
        tenant: Tenant;
      };
    };
    out: {
      header: {
        "x-tenant": Tenant;
      };
      param: {
        tenant: Tenant;
      };
    };
  }
}
