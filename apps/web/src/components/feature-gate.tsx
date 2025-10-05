import type { Tenant } from "@repo/database";
import { hasFeature, type TenantFeatures } from "@/config/tenant-config";
import type { ReactNode } from "react";

interface FeatureGateProps {
  tenant: Tenant;
  feature: keyof TenantFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 機能フラグによる表示制御コンポーネント
 *
 * テナント設定で有効になっている機能のみ表示
 *
 * @example
 * ```tsx
 * <FeatureGate tenant={tenant} feature="aspPromotion">
 *   <ASPPromotionButton />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  tenant,
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  if (!hasFeature(tenant, feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 複数の機能フラグによる表示制御（AND条件）
 */
interface MultiFeatureGateProps {
  tenant: Tenant;
  features: Array<keyof TenantFeatures>;
  children: ReactNode;
  fallback?: ReactNode;
}

export function MultiFeatureGate({
  tenant,
  features,
  children,
  fallback = null,
}: MultiFeatureGateProps) {
  const allEnabled = features.every((feature) => hasFeature(tenant, feature));

  if (!allEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * いずれかの機能フラグによる表示制御（OR条件）
 */
export function AnyFeatureGate({
  tenant,
  features,
  children,
  fallback = null,
}: MultiFeatureGateProps) {
  const anyEnabled = features.some((feature) => hasFeature(tenant, feature));

  if (!anyEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
