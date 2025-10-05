import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { prisma, db, Tenant } from "@repo/database";

// Read tenant from tenant header
export const createContext = async (opts: CreateExpressContextOptions) => {
  const tenant = opts.req.headers["tenant"] as Tenant | undefined;

  if (!tenant) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing tenant header",
    });
  }

  return {
    tenant,
    prisma,
    db,
  };
};

// Read tenant from path parameter
export const createContextFromPath = async (
  opts: CreateExpressContextOptions,
) => {
  // Express routing ensures this exists (route: /api/:tenant/trpc)
  const tenant = opts.req.params.tenant as Tenant;

  return {
    tenant,
    prisma,
    db,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
