import { SiteList } from "./_presentation/site-list";
import { SiteListProviders } from "./_presentation/site-list-providers";

export default function SitesPage() {
  return (
    <SiteListProviders>
      <main className="container mx-auto p-6">
        <SiteList />
      </main>
    </SiteListProviders>
  );
}
