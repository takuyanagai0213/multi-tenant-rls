import { createTRPCRouter } from "./init";
import { workspaceRouter } from "./routers/workspace";
import { siteRouter } from "./routers/site";

export const appRouter = createTRPCRouter({
  workspace: workspaceRouter,
  site: siteRouter,
});

export type AppRouter = typeof appRouter;
