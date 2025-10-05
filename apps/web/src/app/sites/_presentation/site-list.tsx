"use client";

import { useSites, useCreateSite, useWorkspaces } from "@/lib/hooks";
import { mutate } from "swr";
import { useState } from "react";

export function SiteList() {
  const { data: sites, error, isLoading } = useSites();
  const { data: workspaces } = useWorkspaces();
  const { trigger: createSite, isMutating } = useCreateSite();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSite({
        name,
        description: description || undefined,
        workspaceId: parseInt(workspaceId, 10),
      });
      await mutate(["site.list"]);
      setName("");
      setDescription("");
      setWorkspaceId("");
    } catch (err) {
      console.error("Failed to create site:", err);
    }
  };

  if (isLoading) return <div>Loading sites...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sites</h2>
        <p className="text-gray-600">
          Tenant isolated sites (filtered by domain)
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              rows={3}
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Workspace
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            >
              <option value="">Select workspace...</option>
              {workspaces?.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={isMutating}
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isMutating ? "Creating..." : "Create Site"}
        </button>
      </form>

      <ul className="space-y-2">
        {sites?.map((site) => (
          <li key={site.id} className="rounded border p-4">
            <h3 className="font-semibold">{site.name}</h3>
            {site.description && (
              <p className="text-gray-700">{site.description}</p>
            )}
            <p className="text-sm text-gray-600">
              Workspace ID: {site.workspaceId} • {site.tenant}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
