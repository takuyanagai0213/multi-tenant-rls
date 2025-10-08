"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client-rpc";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await apiClient.workspaces.$get();
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return res.json();
    },
  });
}

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: ["workspaces", id],
    queryFn: async () => {
      const res = await apiClient.workspaces[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return res.json();
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiClient.workspaces.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create workspace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await apiClient.workspaces[":id"].$put({
        param: { id: id.toString() },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to update workspace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.workspaces[":id"].$delete({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to delete workspace");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
