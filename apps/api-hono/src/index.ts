import "./types/hono"; // Import Hono context type extensions
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rlsMiddleware, rlsPathParamMiddleware } from "./middleware/rls";
import { apiRoutes } from "./routes";

const app = new OpenAPIHono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Apply RLS middleware to API routes (header-based)
app.use("/(workspaces|sites)/*", ...rlsMiddleware);

// Apply RLS middleware to API routes (path parameter-based)
app.use("/*", ...rlsPathParamMiddleware);

// Mount OpenAPI routes
app.route("/", apiRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// OpenAPI documentation
app.doc31("/openapi.json", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Multi-Tenant RLS API",
    description: "API with Row-Level Security using PostgreSQL",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Development server",
    },
  ],
});

const port = Number(process.env.PORT) || 4000;

console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
