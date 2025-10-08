# RESTful設計の自由度: tRPC OpenAPI vs Hono OpenAPI

## 具体的な比較

### 1. HTTPステータスコードの制御

#### tRPC OpenAPI (制約あり)
```typescript
// apps/api-trpc-openapi/src/trpc/routers/workspace.ts:88-105
delete: rlsProtectedProcedure
  .meta({ openapi: { method: "DELETE", path: "/workspaces/{id}" } })
  .output(workspaceSchema)  // ❌ 常に200成功時のみ定義
  .mutation(async ({ ctx: { db }, input: { id } }) => {
    return await db
      .deleteFrom("Workspace")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();  // ❌ エラー時はtRPCのエラーフォーマット
  }),
```

**問題点:**
- 404エラーを明示的に定義できない
- 削除成功時も削除したオブジェクトを返す必要がある（RESTでは204 No Contentが適切）
- エラーレスポンスがtRPC形式に固定される

#### Hono OpenAPI (自由)
```typescript
// apps/api-hono/src/routes/workspaces.route.ts:134-162
export const deleteWorkspaceRoute = createRoute({
  method: "delete",
  path: "/workspaces/{id}",
  responses: {
    200: {  // ✅ 成功レスポンスを明示
      schema: successSchema,
      description: "Workspace deleted successfully",
    },
    404: {  // ✅ 404を明示的に定義
      schema: errorSchema,
      description: "Workspace not found",
    },
  },
});

// ハンドラーで柔軟に制御
export const deleteWorkspaceHandler = async (c) => {
  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);  // ✅ 明示的に404
  }
  return c.json({ success: true }, 200);  // ✅ 軽量なレスポンス
};
```

**メリット:**
- 各ステータスコードを明示的に定義・ドキュメント化
- RESTベストプラクティスに従える（204, 201, 404など）
- エラーレスポンスの形式を自由に設計

---

### 2. レスポンス形式の柔軟性

#### tRPC OpenAPI (制約あり)
```typescript
// tRPCでは全エンドポイントが同じ形式
// 成功時: output()で定義したデータ
// エラー時:
{
  "error": {
    "json": {
      "message": "Error message",
      "code": "TRPC_ERROR_CODE",
      "data": {...}
    }
  }
}
```

**問題点:**
- エラー形式が固定（RFC 7807 Problem Detailsなど採用できない）
- 成功時のラッパー構造を変更できない
- ページネーション、ハイパーメディア対応が困難

#### Hono OpenAPI (自由)
```typescript
// 成功レスポンスを自由に設計
return c.json({
  data: workspaces,
  meta: {
    total: 100,
    page: 1,
    perPage: 20,
  },
  links: {
    self: "/workspaces?page=1",
    next: "/workspaces?page=2",
  }
}, 200);

// RFC 7807 Problem Details準拠のエラー
return c.json({
  type: "https://api.example.com/errors/workspace-not-found",
  title: "Workspace Not Found",
  status: 404,
  detail: "The workspace with ID 123 does not exist",
  instance: "/workspaces/123"
}, 404);
```

---

### 3. 複雑なパスパラメータ構造

#### tRPC OpenAPI (制約あり)
```typescript
// ネストしたリソース構造が難しい
// /workspaces/{workspaceId}/sites/{siteId} のような構造を作りにくい

// tRPCでは inputに全て含める必要がある
getSite: procedure
  .input(z.object({
    workspaceId: z.number(),
    siteId: z.number(),
  }))
  .meta({
    openapi: {
      path: "/workspaces/{workspaceId}/sites/{siteId}"  // パスと入力の対応が冗長
    }
  })
```

**問題点:**
- パスパラメータとボディの区別が曖昧
- RESTfulなネスト構造（親子関係）の表現が難しい
- inputに全パラメータを含めるため冗長

