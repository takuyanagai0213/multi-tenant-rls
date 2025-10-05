import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="mb-6 text-4xl font-bold">Multi-Tenant RLS Sample</h1>
      <p className="mb-8 text-gray-600">
        PostgreSQL Row Level Security demonstration with Express + tRPC +
        Next.js
      </p>
      <div className="space-y-4">
        <Link
          href="/organizations"
          className="block rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          View Organizations
        </Link>
        <Link
          href="/projects"
          className="block rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          View Projects
        </Link>
      </div>
    </main>
  );
}
