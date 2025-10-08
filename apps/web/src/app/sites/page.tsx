"use client";

import { useSites, useCreateSite, useDeleteSite } from "@/hooks/use-sites";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useState } from "react";

export default function SitesPage() {
  const { data: sites, isLoading, error } = useSites();
  const { data: workspaces } = useWorkspaces();
  const createSite = useCreateSite();
  const deleteSite = useDeleteSite();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSite.mutateAsync({
      name,
      description: description || undefined,
      workspaceId: Number(workspaceId),
    });
    setName("");
    setDescription("");
    setWorkspaceId("");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      await deleteSite.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sites</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">Select Workspace</option>
            {workspaces?.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={createSite.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {createSite.isPending ? "Creating..." : "Create Site"}
        </button>
      </form>

      <div className="space-y-4">
        {sites?.map((site) => (
          <div key={site.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{site.name}</h3>
              <p className="text-sm text-gray-600">
                {site.description || "No description"} • Workspace: {site.workspaceId} • {site.tenant}
              </p>
            </div>
            <button
              onClick={() => handleDelete(site.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
