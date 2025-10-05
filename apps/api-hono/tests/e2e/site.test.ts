import { describe, it, expect, beforeAll, afterAll } from "vitest";
import app from "../../src/index";

describe("Site Router E2E", () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe("GET /api/sites", () => {
    it("should return only ACME_CORP sites", async () => {
      const response = await app.request("/api/sites", {
        headers: {
          "x-tenant": "ACME_CORP",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      data.forEach((site: any) => {
        expect(site.tenant).toBe("ACME_CORP");
      });
    });
  });

  describe("POST /api/sites", () => {
    it("should create site with correct tenant", async () => {
      const response = await app.request("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant": "ACME_CORP",
        },
        body: JSON.stringify({
          name: "Test Site",
          description: "Test description",
          workspaceId: 1,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tenant).toBe("ACME_CORP");
    });
  });
});
