"use client";

import { useWorkspaces, useCreateWorkspace } from "@/lib/hooks";
import { mutate } from "swr";
import { useState } from "react";

export function WorkspaceList() {
  const { data: workspaces, error, isLoading } = useWorkspaces();
  const { trigger: createWorkspace, isMutating } = useCreateWorkspace();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createWorkspace({ name, slug });
      await mutate(["workspace.list"]);
      setName("");
      setSlug("");
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  if (isLoading) return <div>Loading workspaces...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Workspaces</h2>
        <p className="text-gray-600">
          Tenant isolated workspaces (filtered by domain)
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
            Slug
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isMutating}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isMutating ? "Creating..." : "Create Workspace"}
        </button>
      </form>

      <ul className="space-y-2">
        {workspaces?.map((workspace) => (
          <li key={workspace.id} className="rounded border p-4">
            <h3 className="font-semibold">{workspace.name}</h3>
            <p className="text-sm text-gray-600">
              {workspace.slug} • {workspace.tenant}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
