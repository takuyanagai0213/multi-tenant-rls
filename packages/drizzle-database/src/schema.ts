import { pgTable, serial, text, timestamp, pgEnum, integer, index } from "drizzle-orm/pg-core";

export const tenantEnum = pgEnum("Tenant", [
  "ACME_CORP",
  "GLOBEX_INC",
  "WAYNE_ENTERPRISES",
  "STARK_INDUSTRIES",
]);

export const workspace = pgTable(
  "Workspace",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    tenant: tenantEnum("tenant").notNull().default("ACME_CORP"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("Workspace_tenant_idx").on(table.tenant),
  })
);

export const site = pgTable(
  "Site",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    tenant: tenantEnum("tenant").notNull().default("ACME_CORP"),
    workspaceId: integer("workspaceId")
      .notNull()
      .references(() => workspace.id),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("Site_tenant_idx").on(table.tenant),
    workspaceIdx: index("Site_workspaceId_idx").on(table.workspaceId),
  })
);
