import "@vscode/codicons/dist/codicon.css";
import WorkspacePage from "@pages/workspace";
import { ThemeRoot } from "@app/providers/providers/theme";
import { QueryProvider } from "./providers/query";

export default function AppRoot() {
  return (
    <QueryProvider>
      <ThemeRoot>
        <WorkspacePage />
      </ThemeRoot>
    </QueryProvider>
  );
}
