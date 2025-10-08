"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client-rpc";

export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await apiClient.sites.$get();
      if (!res.ok) throw new Error("Failed to fetch sites");
      return res.json();
    },
  });
}

export function useSite(id: number) {
  return useQuery({
    queryKey: ["sites", id],
    queryFn: async () => {
      const res = await apiClient.sites[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to fetch site");
      return res.json();
    },
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; workspaceId: number }) => {
      const res = await apiClient.sites.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create site");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useUpdateSite(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; workspaceId: number }) => {
      const res = await apiClient.sites[":id"].$put({
        param: { id: id.toString() },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to update site");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["sites", id] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.sites[":id"].$delete({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to delete site");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}
