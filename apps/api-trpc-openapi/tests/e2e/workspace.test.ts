import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@/index";
import { prisma, defineWorkspaceFactory } from "@repo/kysely-prisma-database";

const WorkspaceFactory = defineWorkspaceFactory();

describe("Workspace Router E2E", () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.site.deleteMany({});
    await prisma.workspace.deleteMany({});
  });

  describe("workspace.list", () => {
    it("should return only ACME_CORP workspaces", async () => {
      // Create test data
      await WorkspaceFactory.createList(2, { tenant: "ACME_CORP" });
      await WorkspaceFactory.create({ tenant: "GLOBEX_INC" });

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
      await WorkspaceFactory.create({ tenant: "ACME_CORP" });
      await WorkspaceFactory.createList(2, { tenant: "GLOBEX_INC" });

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

  describe("workspace.update", () => {
    it("should update workspace", async () => {
      const workspace = await WorkspaceFactory.create({ tenant: "ACME_CORP" });

      const response = await request(app)
        .post("/trpc/workspace.update")
        .set("tenant", "ACME_CORP")
        .send({
          id: workspace.id,
          name: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.name).toBe("Updated Name");
      expect(response.body.result.data.tenant).toBe("ACME_CORP");
    });

    it("should not update workspace from other tenant", async () => {
      const workspace = await WorkspaceFactory.create({ tenant: "GLOBEX_INC" });

      const response = await request(app)
        .post("/trpc/workspace.update")
        .set("tenant", "ACME_CORP")
        .send({
          id: workspace.id,
          name: "Updated Name",
        });

      expect(response.status).not.toBe(200);
    });
  });

  describe("workspace.delete", () => {
    it("should delete workspace", async () => {
      const workspace = await WorkspaceFactory.create({ tenant: "ACME_CORP" });

      const response = await request(app)
        .post("/trpc/workspace.delete")
        .set("tenant", "ACME_CORP")
        .send({ id: workspace.id });

      expect(response.status).toBe(200);

      const deleted = await prisma.workspace.findUnique({
        where: { id: workspace.id },
      });
      expect(deleted).toBeNull();
    });

    it("should not delete workspace from other tenant", async () => {
      const workspace = await WorkspaceFactory.create({ tenant: "GLOBEX_INC" });

      const response = await request(app)
        .post("/trpc/workspace.delete")
        .set("tenant", "ACME_CORP")
        .send({ id: workspace.id });

      expect(response.status).not.toBe(200);
    });
  });
});
