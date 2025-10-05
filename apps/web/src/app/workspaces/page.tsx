import { WorkspaceList } from "./_presentation/workspace-list";
import { WorkspaceListProviders } from "./_presentation/workspace-list-providers";

export default function WorkspacesPage() {
  return (
    <WorkspaceListProviders>
      <main className="container mx-auto p-6">
        <WorkspaceList />
      </main>
    </WorkspaceListProviders>
  );
}
