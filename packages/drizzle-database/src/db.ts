import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// For queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Tenant-scoped database client
export function getTenantDb(tenant: string) {
  const client = postgres(connectionString, {
    connection: {
      application_name: `tenant_${tenant}`,
    },
    transform: {
      ...postgres.toPascal,
      undefined: null,
    },
    onnotice: () => {}, // Suppress RLS notices if needed
  });

  return drizzle(client, { schema });
}

export type Database = typeof db;
