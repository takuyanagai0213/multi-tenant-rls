# Multi-Tenant Web Application

Next.jsプロジェクト統合後のマルチテナント実装パターンのサンプル

## アーキテクチャ概要

このアプリケーションは、単一のNext.jsプロジェクトで複数テナント（ACME_CORP, GLOBEX_INC）をホストします。

### テナント分離の仕組み

```
リクエスト
  ↓
Middleware (middleware.ts)
  - ドメインからテナントを判定
  - x-tenant ヘッダーに注入
  ↓
Server Component / API Route
  - getTenant() でテナント取得
  - getTenantConfig() で設定取得
  ↓
テナント別の表示・機能制御
```

## ディレクトリ構造

```
src/
├── app/
│   ├── layout.tsx              # テナント別のテーマ・メタデータ
│   ├── example-page.tsx        # 実装パターンのサンプル
│   └── ...
├── config/
│   ├── tenant.ts               # ドメイン→テナントマッピング
│   └── tenant-config.ts        # テナント別設定（機能フラグ、ブランディング等）
├── lib/
│   └── get-tenant.ts           # Server Componentでのテナント取得
├── components/
│   ├── tenant-logo.tsx         # テナント別ロゴコンポーネント
│   └── feature-gate.tsx        # 機能フラグによる表示制御
└── middleware.ts               # テナント判定とヘッダー注入
```

## 主要ファイルの説明

### 1. `middleware.ts`

全リクエストでテナントを判定し、`x-tenant` ヘッダーに注入します。

```typescript
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const tenant = getTenantFromDomain(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", tenant);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

### 2. `config/tenant-config.ts`

テナント別の設定を一元管理します。新規テナント追加時はここに設定を追加するだけです。

```typescript
export const TENANT_CONFIG: Record<Tenant, TenantConfig> = {
  ACME_CORP: {
    features: {
      aspPromotion: false,
      creativeReport: true,
      // ...
    },
    branding: {
      name: "ACME Corp Platform",
      theme: "dark",
      // ...
    },
  },
  GLOBEX_INC: {
    // ...
  },
};
```

### 3. `lib/get-tenant.ts`

Server Componentでテナント情報を取得します。

```typescript
export async function getTenant(): Promise<Tenant> {
  const headersList = await headers();
  return headersList.get("x-tenant") as Tenant;
}
```

### 4. `components/feature-gate.tsx`

機能フラグによる表示制御を宣言的に行います。

```typescript
<FeatureGate tenant={tenant} feature="aspPromotion">
  <ASPPromotionButton />
</FeatureGate>
```

## 実装パターン

### Server Componentでのテナント取得

```typescript
export default async function MyPage() {
  const tenant = await getTenant();
  const config = getTenantConfig(tenant);

  return (
    <div>
      <h1>{config.branding.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### 機能フラグによる表示制御

```typescript
export default async function Dashboard() {
  const tenant = await getTenant();

  return (
    <>
      {/* テナントBのみ表示 */}
      <FeatureGate tenant={tenant} feature="aspPromotion">
        <ASPPromotionSection />
      </FeatureGate>

      {/* テナントBのみ表示 */}
      <FeatureGate tenant={tenant} feature="creativeReport">
        <CreativeReportSection />
      </FeatureGate>
    </>
  );
}
```

### テナント別のロゴ表示

```typescript
<TenantLogo tenant={tenant} variant="light" />
```

## 従来の実装との比較

### 従来の実装（分離プロジェクト）

**問題点**:
- 環境変数による分岐が33箇所に散在
- `agency-*` プレフィックスのディレクトリが重複
- テナントごとに異なるコンポーネントを実装
- 新規テナント追加に40-60人日必要

```typescript
// 環境変数分岐が各所に散在
if (domain === process.env.NEXT_PUBLIC_AGENCY_DOMAIN) {
  return <AgencySidebar />;
} else {
  return <Sidebar />;
}
```

### 統合後の実装

**改善点**:
- 環境変数分岐を97%削減（33箇所 → 1箇所のMiddleware）
- コード重複ゼロ
- テナント設定ベースの宣言的な実装
- 新規テナント追加が1-2人日

```typescript
// 設定ベースで統一
const tenant = await getTenant();
const config = getTenantConfig(tenant);
const SidebarComponent = config.sidebar;

return <SidebarComponent />;
```

## メリット

1. **保守性の向上**
   - テナント設定が一箇所に集約
   - コード重複の完全排除

2. **開発効率の向上**
   - 機能追加時にテナント別の実装が不要
   - デプロイが1回で完結

3. **スケーラビリティ**
   - 新規テナント追加が設定ファイル編集のみ
   - テナント数が増えてもコード量は増えない

4. **型安全性**
   - `Tenant` Enumで厳密な型チェック
   - 設定漏れをコンパイル時に検出

## 新規テナント追加手順

1. `packages/kysely-prisma-database/prisma/schema.prisma` にテナントEnumを追加
2. `config/tenant.ts` のドメインマッピングに追加
3. `config/tenant-config.ts` にテナント設定を追加

以上で完了！（作業時間: 約1-2人日）

## テスト

```typescript
// テナント別のテストが容易
describe('Dashboard', () => {
  it('should show ASP promotion for GLOBEX_INC', () => {
    render(<Dashboard tenant="GLOBEX_INC" />);
    expect(screen.getByText('ASPプロモーション')).toBeInTheDocument();
  });

  it('should not show ASP promotion for ACME_CORP', () => {
    render(<Dashboard tenant="ACME_CORP" />);
    expect(screen.queryByText('ASPプロモーション')).not.toBeInTheDocument();
  });
});
```

## 参考資料

- [issue-challenge-3-frontend.md](../../../docs/design-docs/issue-challenge-3-frontend.md) - フロントエンド層の個社別実装の課題
- [issue-challenge-2.md](../../../docs/design-docs/issue-challenge-2.md) - Vercelプロジェクト分離のデメリット分析
