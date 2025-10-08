import { seed } from "drizzle-seed";
import { db } from "./db";
import { workspace, site } from "./schema";

// Seed database with sample data
export async function seedDatabase() {
  await seed(db, { workspace, site });
}

// Factory helper functions
export const workspaceFactory = {
  build: (overrides?: Partial<typeof workspace.$inferInsert>) => ({
    name: `Workspace ${Math.random().toString(36).substring(7)}`,
    slug: `workspace-${Math.random().toString(36).substring(7)}`,
    tenant: "ACME_CORP" as const,
    ...overrides,
  }),
};

export const siteFactory = {
  build: (overrides?: Partial<typeof site.$inferInsert>) => ({
    name: `Site ${Math.random().toString(36).substring(7)}`,
    description: `Description for site`,
    tenant: "ACME_CORP" as const,
    workspaceId: 1,
    ...overrides,
  }),
};
