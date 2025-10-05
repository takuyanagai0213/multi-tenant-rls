-- ================================================================
-- RLS POLICIES MIGRATION
-- Migration: enable_rls_policies
-- Purpose: Enable Row Level Security and create tenant isolation policies
-- ================================================================

-- ----------------------------------------------------------------
-- Step 1: Enable Row Level Security on all tenant-scoped tables
-- ----------------------------------------------------------------
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Step 2: Create RLS Policies for Workspace
-- ----------------------------------------------------------------

-- Policy: Tenant Isolation
-- Allow access only when session variable matches the tenant
CREATE POLICY tenant_isolation_workspace ON "Workspace"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );

-- ----------------------------------------------------------------
-- Step 3: Create RLS Policies for Site
-- ----------------------------------------------------------------

-- Policy: Tenant Isolation
-- Allow access only when session variable matches the tenant
CREATE POLICY tenant_isolation_site ON "Site"
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_tenant', true) IS NOT NULL
    AND current_setting('app.current_tenant', true) != ''
    AND "tenant" = current_setting('app.current_tenant', true)::text::"Tenant"
  );

-- ================================================================
-- END OF RLS POLICIES MIGRATION
-- ================================================================
