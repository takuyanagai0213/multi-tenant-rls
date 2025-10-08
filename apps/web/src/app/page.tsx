import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Multi-Tenant RLS with Hono RPC</h1>
      <p className="mb-8">
        This is a demo application showcasing Row Level Security (RLS) with Hono RPC for type-safe APIs.
      </p>

      <div className="space-y-4">
        <Link
          href="/workspaces"
          className="block p-4 border rounded hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Workspaces</h2>
          <p className="text-gray-600">Manage your workspaces</p>
        </Link>

        <Link
          href="/sites"
          className="block p-4 border rounded hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Sites</h2>
          <p className="text-gray-600">Manage your sites</p>
        </Link>
      </div>
    </div>
  );
}
