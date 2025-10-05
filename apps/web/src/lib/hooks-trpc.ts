"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { trpc } from "./trpc";

// Workspace hooks
export function useWorkspaces() {
  return useSWR(["workspace.list.trpc"], async () => {
    return await trpc.workspace.list.query();
  });
}

export function useCreateWorkspace() {
  return useSWRMutation(
    ["workspace.create.trpc"],
    async (_key, { arg }: { arg: { name: string; slug: string } }) => {
      return await trpc.workspace.create.mutate(arg);
    },
  );
}

// Site hooks
export function useSites() {
  return useSWR(["site.list.trpc"], async () => {
    return await trpc.site.list.query();
  });
}

export function useCreateSite() {
  return useSWRMutation(
    ["site.create.trpc"],
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
      return await trpc.site.create.mutate(arg);
    },
  );
}
