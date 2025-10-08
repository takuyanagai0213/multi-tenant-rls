import type { Tenant } from "@repo/kysely-prisma-database";

/**
 * テナント別の設定を定義
 *
 * 新規テナント追加時は、このファイルに設定を追加するだけで
 * アプリケーション全体に反映される
 */

const DOMAIN_MAPPING: Record<string, Tenant> = {
  "tenant-a-example-domain": "ACME_CORP",
  "tenant-b-example-domain": "GLOBEX_INC",
  localhost: "ACME_CORP",
};

export interface TenantBranding {
  /** サービス名 */
  name: string;
  /** ロゴテキスト（SVGロゴを使用しない場合） */
  logoText?: string;
  /** ロゴパス（SVGロゴを使用する場合） */
  logoPath?: string;
  /** テーマ */
  theme: "light" | "dark";
  /** プライマリカラー */
  primaryColor: string;
}

export interface TenantConfig {
  branding: TenantBranding;
}

/**
 * テナント別設定のマスターデータ
 */
export const TENANT_CONFIG: Record<Tenant, TenantConfig> = {
  ACME_CORP: {
    branding: {
      name: "ACME Corp Platform",
      logoPath: "/logos/acme.svg",
      theme: "dark",
      primaryColor: "#3b82f6",
    },
  },
  GLOBEX_INC: {
    branding: {
      name: "Globex Platform",
      logoText: "Globex+",
      theme: "light",
      primaryColor: "#10b981",
    },
  },
  WAYNE_ENTERPRISES: {
    branding: {
      name: "Wayne Enterprises",
      logoText: "Wayne",
      theme: "dark",
      primaryColor: "#1f2937",
    },
  },
  STARK_INDUSTRIES: {
    branding: {
      name: "Stark Industries",
      logoPath: "/logos/stark.svg",
      theme: "light",
      primaryColor: "#ef4444",
    },
  },
} as const;

/**
 * テナント設定を取得
 */
export function getTenantConfig(tenant: Tenant): TenantConfig {
  const config = TENANT_CONFIG[tenant];

  if (!config) {
    throw new Error(`Tenant config not found for: ${tenant}`);
  }

  return config;
}

export function getTenantFromDomain(host: string): Tenant | null {
  const hostname = host.split(":")[0];
  return DOMAIN_MAPPING[hostname] ?? null;
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
