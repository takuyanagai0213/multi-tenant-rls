# Cube.js マルチテナント実装計画書

## 概要

本計画書は、issue.mdの「データマネジメントレイヤー」セクションに基づき、**Cube Cloud**を使用したマルチテナント分析基盤の実装手順を定義する。

**前提条件**:
- Cube Cloudアカウントの作成
- データソース（PostgreSQL/BigQuery）へのアクセス権限
- マルチドメインまたはサブドメイン設定

## 目的

- **テナント分離の保証**: 複数テナント間のデータ完全分離をAPIレベルで強制
- **セキュリティコンテキストの自動適用**: クエリ書き換えによるテナントフィルタの自動注入
- **パフォーマンス最適化**: Pre-aggregationsによるテナント別キャッシュ
- **透過的なアクセス制御**: フロントエンドはテナント識別を意識不要

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - HTTPクライアント（fetch/axios）                           │
│  - Host ヘッダーでテナント識別                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Custom API Server (tRPC)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ テナント識別                                            │  │
│  │ - リクエストから Host ヘッダー取得                      │  │
│  │ - getTenantFromHost(host) → ACME_CORP                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                              ↓                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Cube Cloud HTTP APIリクエスト                          │  │
│  │ - POST /cubejs-api/v1/load                            │  │
│  │ - セキュリティコンテキストをペイロードに埋め込み         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Cube Cloud                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ セキュリティコンテキスト抽出                            │  │
│  │ - リクエストボディからテナント取得                      │  │
│  │ - securityContext: { tenant: 'ACME_CORP' }           │  │
│  └───────────────────────────────────────────────────────┘  │
│                              ↓                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ クエリ書き換え (queryRewrite)                          │  │
│  │ - テナントフィルタの自動注入                            │  │
│  │ - WHERE tenant = 'ACME_CORP'                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                              ↓                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Pre-aggregations (テナント別キャッシュ)                │  │
│  │ - contextToAppId でテナント別に分離                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     BigQuery / PostgreSQL                   │
│  - RLSによる物理的データ分離                                 │
│  - テナントカラムでのCLUSTERING                              │
└─────────────────────────────────────────────────────────────┘
```

## セキュリティ要件

| 要件                     | 実装方法                                     | 保証レベル         |
| ------------------------ | -------------------------------------------- | ------------------ |
| **テナント境界の厳格化** | queryRewriteでの自動フィルタ注入       | ✅ API レベル強制 |
| **認証・認可**           | ドメインベーステナント判定             | ✅ ホストヘッダー |
| **クエリ改ざん防止**     | フロントエンドからのテナント指定を無視 | ✅ サーバー側強制 |
| **二重防御**             | Cube.js + データソース側RLS            | ✅ 多層防御       |

## 実装手順

### 1. Cube Cloudプロジェクトセットアップ

#### Cube Cloudプロジェクト作成

1. **Cube Cloudアカウント作成**
   - https://cubecloud.dev にアクセス
   - アカウント登録（GitHub/Google OAuth推奨）

2. **新規Deploymentの作成**
   - Deployment名: `multi-tenant-analytics`
   - Region: 最寄りのリージョンを選択（例: `us-east-1`, `ap-northeast-1`）
   - データソース: PostgreSQL または BigQuery

3. **データソース接続設定**
   ```
   # PostgreSQLの場合
   Database Type: PostgreSQL
   Host: your-db-host.com
   Port: 5432
   Database: production_db
   User: postgres
   Password: [secure_password]
   SSL: Enabled (推奨)
   ```

#### ローカル開発環境セットアップ

```bash
# packages配下にCube.jsプロジェクト作成
cd packages
npx cubejs-cli create cubejs -d postgres

