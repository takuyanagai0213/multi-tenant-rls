import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router";
import { createContext, createContextFromPath } from "./trpc/context";

export const app = express();

app.use(cors());
app.use(express.json());

// Original implementation: tenant from x-tenant header
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// New implementation: tenant from path parameter
app.use(
  "/:tenant/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createContextFromPath,
  }),
);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
