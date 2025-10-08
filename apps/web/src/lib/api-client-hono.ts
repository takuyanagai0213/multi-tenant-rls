"use client";

import { getCurrentTenant } from "@/config/tenant-config";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_HONO_API_URL || "http://localhost:4001";

async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const tenant = getCurrentTenant();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-tenant": tenant,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export { apiClient };
