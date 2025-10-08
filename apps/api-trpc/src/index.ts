import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router";
import { createContext, createContextFromPath } from "./trpc/context";

export const app = express();

app.use(cors());
app.use(express.json());

// tRPC with tenant from header
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// tRPC with tenant from path parameter
app.use(
  "/api/:tenant/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createContextFromPath,
  }),
);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API server (tRPC) running on http://localhost:${PORT}`);
  console.log(`🔌 tRPC endpoint at http://localhost:${PORT}/trpc`);
  console.log(`🔌 tRPC with path param at http://localhost:${PORT}/api/:tenant/trpc`);
});
