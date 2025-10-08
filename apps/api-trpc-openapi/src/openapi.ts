import { generateOpenApiDocument } from "trpc-to-openapi";
import { appRouter } from "@/trpc/router";

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Multi-Tenant RLS API (tRPC)",
  version: "1.0.0",
  baseUrl: "http://localhost:4000/api",
  docsUrl: "https://github.com/your-org/multi-tenant-rls",
  tags: ["workspaces", "sites"],
});
