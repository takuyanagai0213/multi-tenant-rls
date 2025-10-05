import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { db, Tenant } from "@repo/database";

describe("Path Parameter Tenant Routing", () => {
  beforeAll(async () => {
    // Clean up test data
    await db.deleteFrom("Site").execute();
    await db.deleteFrom("Workspace").execute();

    // Insert test data for each tenant
    await db
      .insertInto("Workspace")
      .values([
        {
          name: "Path Test Workspace A",
          slug: "path-test-a",
          tenant: "ACME_CORP" as Tenant,
        },
        {
          name: "Path Test Workspace B",
          slug: "path-test-b",
          tenant: "GLOBEX_INC" as Tenant,
        },
      ])
      .execute();
  });

  describe("GET /api/:tenant/trpc/workspace.list", () => {
    it("should return ACME_CORP workspaces when tenant=ACME_CORP in path", async () => {
      const response = await request(app)
        .get("/api/ACME_CORP/trpc/workspace.list")
        .expect(200);

      expect(response.body.result.data).toHaveLength(1);
      expect(response.body.result.data[0].tenant).toBe("ACME_CORP");
      expect(response.body.result.data[0].name).toBe("Path Test Workspace A");
    });

    it("should return GLOBEX_INC workspaces when tenant=GLOBEX_INC in path", async () => {
      const response = await request(app)
        .get("/api/GLOBEX_INC/trpc/workspace.list")
        .expect(200);

      expect(response.body.result.data).toHaveLength(1);
      expect(response.body.result.data[0].tenant).toBe("GLOBEX_INC");
      expect(response.body.result.data[0].name).toBe("Path Test Workspace B");
    });

    it("should return error for invalid tenant in path", async () => {
      const response = await request(app)
        .get("/api/INVALID_TENANT/trpc/workspace.list")
        .expect(400);

      expect(response.body.error.message).toContain("Invalid tenant");
    });
  });

  describe("Original header-based implementation still works", () => {
    it("should return ACME_CORP workspaces using tenant header", async () => {
      const response = await request(app)
        .get("/trpc/workspace.list")
        .set("tenant", "ACME_CORP")
        .expect(200);

      expect(response.body.result.data).toHaveLength(1);
      expect(response.body.result.data[0].tenant).toBe("ACME_CORP");
    });

    it("should return error when tenant header is missing", async () => {
      const response = await request(app)
        .get("/trpc/workspace.list")
        .expect(401);

      expect(response.body.error.message).toContain("Missing tenant header");
    });
  });
});
