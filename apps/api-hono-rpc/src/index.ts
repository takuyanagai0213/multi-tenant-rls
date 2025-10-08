import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { workspaceApp } from "./routes/workspace";
import { siteApp } from "./routes/site";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Mount RPC routes
const routes = app
  .route("/workspaces", workspaceApp)
  .route("/sites", siteApp);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT) || 4000;
console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Export type for client
export type AppType = typeof routes;
