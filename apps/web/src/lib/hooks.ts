"use client";

// API backend selection based on environment variable
// Set NEXT_PUBLIC_API_BACKEND to "trpc" or "hono"
const USE_HONO = process.env.NEXT_PUBLIC_API_BACKEND === "hono";

// Import both implementations
import * as trpcHooks from "./hooks-trpc";
import * as honoHooks from "./hooks-hono";

// Export hooks based on selected backend
const hooks = USE_HONO ? honoHooks : trpcHooks;

export const useWorkspaces = hooks.useWorkspaces;
export const useCreateWorkspace = hooks.useCreateWorkspace;
export const useSites = hooks.useSites;
export const useCreateSite = hooks.useCreateSite;
