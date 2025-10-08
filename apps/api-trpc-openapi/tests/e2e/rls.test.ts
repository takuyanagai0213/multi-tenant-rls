import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@/index";
import { prisma, defineWorkspaceFactory } from "@repo/kysely-prisma-database";

const WorkspaceFactory = defineWorkspaceFactory();

describe("RLS Tenant Isolation E2E", () => {
  beforeEach(async () => {
    // Clean up and setup test data
    await prisma.site.deleteMany({});
    await prisma.workspace.deleteMany({});

    await WorkspaceFactory.createList(2, { tenant: "ACME_CORP" });
    await WorkspaceFactory.createList(2, { tenant: "GLOBEX_INC" });
  });

  it("should completely isolate ACME_CORP and GLOBEX_INC data", async () => {
    // Fetch ACME_CORP workspaces
    const entityAResponse = await request(app)
      .get("/trpc/workspace.list")
      .set("tenant", "ACME_CORP");

    // Fetch GLOBEX_INC workspaces
    const entityBResponse = await request(app)
      .get("/trpc/workspace.list")
      .set("tenant", "GLOBEX_INC");

    const entityAData = entityAResponse.body.result.data;
    const entityBData = entityBResponse.body.result.data;

    // Verify isolation
    expect(entityAData.length).toBe(2);
    expect(entityBData.length).toBe(2);

    // Verify no cross-tenant data leakage
    entityAData.forEach((workspace: any) => {
      expect(workspace.tenant).toBe("ACME_CORP");
    });

    entityBData.forEach((workspace: any) => {
      expect(workspace.tenant).toBe("GLOBEX_INC");
    });
  });

  it("should reject requests without tenant header", async () => {
    const response = await request(app).get("/trpc/workspace.list");

    expect(response.status).toBe(401);
  });

  it("should reject requests with invalid tenant", async () => {
    const response = await request(app)
      .get("/trpc/workspace.list")
      .set("tenant", "INVALID_ENTITY");

    expect(response.status).toBe(401);
  });
});
