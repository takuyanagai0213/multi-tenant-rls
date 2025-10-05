import type { Tenant } from "@repo/database";

/**
 * テナント別の設定を定義
 *
 * 新規テナント追加時は、このファイルに設定を追加するだけで
 * アプリケーション全体に反映される
 */

export interface TenantFeatures {
  /** ASPプロモーション機能の有効化 */
  aspPromotion: boolean;
  /** クリエイティブレポート機能の有効化 */
  creativeReport: boolean;
  /** ポストバック設定の有効化 */
  postback: boolean;
  /** トラッキングリンク機能の有効化 */
  trackingLink: boolean;
  /** ABテスト機能の有効化 */
  abTest: boolean;
  /** ロスデータダウンロード機能の有効化 */
  lossDataDownload: boolean;
}

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

export interface TenantRoutes {
  /** ホームパス */
  home: string;
  /** ダッシュボードパス */
  dashboard: string;
  /** レポートパス */
  report: string;
  /** 契約管理パス */
  contracts: string;
}

export interface TenantConfig {
  features: TenantFeatures;
  branding: TenantBranding;
  routes: TenantRoutes;
}

/**
 * テナント別設定のマスターデータ
 */
export const TENANT_CONFIG: Record<Tenant, TenantConfig> = {
  ACME_CORP: {
    features: {
      aspPromotion: false,
      creativeReport: true,
      postback: true,
      trackingLink: false,
      abTest: false,
      lossDataDownload: false,
    },
    branding: {
      name: "ACME Corp Platform",
      logoPath: "/logos/acme.svg",
      theme: "dark",
      primaryColor: "#3b82f6",
    },
    routes: {
      home: "/",
      dashboard: "/dashboard",
      report: "/report",
      contracts: "/contracts",
    },
  },
  GLOBEX_INC: {
    features: {
      aspPromotion: true,
      creativeReport: false,
      postback: false,
      trackingLink: true,
      abTest: true,
      lossDataDownload: true,
    },
    branding: {
      name: "Globex Platform",
      logoText: "Globex+",
      theme: "light",
      primaryColor: "#10b981",
    },
    routes: {
      home: "/",
      dashboard: "/dashboard",
      report: "/report",
      contracts: "/contracts",
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

/**
 * 機能フラグをチェック
 */
export function hasFeature(
  tenant: Tenant,
  feature: keyof TenantFeatures
): boolean {
  return getTenantConfig(tenant).features[feature];
}
