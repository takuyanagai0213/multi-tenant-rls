import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import type { Context } from "./context";

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createTRPCRouter = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;
