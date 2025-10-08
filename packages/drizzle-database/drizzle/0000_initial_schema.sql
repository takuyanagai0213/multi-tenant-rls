-- Create Tenant enum type
CREATE TYPE "Tenant" AS ENUM ('ACME_CORP', 'GLOBEX_INC', 'WAYNE_ENTERPRISES', 'STARK_INDUSTRIES');

-- Create Workspace table
CREATE TABLE IF NOT EXISTS "Workspace" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tenant" "Tenant" DEFAULT 'ACME_CORP' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Workspace_slug_unique" UNIQUE("slug")
);

-- Create Site table
CREATE TABLE IF NOT EXISTS "Site" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tenant" "Tenant" DEFAULT 'ACME_CORP' NOT NULL,
	"workspaceId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Workspace_tenant_idx" ON "Workspace" ("tenant");
CREATE INDEX IF NOT EXISTS "Site_tenant_idx" ON "Site" ("tenant");
CREATE INDEX IF NOT EXISTS "Site_workspaceId_idx" ON "Site" ("workspaceId");

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "Site" ADD CONSTRAINT "Site_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