cd cubejs
```

#### Cube Cloud環境変数設定

Cube Cloudコンソール > Settings > Environment Variables で以下を設定:

```bash
# データベース接続（Cube Cloudが自動設定）
CUBEJS_DB_TYPE=postgres
CUBEJS_DB_HOST=your-db-host.com
CUBEJS_DB_PORT=5432
CUBEJS_DB_NAME=production_db
CUBEJS_DB_USER=postgres
CUBEJS_DB_PASS=[secure_password]
```

#### ディレクトリ構造

```
packages/cubejs/
├── cube.ts                 # Cube.js設定ファイル（Cube Cloud側）
├── schema/                 # データスキーマ定義
│   ├── Workspaces.yml      # ワークスペース
│   └── Sites.yml           # サイト
├── src/                    # Custom API Server用
│   └── client.ts           # Cube Cloud HTTP APIクライアント
├── auth/                   # テナント識別モジュール
│   └── tenantConfig.ts     # ドメインベーステナント判定
├── .cuberc                 # Cube Cloud連携設定
├── .env.development        # ローカル開発用環境変数
├── package.json
└── tsconfig.json           # TypeScript設定
```

#### TypeScript設定

**ファイル**: `packages/cubejs/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### package.json

**ファイル**: `packages/cubejs/package.json`

```json
{
  "name": "@repo/cubejs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "cubejs-dev-server",
    "build": "tsc",
    "deploy": "cubejs deploy"
  },
  "dependencies": {
    "@cubejs-backend/postgres-driver": "^0.35.0",
    "@cubejs-backend/server-core": "^0.35.0",
    "@repo/kysely-prisma-database": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

### 2. テナント識別実装

#### テナント設定ファイル

**ファイル**: `packages/cubejs/auth/tenantConfig.ts`

```typescript
import type { Tenant } from '@repo/kysely-prisma-database';

/**
 * ドメインとテナントのマッピング
 * apps/web/src/config/tenant-config.ts と同じ設定
 */
const DOMAIN_MAPPING: Record<string, Tenant> = {
  'acme.example.com': 'ACME_CORP',
  'globex.example.com': 'GLOBEX_INC',
  'wayne.example.com': 'WAYNE_ENTERPRISES',
  'stark.example.com': 'STARK_INDUSTRIES',
  'localhost': 'ACME_CORP', // 開発環境用
};

/**
 * リクエストのホスト名からテナントを判定
 */
export function getTenantFromHost(host: string): Tenant | null {
  // ポート番号を除去
  const hostname = host.split(':')[0];
  return DOMAIN_MAPPING[hostname] ?? null;
}

export interface SecurityContext {
  tenant: Tenant;
  host: string;
}

/**
 * HTTPリクエストからセキュリティコンテキストを構築
 */
export function buildSecurityContext(req: any): SecurityContext | null {
  const host = req.headers.host || req.headers.origin;

  if (!host) {
    console.error('Host header not found in request');
    return null;
  }

  const tenant = getTenantFromHost(host);

  if (!tenant) {
    console.error('Failed to determine tenant for host:', host);
    return null;
  }

  return {
    tenant,
    host,
  };
}
```

---

### 3. Cube Cloud HTTP API統合（Custom API Server）

Cube Cloudはフロントエンドから直接アクセスするのではなく、**Custom API Server（tRPC）経由**でアクセスします。これにより、サーバー側でテナント判定とセキュリティ制御を行います。

#### Cube Cloud APIクライアント

**ファイル**: `packages/cubejs/src/client.ts`

```typescript
import type { Tenant } from '@repo/kysely-prisma-database';

export interface CubeQuery {
  measures?: string[];
  dimensions?: string[];
  timeDimensions?: Array<{
    dimension: string;
    granularity?: string;
    dateRange?: string | string[];
  }>;
  filters?: Array<{
    member: string;
    operator: string;
    values: string[];
  }>;
  limit?: number;
  offset?: number;
}

export interface CubeLoadOptions {
  tenant: Tenant;
  query: CubeQuery;
}

/**
 * Cube Cloud HTTP APIクライアント
 */
export class CubeCloudClient {
  private apiUrl: string;
  private apiSecret: string;

  constructor() {
    this.apiUrl = process.env.CUBE_CLOUD_API_URL || '';
    this.apiSecret = process.env.CUBE_CLOUD_API_SECRET || '';

    if (!this.apiUrl || !this.apiSecret) {
      throw new Error('CUBE_CLOUD_API_URL and CUBE_CLOUD_API_SECRET are required');
    }
  }

