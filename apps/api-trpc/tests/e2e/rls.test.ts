import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { prisma } from "@repo/database";

describe("RLS Tenant Isolation E2E", () => {
  beforeEach(async () => {
    // Clean up and setup test data
    await prisma.site.deleteMany({});
    await prisma.workspace.deleteMany({});

    await prisma.workspace.createMany({
      data: [
        {
          name: "Workspace A1",
          slug: "workspace-a1",
          tenant: "ACME_CORP",
        },
        {
          name: "Workspace A2",
          slug: "workspace-a2",
          tenant: "ACME_CORP",
        },
        {
          name: "Workspace B1",
          slug: "workspace-b1",
          tenant: "GLOBEX_INC",
        },
        {
          name: "Workspace B2",
          slug: "workspace-b2",
          tenant: "GLOBEX_INC",
        },
      ],
    });
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
    const entityASlugs = entityAData.map((workspace: any) => workspace.slug);
    const entityBSlugs = entityBData.map((workspace: any) => workspace.slug);

    expect(entityASlugs).toContain("workspace-a1");
    expect(entityASlugs).toContain("workspace-a2");
    expect(entityASlugs).not.toContain("workspace-b1");
    expect(entityASlugs).not.toContain("workspace-b2");

    expect(entityBSlugs).toContain("workspace-b1");
    expect(entityBSlugs).toContain("workspace-b2");
    expect(entityBSlugs).not.toContain("workspace-a1");
    expect(entityBSlugs).not.toContain("workspace-a2");
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
