import "./globals.css";
import { getTenant } from "@/lib/get-tenant";
import { getTenantConfig } from "@/config/tenant-config";

export const metadata = {
  title: "Multi-Tenant RLS Sample",
  description: "Row Level Security with Next.js and tRPC",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middlewareで注入されたテナント情報を取得
  const tenant = await getTenant();
  const config = getTenantConfig(tenant);

  return (
    <html lang="en" data-theme={config.branding.theme}>
      <head>
        <title>{config.branding.name}</title>
        <style>{`
          :root {
            --primary-color: ${config.branding.primaryColor};
          }
        `}</style>
      </head>
      <body className={config.branding.theme === "dark" ? "dark" : ""}>
        {children}
      </body>
    </html>
  );
}
