import { describe, it, expect, beforeAll, afterAll } from "vitest";
import app from "../../src/index";

describe("Workspace Router E2E", () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe("GET /api/workspaces", () => {
    it("should return only ACME_CORP workspaces", async () => {
      const response = await app.request("/api/workspaces", {
        headers: {
          "x-tenant": "ACME_CORP",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      data.forEach((workspace: any) => {
        expect(workspace.tenant).toBe("ACME_CORP");
      });
    });

    it("should return only GLOBEX_INC workspaces", async () => {
      const response = await app.request("/api/workspaces", {
        headers: {
          "x-tenant": "GLOBEX_INC",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      data.forEach((workspace: any) => {
        expect(workspace.tenant).toBe("GLOBEX_INC");
      });
    });
  });

  describe("POST /api/workspaces", () => {
    it("should create workspace with correct tenant", async () => {
      const response = await app.request("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant": "ACME_CORP",
        },
        body: JSON.stringify({
          name: "Test Workspace",
          slug: "test-workspace",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tenant).toBe("ACME_CORP");
      expect(data.name).toBe("Test Workspace");
    });
  });
});
