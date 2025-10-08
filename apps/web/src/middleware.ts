import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTenantFromDomain } from "./config/tenant-config";

/**
 * Middleware: リクエストごとにテナントを判定し、ヘッダーに注入
 *
 * このMiddlewareにより、Server ComponentやAPI Routeで
 * headers().get('x-tenant') でテナント情報を取得できる
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const tenant = getTenantFromDomain(host);

  if (!tenant) {
    // テナントが判定できない場合は404
    return new NextResponse("Not Found", { status: 404 });
  }

  // リクエストヘッダーにテナント情報を注入
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant", tenant);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Middlewareを適用するパス
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
