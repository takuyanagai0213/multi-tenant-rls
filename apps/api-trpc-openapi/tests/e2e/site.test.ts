import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "@/index";
import { prisma, defineWorkspaceFactory, defineSiteFactory } from "@repo/kysely-prisma-database";

const WorkspaceFactory = defineWorkspaceFactory();
const SiteFactory = defineSiteFactory();

describe("Site Router E2E", () => {
  let acmeWorkspace: any;
  let globexWorkspace: any;

  beforeEach(async () => {
    // Clean up before each test
    await prisma.site.deleteMany({});
    await prisma.workspace.deleteMany({});

    // Create workspaces for testing
    acmeWorkspace = await WorkspaceFactory.create({
      name: "ACME Workspace",
      slug: "acme-workspace",
      tenant: "ACME_CORP",
    });

    globexWorkspace = await WorkspaceFactory.create({
      name: "Globex Workspace",
      slug: "globex-workspace",
      tenant: "GLOBEX_INC",
    });
  });

  describe("site.list", () => {
    it("should return only ACME_CORP sites", async () => {
      // Create test data
      await SiteFactory.createList(2, {
        tenant: "ACME_CORP",
        workspaceId: acmeWorkspace.id,
      });
      await SiteFactory.create({
        tenant: "GLOBEX_INC",
        workspaceId: globexWorkspace.id,
      });

      const response = await request(app)
        .get("/trpc/site.list")
        .set("tenant", "ACME_CORP");

      expect(response.status).toBe(200);
      expect(response.body.result.data).toBeInstanceOf(Array);
      expect(response.body.result.data.length).toBe(2);
      response.body.result.data.forEach((site: any) => {
        expect(site.tenant).toBe("ACME_CORP");
      });
    });

    it("should return only GLOBEX_INC sites", async () => {
      // Create test data
      await SiteFactory.create({
        tenant: "ACME_CORP",
        workspaceId: acmeWorkspace.id,
      });
      await SiteFactory.createList(2, {
        tenant: "GLOBEX_INC",
        workspaceId: globexWorkspace.id,
      });

      const response = await request(app)
        .get("/trpc/site.list")
        .set("tenant", "GLOBEX_INC");

      expect(response.status).toBe(200);
      expect(response.body.result.data.length).toBe(2);
      response.body.result.data.forEach((site: any) => {
        expect(site.tenant).toBe("GLOBEX_INC");
      });
    });
  });

  describe("site.create", () => {
    it("should create site with correct tenant", async () => {
      const response = await request(app)
        .post("/trpc/site.create")
        .set("tenant", "ACME_CORP")
        .send({
          name: "Test Site",
          description: "Test Description",
          workspaceId: acmeWorkspace.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.tenant).toBe("ACME_CORP");
      expect(response.body.result.data.name).toBe("Test Site");
      expect(response.body.result.data.workspaceId).toBe(acmeWorkspace.id);
    });

    it("should enforce tenant isolation on create", async () => {
      // Try to create a site for GLOBEX workspace while using ACME tenant
      const response = await request(app)
        .post("/trpc/site.create")
        .set("tenant", "ACME_CORP")
        .send({
          name: "Cross-tenant Site",
          workspaceId: globexWorkspace.id,
        });

      // Should fail due to RLS or validation
      expect(response.status).not.toBe(200);
    });
  });

  describe("site.list with workspaceSlug filter", () => {
    it("should return sites filtered by workspaceSlug", async () => {
      await SiteFactory.createList(3, {
        tenant: "ACME_CORP",
        workspaceId: acmeWorkspace.id,
      });

      const response = await request(app)
        .get(`/trpc/site.list?input=${JSON.stringify({ workspaceSlug: acmeWorkspace.slug })}`)
        .set("tenant", "ACME_CORP");

      expect(response.status).toBe(200);
      expect(response.body.result.data.length).toBe(3);
      response.body.result.data.forEach((site: any) => {
        expect(site.workspaceId).toBe(acmeWorkspace.id);
        expect(site.tenant).toBe("ACME_CORP");
      });
    });

    it("should not return sites from other tenants when filtering by workspaceSlug", async () => {
      await SiteFactory.createList(2, {
        tenant: "ACME_CORP",
        workspaceId: acmeWorkspace.id,
      });
      await SiteFactory.createList(2, {
        tenant: "GLOBEX_INC",
        workspaceId: globexWorkspace.id,
      });

      const response = await request(app)
        .get(`/trpc/site.list?input=${JSON.stringify({ workspaceSlug: acmeWorkspace.slug })}`)
        .set("tenant", "ACME_CORP");

      expect(response.status).toBe(200);
      expect(response.body.result.data.length).toBe(2);
      response.body.result.data.forEach((site: any) => {
        expect(site.tenant).toBe("ACME_CORP");
      });
    });

    it("should return empty array for non-existent workspaceSlug", async () => {
      const response = await request(app)
        .get(`/trpc/site.list?input=${JSON.stringify({ workspaceSlug: "non-existent-slug" })}`)
        .set("tenant", "ACME_CORP");

      expect(response.status).toBe(200);
      expect(response.body.result.data.length).toBe(0);
    });
  });

  describe("site.update", () => {
    it("should update site", async () => {
      const site = await SiteFactory.create({
        tenant: "ACME_CORP",
        workspaceId: acmeWorkspace.id,
      });

      const response = await request(app)
        .post("/trpc/site.update")
        .set("tenant", "ACME_CORP")
        .send({
          id: site.id,
          name: "Updated Site Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.name).toBe("Updated Site Name");
      expect(response.body.result.data.tenant).toBe("ACME_CORP");
    });

    it("should not update site from other tenant", async () => {
      const site = await SiteFactory.create({
        tenant: "GLOBEX_INC",
        workspaceId: globexWorkspace.id,
      });

      const response = await request(app)
        .post("/trpc/site.update")
        .set("tenant", "ACME_CORP")
        .send({
          id: site.id,
          name: "Updated Site Name",
        });

      expect(response.status).not.toBe(200);
    });
  });

  describe("site.delete", () => {
    it("should delete site", async () => {
      const site = await SiteFactory.create({
        tenant: "ACME_CORP",
        workspaceId: acmeWorkspace.id,
      });

      const response = await request(app)
        .post("/trpc/site.delete")
        .set("tenant", "ACME_CORP")
        .send({ id: site.id });

      expect(response.status).toBe(200);

      const deleted = await prisma.site.findUnique({
        where: { id: site.id },
      });
      expect(deleted).toBeNull();
    });

    it("should not delete site from other tenant", async () => {
      const site = await SiteFactory.create({
        tenant: "GLOBEX_INC",
        workspaceId: globexWorkspace.id,
      });

      const response = await request(app)
        .post("/trpc/site.delete")
        .set("tenant", "ACME_CORP")
        .send({ id: site.id });

      expect(response.status).not.toBe(200);
    });
  });
});
