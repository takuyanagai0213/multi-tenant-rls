-- Enable Row Level Security on Workspace table
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for Workspace
CREATE POLICY workspace_tenant_isolation ON "Workspace"
  USING ("tenant" = current_setting('app.current_tenant')::text::"Tenant");

-- Enable Row Level Security on Site table
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for Site
CREATE POLICY site_tenant_isolation ON "Site"
  USING ("tenant" = current_setting('app.current_tenant')::text::"Tenant");
