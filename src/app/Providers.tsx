import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { ProgressProvider } from "@/features/progress/ProgressProvider";
import { CardProgressProvider } from "@/features/cards/CardProgressProvider";
import { ReaderSettingsProvider } from "@/features/reader/ReaderSettingsProvider";

/** Route fallback: an empty shell in the app colour, so lazy chunks do not flash. */
function RouteFallback() {
  return <div className="app-background app-background--dark route-fallback" aria-busy="true" />;
}

/** Every cross-cutting provider, in one place so `App` stays a route table. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider>
      <CardProgressProvider>
        <ReaderSettingsProvider>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>{children}</Suspense>
          </ErrorBoundary>
        </ReaderSettingsProvider>
      </CardProgressProvider>
    </ProgressProvider>
  );
}
