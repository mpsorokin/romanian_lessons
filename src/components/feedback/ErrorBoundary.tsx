import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "@/i18n";
import { NotFound } from "@/components/feedback/NotFound";

/**
 * After a redeploy the hashed chunk names change, so an old open tab asks for a
 * chunk that no longer exists. Reloading is the only useful recovery there.
 */
function isChunkLoadError(error: Error): boolean {
  return /dynamically imported module|importing a module script failed|chunkloaderror|failed to fetch/i.test(
    error.message,
  );
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Calea crashed while rendering.", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const stale = isChunkLoadError(error);
    return (
      <NotFound
        title={stale ? i18n.t("errors.appUpdated") : i18n.t("errors.somethingWrong")}
        description={
          stale ? i18n.t("errors.appUpdatedDescription") : i18n.t("errors.somethingWrongDescription")
        }
        action={{ label: i18n.t("errors.reload"), onClick: () => window.location.reload() }}
        detail={!stale && <code className="error-detail">{error.message}</code>}
      />
    );
  }
}
