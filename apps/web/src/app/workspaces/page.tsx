"use client";

import { useWorkspaces, useCreateWorkspace, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useState } from "react";

export default function WorkspacesPage() {
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkspace.mutateAsync({ name, slug });
    setName("");
    setSlug("");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      await deleteWorkspace.mutateAsync(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Workspaces</h1>

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
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          disabled={createWorkspace.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
        </button>
      </form>

      <div className="space-y-4">
        {workspaces?.map((workspace) => (
          <div key={workspace.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{workspace.name}</h3>
              <p className="text-sm text-gray-600">
                {workspace.slug} • {workspace.tenant}
              </p>
            </div>
            <button
              onClick={() => handleDelete(workspace.id)}
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
