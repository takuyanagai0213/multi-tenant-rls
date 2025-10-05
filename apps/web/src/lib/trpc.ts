import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../api-trpc/src/trpc/router";
import { getCurrentTenant } from "@/config/tenant";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Header-based client (default)
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${baseUrl}/trpc`,
      headers: () => {
        return {
          tenant: getCurrentTenant(),
        };
      },
    }),
  ],
});

// Path parameter-based client
export const trpcPath = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: (() => {
        return `${baseUrl}/${getCurrentTenant()}/trpc`;
      })(),
      headers: () => {
        // No tenant header needed when using path parameter
        return {};
      },
    }),
  ],
});