  /**
   * Cube Cloudにクエリを送信
   */
  async load(options: CubeLoadOptions): Promise<any> {
    const { tenant, query } = options;

    // セキュリティコンテキストをクエリに埋め込み
    const payload = {
      query,
      // Cube Cloudのcube.tsでこの値を使用してテナント識別
      securityContext: {
        tenant,
      },
    };

    const response = await fetch(`${this.apiUrl}/cubejs-api/v1/load`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cube Cloud API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * メタ情報を取得
   */
  async meta(tenant: Tenant): Promise<any> {
    const response = await fetch(`${this.apiUrl}/cubejs-api/v1/meta`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Cube Cloud meta API error: ${response.status}`);
    }

    return response.json();
  }
}
```

#### tRPC API実装

**ファイル**: `apps/api-trpc/src/router/analytics.ts`

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { CubeCloudClient } from '@repo/cubejs/src/client';
import { getTenantFromHost } from '@repo/cubejs/auth/tenantConfig';

const cubeClient = new CubeCloudClient();

export const analyticsRouter = router({
  /**
   * ワークスペース数を取得
   */
  getWorkspaceCount: protectedProcedure
    .input(
      z.object({
        dateRange: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // リクエストヘッダーからテナント判定
      const host = ctx.req.headers.host || '';
      const tenant = getTenantFromHost(host);

      if (!tenant) {
        throw new Error('Unable to determine tenant');
      }

      // Cube Cloud APIにクエリ送信
      const result = await cubeClient.load({
        tenant,
        query: {
          measures: ['Workspace.count'],
          timeDimensions: input.dateRange
            ? [
                {
                  dimension: 'Workspace.createdAt',
                  dateRange: input.dateRange,
                },
              ]
            : undefined,
        },
      });

      return result;
    }),

  /**
   * サイト別の集計
   */
  getSitesByWorkspace: protectedProcedure
    .input(
      z.object({
        workspaceId: z.number().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const host = ctx.req.headers.host || '';
      const tenant = getTenantFromHost(host);

      if (!tenant) {
        throw new Error('Unable to determine tenant');
      }

      const result = await cubeClient.load({
        tenant,
        query: {
          measures: ['Site.count'],
          dimensions: ['Site.name', 'Workspace.name'],
          filters: input.workspaceId
            ? [
                {
                  member: 'Site.workspaceId',
                  operator: 'equals',
                  values: [input.workspaceId.toString()],
                },
              ]
            : undefined,
          limit: input.limit,
        },
      });

      return result;
    }),
});
```

#### Cube.js設定ファイル（Cube Cloud側）

Cube Cloud側では、リクエストボディの`securityContext`からテナントを取得します。

**ファイル**: `packages/cubejs/cube.ts`

```typescript
import type { SecurityContext } from './auth/tenantConfig';

export default {
  // ===========================
  // セキュリティコンテキスト
  // ===========================

  /**
   * リクエストボディからセキュリティコンテキストを抽出
   * Custom API Server（tRPC）がテナント情報を埋め込んでいる
   */
  contextToAppId: ({ securityContext }: { securityContext: SecurityContext }): string => {
    return `CUBEJS_APP_${securityContext.tenant}`;
  },

  // ===========================
  // クエリ書き換え（テナントフィルタ自動注入）
  // ===========================

  /**
   * すべてのクエリに対してテナントフィルタを強制注入
   */
  queryRewrite: (query: any, { securityContext }: { securityContext: SecurityContext }) => {
    // セキュリティコンテキストの必須チェック
    if (!securityContext?.tenant) {
      throw new Error('Security context missing tenant');
    }

    // テナントフィルタを自動追加
    query.filters = query.filters || [];

    // フロントエンドからのテナント指定を無視（セキュリティ）
    query.filters = query.filters.filter(
      (filter: any) => !filter.member?.endsWith('.tenant')
    );

    // サーバー側でテナントを強制（Workspaces.tenant, Sites.tenant等に適用）
    const tenantFilter = {
      member: 'Workspace.tenant',
      operator: 'equals',
      values: [securityContext.tenant],
    };

    query.filters.push(tenantFilter);

    return query;
  },

  // ===========================
  // データベース接続設定
  // ===========================

  driverFactory: () => {
    const { PostgresDriver } = require('@cubejs-backend/postgres-driver');

    return new PostgresDriver({
      database: process.env.CUBEJS_DB_NAME,
      host: process.env.CUBEJS_DB_HOST,
      port: Number(process.env.CUBEJS_DB_PORT),
      user: process.env.CUBEJS_DB_USER,
      password: process.env.CUBEJS_DB_PASS,
    });
  },

  // ===========================
  // RLS統合（オプション）
  // ===========================

  /**
   * クエリ実行前にPostgreSQLセッション変数を設定
   */
  extendContext: async (cubeContext: any) => {
    const { securityContext } = cubeContext;

    if (securityContext?.tenant) {
      // PostgreSQL RLSのセッション変数を設定
      await cubeContext.dataSource.query(
        `SET LOCAL app.current_tenant = '${securityContext.tenant}'`
      );
    }

    return cubeContext;
  },
};
```

---

### 4. データスキーマ定義

#### イベントデータスキーマ

**ファイル**: `packages/cubejs/schema/Events.yml`

```yaml
cubes:
  - name: Events
    sql: >
      SELECT * FROM events
      WHERE tenant = {SECURITY_CONTEXT.tenant}

    joins:
      - name: MediaProperty
        sql: "{Events}.media_property_id = {MediaProperty}.id"
        relationship: many_to_one

      - name: Program
        sql: "{Events}.program_id = {Program}.id"
        relationship: many_to_one

    dimensions:
      - name: id
        sql: id
        type: string
        primary_key: true

      - name: tenant
        sql: tenant
        type: string

      - name: event_type
        sql: event_type
        type: string

      - name: timestamp
        sql: timestamp
        type: time

      - name: user_id
        sql: user_id
        type: string

      - name: media_property_id
        sql: media_property_id
        type: number

      - name: program_id
        sql: program_id
        type: number

    measures:
      - name: count
        type: count

      - name: unique_users
        sql: user_id
        type: count_distinct

    pre_aggregations:
      - name: main
        measures:
          - count
          - unique_users
        dimensions:
          - tenant
          - event_type
        time_dimension: timestamp
        granularity: day
        partition_granularity: month
        refresh_key:
          every: 1 hour
          incremental: true
          update_window: 7 day
```

#### ワークスペーススキーマ

**ファイル**: `packages/cubejs/schema/Workspaces.yml`

```yaml
cubes:
  - name: AdvertiserWorkspace
    sql: >
      SELECT * FROM advertiser_workspace
      WHERE tenant = {SECURITY_CONTEXT.tenant}

    dimensions:
      - name: id
        sql: id
        type: number
        primary_key: true

      - name: name
        sql: name
        type: string

      - name: slug
        sql: slug
        type: string

      - name: tenant
        sql: tenant
        type: string

    measures:
      - name: count
        type: count

  - name: MediaWorkspace
    sql: >
      SELECT * FROM media_workspace
      WHERE tenant = {SECURITY_CONTEXT.tenant}

    dimensions:
      - name: id
        sql: id
        type: number
        primary_key: true

      - name: name
        sql: name
        type: string

      - name: slug
        sql: slug
        type: string

      - name: tenant
        sql: tenant
        type: string

    measures:
      - name: count
        type: count
```

#### サイトスキーマ

**ファイル**: `packages/cubejs/schema/Sites.yml`

```yaml
cubes:
  - name: Site
    sql: >
      SELECT * FROM site
      WHERE tenant = {SECURITY_CONTEXT.tenant}

    joins:
      - name: Workspace
        sql: "{Site}.workspace_id = {Workspace}.id"
        relationship: many_to_one

    dimensions:
      - name: id
        sql: id
        type: number
        primary_key: true

      - name: name
        sql: name
        type: string

      - name: description
        sql: description
        type: string

      - name: tenant
        sql: tenant
        type: string

      - name: workspace_id
        sql: workspace_id
        type: number

    measures:
      - name: count
        type: count
```

---

### 5. フロントエンド統合

フロントエンドはCube Cloudに直接アクセスせず、tRPC経由でアクセスします。

#### tRPCフック

**ファイル**: `apps/web/src/hooks/useAnalytics.ts`

```typescript
import { trpc } from '@/lib/trpc';

export function useWorkspaceCount(dateRange?: string) {
  return trpc.analytics.getWorkspaceCount.useQuery({
    dateRange,
  });
}

export function useSitesByWorkspace(workspaceId?: number, limit = 10) {
  return trpc.analytics.getSitesByWorkspace.useQuery({
    workspaceId,
    limit,
  });
}
```

#### 使用例: ダッシュボードコンポーネント

**ファイル**: `apps/web/src/components/analytics/Dashboard.tsx`

```typescript
'use client';

import { useWorkspaceCount, useSitesByWorkspace } from '@/hooks/useAnalytics';
import { BarChart } from '@/components/ui/chart';

export function Dashboard() {
  // tRPC経由でCube Cloudからデータ取得
  const { data: workspaceData, isLoading: workspaceLoading } = useWorkspaceCount('Last 30 days');
  const { data: siteData, isLoading: siteLoading } = useSitesByWorkspace();

  if (workspaceLoading || siteLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Workspace Analytics</h2>
        <div className="mt-4">
          <p className="text-4xl font-bold">
            {workspaceData?.data[0]?.['Workspace.count'] || 0}
          </p>
          <p className="text-sm text-gray-500">Total Workspaces</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Sites by Workspace</h2>
        <div className="mt-4">
          {siteData?.data.map((item: any, index: number) => (
            <div key={index} className="flex justify-between py-2 border-b">
              <span>{item['Site.name']}</span>
              <span className="font-semibold">{item['Site.count']}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 6. テスト・検証

#### セキュリティテスト

**テストシナリオ**:

1. **テナント分離検証**
   - ACME_CORPユーザーがGLOBEX_INCデータにアクセスできないことを確認
   - 不正なテナントフィルタを注入した場合にエラーになることを確認

2. **認証テスト**
   - 無効なトークンでのアクセス拒否
   - organizationId未設定トークンの拒否

3. **クエリ改ざん防止**
   - フロントエンドからのテナント指定が無視されることを確認

**テストコード例**: `packages/cubejs/tests/security.test.ts`

```typescript
import { getTenantFromHost, buildSecurityContext } from '../auth/tenantConfig';

describe('Tenant Identification', () => {
  it('should extract tenant from host', () => {
    expect(getTenantFromHost('acme.example.com')).toBe('ACME_CORP');
    expect(getTenantFromHost('globex.example.com')).toBe('GLOBEX_INC');
    expect(getTenantFromHost('localhost:3000')).toBe('ACME_CORP');
  });

  it('should return null for unknown host', () => {
    expect(getTenantFromHost('unknown.example.com')).toBeNull();
  });

  it('should build security context from request', () => {
    const mockReq = {
      headers: { host: 'acme.example.com' },
    };

    const context = buildSecurityContext(mockReq);
    expect(context?.tenant).toBe('ACME_CORP');
    expect(context?.host).toBe('acme.example.com');
  });

  it('should return null when host header is missing', () => {
    const mockReq = {
      headers: {},
    };

    const context = buildSecurityContext(mockReq);
    expect(context).toBeNull();
  });
});
```

#### パフォーマンステスト

**検証項目**:

- Pre-aggregationsのキャッシュヒット率（目標: 90%以上）
- クエリレスポンスタイム（目標: 500ms以下）
- 同時接続数（目標: 100ユーザー）

**ツール**: Apache JMeter / k6

```javascript
// k6テストスクリプト例
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100, // 100同時ユーザー
  duration: '5m',
};

export default function () {
  const payload = JSON.stringify({
    query: {
      measures: ['Events.count'],
      timeDimensions: [
        {
          dimension: 'Events.timestamp',
          granularity: 'day',
          dateRange: 'Last 7 days',
        },
      ],
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_TOKEN}`,
    },
  };

  const res = http.post('http://localhost:4000/cubejs-api/v1/load', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

### 7. Cube Cloudデプロイ・運用

#### Cube Cloudへのデプロイ

**デプロイ方法**:

1. **Git統合によるデプロイ（推奨）**
   ```bash
   # packages/cubejsディレクトリをコミット
   cd packages/cubejs
   git add .
   git commit -m "Add Cube.js multi-tenant setup"
   git push origin main

   # Cube Cloudコンソールでリポジトリ連携
   # Settings > Git Integration > Connect GitHub Repository
   # Root Path: packages/cubejs を指定
   ```

2. **手動デプロイ**
   ```bash
   # Cube CLIでデプロイ
   npx cubejs-cli deploy --token YOUR_CUBE_CLOUD_TOKEN
   ```

3. **自動デプロイ設定**
   - Cube Cloudは `main` ブランチへのpushで自動デプロイ
   - Production環境とDevelopment環境の分離が可能

#### 監視・アラート

**Cube Cloud組み込み監視機能**:

Cube Cloudコンソール > Monitoring で以下を確認:

- **クエリパフォーマンス**: クエリ実行時間の推移
- **キャッシュ効率**: Pre-aggregationsのヒット率
- **エラーログ**: クエリエラー、認証エラーの詳細
- **使用状況**: API呼び出し数、データ転送量

**アラート設定**:

Cube Cloudコンソール > Alerts で設定:

- クエリエラー率が1%を超えた場合にSlack通知
- レスポンスタイムP95が500msを超えた場合に通知
- Pre-aggregations更新失敗時に通知

**外部監視ツール統合（オプション）**:

- Datadog APM: Cube CloudのAPIエンドポイント監視
- Sentry: エラートラッキング
- Custom Webhooks: アラート通知の転送

---

## 実装チェックリスト

- [ ] Cube Cloudアカウントの作成
- [ ] Deploymentの作成とデータソース接続
- [ ] ローカル開発環境のセットアップ
- [ ] Cube Cloud環境変数の設定
- [ ] テナント設定ファイルの実装（ドメインマッピング）
- [ ] cube.jsメイン設定ファイルの実装
- [ ] queryRewriteでのテナントフィルタ自動注入
- [ ] contextToAppIdでのキャッシュ分離
- [ ] Workspaces.ymlの作成
- [ ] Sites.ymlの作成
- [ ] React Cube.jsクライアントの実装
- [ ] サンプルコンポーネントの作成
- [ ] セキュリティテストの実施
- [ ] Cube CloudへのGit統合設定
- [ ] Production環境へのデプロイ

---

## リスク・課題

| リスク                           | 影響度 | 対策                                          |
| -------------------------------- | ------ | --------------------------------------------- |
| **RLS統合の複雑性**              | 高     | Phase 3でextendContextを使用してSET LOCAL実行 |
| **Pre-aggregationsのメモリ消費** | 中     | テナント別にキャッシュサイズを制限            |
| **クエリパフォーマンス低下**     | 中     | BigQuery CLUSTERINGとPre-aggregationsで最適化 |
| **認証トークンの有効期限**       | 低     | Clerkトークンのリフレッシュロジックを実装     |

---

## 次のステップ

1. **Cube Cloudアカウント作成**: https://cubecloud.dev で登録
2. **Deploymentセットアップ**: データソース接続の確認
3. **ローカル開発開始**: `cd packages && npx cubejs-cli create cubejs -d postgres`
4. **テナント設定実装**: `auth/tenantConfig.js` でドメインマッピング設定
5. **スキーマ定義**: Workspaces/Sitesキューブから開始

---

## 参考資料

### Cube Cloud
- [Cube Cloud公式サイト](https://cubecloud.dev)
- [Cube Cloud Documentation](https://cube.dev/docs/cloud)
- [Cube.js Security Context](https://cube.dev/docs/security/context)
- [Cube.js Multi-tenancy](https://cube.dev/docs/multitenancy)
- [Cube Cloud Deployment](https://cube.dev/docs/cloud/deployments)

### セキュリティ
- [PostgreSQL RLS - 公式ドキュメント](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Next.js Middleware - 公式ドキュメント](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### Cube Cloud料金
- [Cube Cloud Pricing](https://cube.dev/pricing) - 無料枠: 1,000 queries/day, 1GB cache
