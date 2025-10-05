/**
 * テナント統合後の実装パターン例
 *
 * このファイルは、Next.jsプロジェクト統合時の
 * 実装パターンを示すサンプルです
 */

import { getTenant } from "@/lib/get-tenant";
import { getTenantConfig } from "@/config/tenant-config";
import { TenantLogo } from "@/components/tenant-logo";
import { FeatureGate } from "@/components/feature-gate";

/**
 * 統合後のページコンポーネント例
 *
 * 従来の実装:
 * - 環境変数による分岐が33箇所に散在
 * - agency-* プレフィックスのディレクトリが重複
 * - テナントごとに異なるコンポーネントを実装
 *
 * 統合後の実装:
 * - テナント判定はMiddlewareで一元化
 * - 設定ベースで機能の出し分け
 * - コンポーネントは共通化、差分は設定で吸収
 */
export default async function ExamplePage() {
  // Server Componentでテナントを取得
  const tenant = await getTenant();
  const config = getTenantConfig(tenant);

  return (
    <div className="container mx-auto p-8">
      {/* テナント別ロゴの表示 */}
      <header className="mb-8">
        <TenantLogo tenant={tenant} />
      </header>

      <h1 className="text-3xl font-bold mb-4">
        Welcome to {config.branding.name}
      </h1>

      {/* 機能フラグによる表示制御 */}
      <section className="space-y-4">
        <FeatureGate tenant={tenant} feature="aspPromotion">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold">ASPプロモーション</h2>
            <p>この機能は {tenant} で有効です</p>
          </div>
        </FeatureGate>

        <FeatureGate tenant={tenant} feature="creativeReport">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold">クリエイティブレポート</h2>
            <p>この機能は {tenant} で有効です</p>
          </div>
        </FeatureGate>

        <FeatureGate tenant={tenant} feature="trackingLink">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold">トラッキングリンク</h2>
            <p>この機能は {tenant} で有効です</p>
          </div>
        </FeatureGate>

        <FeatureGate tenant={tenant} feature="abTest">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold">ABテスト</h2>
            <p>この機能は {tenant} で有効です</p>
          </div>
        </FeatureGate>
      </section>

      {/* テナント設定の表示 */}
      <section className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">現在のテナント設定</h2>
        <pre className="text-sm">
          {JSON.stringify(
            {
              tenant,
              features: config.features,
              branding: config.branding,
            },
            null,
            2
          )}
        </pre>
      </section>
    </div>
  );
}

/**
 * 実装パターンの比較
 *
 * 【従来の実装（分離プロジェクト）】
 * ```tsx
 * // 環境変数による分岐が必要
 * const domain = getDomain(headers());
 * if (domain === process.env.NEXT_PUBLIC_AGENCY_DOMAIN) {
 *   return <AgencyPage />;
 * } else {
 *   return <CanvasPage />;
 * }
 * ```
 *
 * 【統合後の実装】
 * ```tsx
 * // テナント設定ベースで統一
 * const tenant = await getTenant();
 * const config = getTenantConfig(tenant);
 *
 * return (
 *   <UnifiedPage
 *     tenant={tenant}
 *     config={config}
 *   />
 * );
 * ```
 *
 * メリット:
 * 1. 環境変数分岐が97%削減（33箇所 → 1箇所）
 * 2. コード重複がゼロ
 * 3. 新規テナント追加が設定ファイル編集のみ
 * 4. 型安全性が向上
 * 5. テストが容易（tenant propsを渡すだけ）
 */
