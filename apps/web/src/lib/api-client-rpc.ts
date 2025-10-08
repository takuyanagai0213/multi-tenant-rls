import { hc } from "hono/client";
import type { AppType } from "api-hono-rpc";
import { getCurrentTenant } from "@/config/tenant-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const createApiClient = () => {
  const tenant = getCurrentTenant();

  const client = hc<AppType>(API_BASE_URL, {
    headers: {
      "x-tenant": tenant,
    },
  });

  return client;
};

// Export typed client
export const apiClient = createApiClient();
