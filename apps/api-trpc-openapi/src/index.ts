import express from "express";
import cors from "cors";
import { createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";
import { openApiDocument } from "./openapi";

export const app = express();

app.use(cors());
app.use(express.json());

// OpenAPI REST routes
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Serve OpenAPI spec as JSON
app.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});

// Scalar API documentation UI
app.use(
  "/docs",
  apiReference({
    spec: {
      content: openApiDocument,
    },
  }),
);

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`🚀 API server (OpenAPI) running on http://localhost:${PORT}`);
  console.log(`📚 API documentation at http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI spec at http://localhost:${PORT}/openapi.json`);
  console.log(`🔌 REST API at http://localhost:${PORT}/api`);
});