#### Hono OpenAPI (自由)
```typescript
// apps/api-hono/src/routes/workspaces.route.ts:286-313
export const getWorkspacePathRoute = createRoute({
  method: "get",
  path: "/{tenant}/workspaces/{id}",  // ✅ ネストした構造を自然に表現
  request: {
    params: workspacePathIdParam,  // ✅ パラメータを明示的に定義
  },
});

// さらに複雑な構造も簡単
createRoute({
  path: "/{tenant}/workspaces/{workspaceId}/sites/{siteId}/settings",
  // ...
});
```

---

### 4. リクエストバリデーションの詳細制御

#### tRPC OpenAPI (制約あり)
```typescript
// inputで全て定義する必要がある
update: procedure
  .input(z.object({
    id: z.number(),           // ❌ パスパラメータもボディも同じ場所
    name: z.string().optional(),
    slug: z.string().optional(),
  }))
```

**問題点:**
- パスパラメータ、クエリ、ボディの区別が不明確
- OpenAPIドキュメントで正確に表現されない可能性

#### Hono OpenAPI (自由)
```typescript
// apps/api-hono/src/routes/workspaces.route.ts:96-131
export const updateWorkspaceRoute = createRoute({
  request: {
    headers: tenantHeader,           // ✅ ヘッダー
    params: workspaceIdParam,        // ✅ パスパラメータ
    body: {                          // ✅ ボディ
      content: {
        "application/json": {
          schema: createWorkspaceSchema,
        },
      },
    },
  },
});
```

**メリット:**
- ヘッダー、パスパラメータ、クエリ、ボディを明確に分離
- OpenAPIドキュメントが正確
- バリデーションエラーメッセージが明確

---

### 5. ページネーション対応

#### tRPC OpenAPI (制約あり)
```typescript
// カーソルベースページネーション（tRPC方式）は可能だが、
// オフセットベースの標準的なREST APIパターンが難しい

list: procedure
  .input(z.object({
    cursor: z.number().optional(),
    limit: z.number().optional(),
  }))
  .output(z.object({
    items: z.array(workspaceSchema),
    nextCursor: z.number().optional(),
  }))
```

**問題点:**
- `?page=2&per_page=20` のような標準的なクエリパラメータ表現が難しい
- Link ヘッダー（RFC 5988）を返せない
- HAL/JSON:APIなどのハイパーメディア形式に対応できない

#### Hono OpenAPI (自由)
```typescript
export const listWorkspacesRoute = createRoute({
  request: {
    query: z.object({
      page: z.coerce.number().min(1).default(1),
      per_page: z.coerce.number().min(1).max(100).default(20),
      sort: z.enum(['name', 'created_at']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }),
  },
  responses: {
    200: {
      headers: {
        'Link': {  // ✅ Linkヘッダーを明示的に定義
          schema: { type: 'string' }
        }
      },
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(workspaceSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              per_page: z.number(),
            }),
            links: z.object({
              self: z.string(),
              first: z.string(),
              last: z.string(),
              prev: z.string().nullable(),
              next: z.string().nullable(),
            }),
          }),
        },
      },
    },
  },
});

// ハンドラーで柔軟に実装
export const listWorkspacesHandler = async (c) => {
  const { page, per_page } = c.req.valid('query');

  // Linkヘッダーを設定
  c.header('Link', buildLinkHeader({ page, per_page, total }));

  return c.json({
    data: workspaces,
    meta: { total, page, per_page },
    links: { /* ... */ }
  });
};
```

---

### 6. コンテンツネゴシエーション

#### tRPC OpenAPI (制約あり)
```typescript
// JSON形式のみ
// XML、CSV、Protobufなどの形式を返せない
```

**問題点:**
- `Accept: application/xml` に対応できない
- ファイルダウンロード（CSV、Excelなど）が困難
- GraphQL風のレスポンス形式変更ができない

#### Hono OpenAPI (自由)
```typescript
export const exportWorkspacesRoute = createRoute({
  responses: {
    200: {
      content: {
        'application/json': { schema: workspaceSchema },
        'text/csv': { schema: { type: 'string' } },         // ✅ CSV
        'application/xml': { schema: { type: 'string' } },  // ✅ XML
      },
    },
  },
});

export const exportWorkspacesHandler = async (c) => {
  const accept = c.req.header('Accept');

  if (accept?.includes('text/csv')) {
    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', 'attachment; filename=workspaces.csv');
    return c.body(convertToCSV(workspaces));
  }

  if (accept?.includes('application/xml')) {
    c.header('Content-Type', 'application/xml');
    return c.body(convertToXML(workspaces));
  }

  return c.json(workspaces);
};
```

