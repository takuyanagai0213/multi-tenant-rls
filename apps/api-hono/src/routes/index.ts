import { OpenAPIHono } from "@hono/zod-openapi";

// Header-based routes (tenant from header)
import {
  listWorkspacesRoute,
  createWorkspaceRoute,
  getWorkspaceRoute,
  updateWorkspaceRoute,
  deleteWorkspaceRoute,
  listWorkspacesHandler,
  createWorkspaceHandler,
  getWorkspaceHandler,
  updateWorkspaceHandler,
  deleteWorkspaceHandler,
} from "./header-based/workspaces.route";
import {
  listSitesRoute,
  createSiteRoute,
  getSiteRoute,
  updateSiteRoute,
  deleteSiteRoute,
  listSitesHandler,
  createSiteHandler,
  getSiteHandler,
  updateSiteHandler,
  deleteSiteHandler,
} from "./header-based/sites.route";

// Path-based routes (tenant from path)
import {
  listWorkspacesPathRoute,
  createWorkspacePathRoute,
  getWorkspacePathRoute,
  updateWorkspacePathRoute,
  deleteWorkspacePathRoute,
  listWorkspacesPathHandler,
  createWorkspacePathHandler,
  getWorkspacePathHandler,
  updateWorkspacePathHandler,
  deleteWorkspacePathHandler,
} from "./path-based/workspaces.route";
import {
  listSitesPathRoute,
  createSitePathRoute,
  getSitePathRoute,
  updateSitePathRoute,
  deleteSitePathRoute,
  listSitesPathHandler,
  createSitePathHandler,
  getSitePathHandler,
  updateSitePathHandler,
  deleteSitePathHandler,
} from "./path-based/sites.route";

// Nested routes
import {
  listWorkspaceSitesRoute,
  createWorkspaceSiteRoute,
  getWorkspaceSiteRoute,
  updateWorkspaceSiteRoute,
  deleteWorkspaceSiteRoute,
  listWorkspaceSitesHandler,
  createWorkspaceSiteHandler,
  getWorkspaceSiteHandler,
  updateWorkspaceSiteHandler,
  deleteWorkspaceSiteHandler,
} from "./nested/workspace-sites.route";
import {
  listTenantWorkspacesRoute,
  createTenantWorkspaceRoute,
  getTenantWorkspaceRoute,
  listTenantWorkspaceSitesRoute,
  createTenantWorkspaceSiteRoute,
  getTenantWorkspaceSiteRoute,
  listTenantWorkspacesHandler,
  createTenantWorkspaceHandler,
  getTenantWorkspaceHandler,
  listTenantWorkspaceSitesHandler,
  createTenantWorkspaceSiteHandler,
  getTenantWorkspaceSiteHandler,
} from "./nested/tenant-workspaces.route";

export const apiRoutes = new OpenAPIHono()
  // Workspace routes (header-based)
  .openapi(listWorkspacesRoute, listWorkspacesHandler)
  .openapi(createWorkspaceRoute, createWorkspaceHandler)
  .openapi(getWorkspaceRoute, getWorkspaceHandler)
  .openapi(updateWorkspaceRoute, updateWorkspaceHandler)
  .openapi(deleteWorkspaceRoute, deleteWorkspaceHandler)
  // Site routes (header-based)
  .openapi(listSitesRoute, listSitesHandler)
  .openapi(createSiteRoute, createSiteHandler)
  .openapi(getSiteRoute, getSiteHandler)
  .openapi(updateSiteRoute, updateSiteHandler)
  .openapi(deleteSiteRoute, deleteSiteHandler)
  // Workspace routes (path parameter)
  .openapi(listWorkspacesPathRoute, listWorkspacesPathHandler)
  .openapi(createWorkspacePathRoute, createWorkspacePathHandler)
  .openapi(getWorkspacePathRoute, getWorkspacePathHandler)
  .openapi(updateWorkspacePathRoute, updateWorkspacePathHandler)
  .openapi(deleteWorkspacePathRoute, deleteWorkspacePathHandler)
  // Site routes (path parameter)
  .openapi(listSitesPathRoute, listSitesPathHandler)
  .openapi(createSitePathRoute, createSitePathHandler)
  .openapi(getSitePathRoute, getSitePathHandler)
  .openapi(updateSitePathRoute, updateSitePathHandler)
  .openapi(deleteSitePathRoute, deleteSitePathHandler)
  // Nested resource routes (workspace > sites)
  .openapi(listWorkspaceSitesRoute, listWorkspaceSitesHandler)
  .openapi(createWorkspaceSiteRoute, createWorkspaceSiteHandler)
  .openapi(getWorkspaceSiteRoute, getWorkspaceSiteHandler)
  .openapi(updateWorkspaceSiteRoute, updateWorkspaceSiteHandler)
  .openapi(deleteWorkspaceSiteRoute, deleteWorkspaceSiteHandler)
  // Tenant-based nested routes (tenant > workspaces)
  .openapi(listTenantWorkspacesRoute, listTenantWorkspacesHandler)
  .openapi(createTenantWorkspaceRoute, createTenantWorkspaceHandler)
  .openapi(getTenantWorkspaceRoute, getTenantWorkspaceHandler)
  // Deep nested routes (tenant > workspaces > sites)
  .openapi(listTenantWorkspaceSitesRoute, listTenantWorkspaceSitesHandler)
  .openapi(createTenantWorkspaceSiteRoute, createTenantWorkspaceSiteHandler)
  .openapi(getTenantWorkspaceSiteRoute, getTenantWorkspaceSiteHandler);
