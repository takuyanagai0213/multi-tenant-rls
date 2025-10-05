import { headers } from "next/headers";
import type { Tenant } from "@repo/database";

/**
 * Server Componentでテナントを取得
 *
 * Middlewareで注入された x-tenant ヘッダーから取得
 */
export async function getTenant(): Promise<Tenant> {
  const headersList = await headers();
  const tenant = headersList.get("x-tenant");

  if (!tenant) {
    throw new Error("Tenant not found in request headers");
  }

  return tenant as Tenant;
}

/**
 * Server Actionでテナントを取得（同期版）
 */
export function getTenantSync(): Tenant {
  // Server Actionの場合は同期的にheadersを取得できる
  // ただし、Next.js 15以降では非推奨の可能性があるため
  // 必要に応じて調整が必要
  throw new Error(
    "getTenantSync is deprecated. Use getTenant() with async/await instead."
  );
}
