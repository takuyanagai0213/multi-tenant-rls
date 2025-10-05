import type { Tenant } from "@repo/database";

const DOMAIN_MAPPING: Record<string, Tenant> = {
  "advertiser.platform-a.example.com": "ACME_CORP",
  "publisher.platform-a.example.com": "ACME_CORP",
  "advertiser.platform-b.example.com": "GLOBEX_INC",
  "publisher.platform-b.example.com": "GLOBEX_INC",
  "localhost:3000": "ACME_CORP",
  "localhost:4000": "ACME_CORP",
};

export function getTenantFromDomain(host: string): Tenant | null {
  return DOMAIN_MAPPING[host] ?? null;
}

// Get current tenant from window.location.host
export function getCurrentTenant(): Tenant {
  if (typeof window === "undefined") {
    throw new Error("getCurrentTenant can only be called on client side");
  }

  const tenant = getTenantFromDomain(window.location.host);

  if (!tenant) {
    throw new Error(`Unknown domain: ${window.location.host}`);
  }

  return tenant;
}