---

### 7. HTTPヘッダーの制御

#### tRPC OpenAPI (制約あり)
```typescript
// レスポンスヘッダーを制御できない
// Cache-Control, ETag, Last-Modified などを設定できない
```

**問題点:**
- HTTPキャッシュ戦略を実装できない
- ETags/条件付きリクエストが使えない
- CORS、セキュリティヘッダーの細かい制御ができない

#### Hono OpenAPI (自由)
```typescript
export const getWorkspaceHandler = async (c) => {
  const workspace = await db.selectFrom('Workspace').selectAll().executeTakeFirst();

  if (!workspace) {
    return c.json({ error: 'Not found' }, 404);
  }

  // ✅ 柔軟なヘッダー制御
  c.header('Cache-Control', 'max-age=3600, must-revalidate');
  c.header('ETag', generateETag(workspace));
  c.header('Last-Modified', workspace.updatedAt.toUTCString());

  // 条件付きリクエストの処理
  const ifNoneMatch = c.req.header('If-None-Match');
  if (ifNoneMatch === generateETag(workspace)) {
    return c.body(null, 304);  // Not Modified
  }

  return c.json(workspace);
};
```

---

### 8. 特殊なエンドポイントパターン

#### tRPC OpenAPI (制約あり)
```typescript
// 以下のようなパターンが困難:
// - PATCH /workspaces/{id}/archive  (アクション型エンドポイント)
// - POST /workspaces/bulk-create     (バルク操作)
// - GET /workspaces/search           (検索専用)

// tRPCでは全て procedure名として表現する必要がある
workspaces: router({
  archive: procedure...    // /workspaces.archive?input={"id":1}
  bulkCreate: procedure... // /workspaces.bulkCreate?input={...}
  search: procedure...     // /workspaces.search?input={...}
})
```

**問題点:**
- RESTful URLパターンに従えない
- アクション指向のエンドポイント（`/archive`, `/activate`）が表現しづらい
- バッチ操作のURL設計が不自然

#### Hono OpenAPI (自由)
```typescript
// ✅ RESTfulなアクション型エンドポイント
export const archiveWorkspaceRoute = createRoute({
  method: 'patch',
  path: '/workspaces/{id}/archive',
  // ...
});

// ✅ バルク操作
export const bulkCreateWorkspacesRoute = createRoute({
  method: 'post',
  path: '/workspaces/bulk',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            workspaces: z.array(createWorkspaceSchema),
          }),
        },
      },
    },
  },
});

// ✅ 検索エンドポイント
export const searchWorkspacesRoute = createRoute({
  method: 'get',
  path: '/workspaces/search',
  request: {
    query: z.object({
      q: z.string(),
      filters: z.record(z.string()).optional(),
    }),
  },
});
```

---

## まとめ

### tRPC OpenAPIが適している場合
- TypeScriptクライアントのみ
- シンプルなCRUD操作
- 型安全性が最優先
- RESTful設計の厳密さは不要

### Hono OpenAPIが適している場合
- 外部API（マルチ言語クライアント）
- 複雑なRESTful設計が必要
- HTTPの機能をフル活用したい
- OpenAPI仕様を完全に制御したい
- ページネーション、キャッシュ、コンテンツネゴシエーションが必要

### 設計上の制約の本質

**tRPC OpenAPI:**
- RPC（Remote Procedure Call）パラダイム → REST APIに変換
- tRPCの「procedure」という概念がRESTの「resource」と合わない
- HTTPの豊富な機能を活用しづらい

**Hono OpenAPI:**
- 最初からREST/HTTP前提の設計
- OpenAPI First開発が可能
- HTTPプロトコルの全機能にアクセス可能
