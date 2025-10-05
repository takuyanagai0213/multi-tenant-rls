import "./types/hono"; // Import Hono context type extensions
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rlsMiddleware } from "./middleware/rls";
import { rlsPathParamMiddleware } from "./middleware/rls-path-param";
import { workspaceRoutes } from "./routes/workspace";
import { siteRoutes } from "./routes/site";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Original implementation: tenant from x-tenant header
app.use("/workspaces", ...rlsMiddleware);
app.use("/sites", ...rlsMiddleware);
app.route("/workspaces", workspaceRoutes);
app.route("/sites", siteRoutes);

// New implementation: tenant from path parameter
app.use("/:tenant/workspaces", ...rlsPathParamMiddleware);
app.use("/:tenant/sites", ...rlsPathParamMiddleware);
app.route("/:tenant/workspaces", workspaceRoutes);
app.route("/:tenant/sites", siteRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 4000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
