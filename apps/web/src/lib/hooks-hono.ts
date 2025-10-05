"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { apiClient } from "./api-client-hono";

// Workspace hooks
export function useWorkspaces() {
  return useSWR(
    ["workspace.list.hono"],
    async () => await apiClient("/api/workspaces"),
  );
}

export function useCreateWorkspace() {
  return useSWRMutation(
    ["workspace.create.hono"],
    async (_key, { arg }: { arg: { name: string; slug: string } }) => {
      return await apiClient("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(arg),
      });
    },
  );
}

// Site hooks
export function useSites() {
  return useSWR(["site.list.hono"], async () => await apiClient("/api/sites"));
}

export function useCreateSite() {
  return useSWRMutation(
    ["site.create.hono"],
    async (
      _key,
      {
        arg,
      }: {
        arg: {
          name: string;
          description?: string;
          workspaceId: number;
        };
      },
    ) => {
      return await apiClient("/api/sites", {
        method: "POST",
        body: JSON.stringify(arg),
      });
    },
  );
}
