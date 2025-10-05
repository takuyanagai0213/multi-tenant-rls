import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index";
import { prisma } from "@repo/database";

describe("Workspace Router E2E", () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.site.deleteMany({});
    await prisma.workspace.deleteMany({});
  });

  describe("workspace.list", () => {
    it("should return only ACME_CORP workspaces", async () => {
      // Create test data
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
        ],
      });

      const response = await request(app)
        .get("/trpc/workspace.list")
        .set("tenant", "ACME_CORP");

      expect(response.status).toBe(200);
      expect(response.body.result.data).toBeInstanceOf(Array);
      expect(response.body.result.data.length).toBe(2);
      response.body.result.data.forEach((workspace: any) => {
        expect(workspace.tenant).toBe("ACME_CORP");
      });
    });

    it("should return only GLOBEX_INC workspaces", async () => {
      // Create test data
      await prisma.workspace.createMany({
        data: [
          {
            name: "Workspace A1",
            slug: "workspace-a1",
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

      const response = await request(app)
        .get("/trpc/workspace.list")
        .set("tenant", "GLOBEX_INC");

      expect(response.status).toBe(200);
      expect(response.body.result.data.length).toBe(2);
      response.body.result.data.forEach((workspace: any) => {
        expect(workspace.tenant).toBe("GLOBEX_INC");
      });
    });
  });

  describe("workspace.create", () => {
    it("should create workspace with correct tenant", async () => {
      const response = await request(app)
        .post("/trpc/workspace.create")
        .set("tenant", "ACME_CORP")
        .send({
          name: "Test Workspace",
          slug: "test-workspace",
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.tenant).toBe("ACME_CORP");
      expect(response.body.result.data.name).toBe("Test Workspace");
    });
  });
});
