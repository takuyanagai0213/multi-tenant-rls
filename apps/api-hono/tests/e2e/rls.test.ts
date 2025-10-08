import { describe, it, expect, beforeAll, afterAll } from "vitest";
import app from "../../src/index";
import { prisma } from "@repo/kysely-prisma-database";

describe("RLS Tenant Isolation E2E", () => {
  beforeAll(async () => {
    // Setup test data for both tenants
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

  afterAll(async () => {
    // Cleanup test data
    await prisma.workspace.deleteMany({
      where: {
        slug: {
          in: ["workspace-a1", "workspace-a2", "workspace-b1", "workspace-b2"],
        },
      },
    });
  });

  it("should completely isolate ACME_CORP and GLOBEX_INC data", async () => {
    // Fetch ACME_CORP workspaces
    const acmeResponse = await app.request("/api/workspaces", {
      headers: {
        "x-tenant": "ACME_CORP",
      },
    });

    // Fetch GLOBEX_INC workspaces
    const globexResponse = await app.request("/api/workspaces", {
      headers: {
        "x-tenant": "GLOBEX_INC",
      },
    });

    const acmeData = await acmeResponse.json();
    const globexData = await globexResponse.json();

    // Verify isolation
    expect(acmeData.length).toBe(2);
    expect(globexData.length).toBe(2);

    // Verify no cross-tenant data leakage
    const acmeSlugs = acmeData.map((workspace: any) => workspace.slug);
    const globexSlugs = globexData.map((workspace: any) => workspace.slug);

    expect(acmeSlugs).toContain("workspace-a1");
    expect(acmeSlugs).toContain("workspace-a2");
    expect(acmeSlugs).not.toContain("workspace-b1");
    expect(acmeSlugs).not.toContain("workspace-b2");

    expect(globexSlugs).toContain("workspace-b1");
    expect(globexSlugs).toContain("workspace-b2");
    expect(globexSlugs).not.toContain("workspace-a1");
    expect(globexSlugs).not.toContain("workspace-a2");
  });

  it("should reject requests without x-tenant header", async () => {
    const response = await app.request("/api/workspaces");

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Missing x-tenant header");
  });
});
