import type { Tenant } from "@repo/database";
import { getTenantConfig } from "@/config/tenant-config";
import Image from "next/image";

interface TenantLogoProps {
  tenant: Tenant;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * テナント別のロゴコンポーネント
 *
 * テナント設定に基づいてSVGロゴまたはテキストロゴを表示
 */
export function TenantLogo({
  tenant,
  variant = "light",
  className = "",
}: TenantLogoProps) {
  const config = getTenantConfig(tenant);
  const { branding } = config;

  // SVGロゴがある場合
  if (branding.logoPath) {
    return (
      <Image
        src={branding.logoPath}
        alt={branding.name}
        width={120}
        height={40}
        className={className}
      />
    );
  }

  // テキストロゴの場合
  if (branding.logoText) {
    return (
      <span
        className={`text-xl font-bold ${
          variant === "light" ? "text-white" : "text-gray-900"
        } ${className}`}
      >
        {branding.logoText}
      </span>
    );
  }

  // フォールバック
  return (
    <span className={`text-xl font-bold ${className}`}>{branding.name}</span>
  );
}
