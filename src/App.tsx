import { Suspense, lazy } from "react";
import { HashRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { DarkShell } from "./components/PageShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProgressProvider } from "./features/progress/ProgressProvider";
import { ReaderSettingsProvider } from "./features/reader-settings/ReaderSettingsProvider";
import { OverviewPage } from "./pages/OverviewPage";

// The overview is the entry point and stays in the main chunk; everything else —
// above all the markdown reader — is split off so it never blocks the first paint.
const LessonPage = lazy(() => import("./pages/LessonPage").then((m) => ({ default: m.LessonPage })));
const LessonsPage = lazy(() => import("./pages/LessonsPage").then((m) => ({ default: m.LessonsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const ReaderSettingsPage = lazy(() =>
  import("./pages/ReaderSettingsPage").then((m) => ({ default: m.ReaderSettingsPage })),
);
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const StatsPage = lazy(() => import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })));
const StoriesPage = lazy(() => import("./pages/StoriesPage").then((m) => ({ default: m.StoriesPage })));
const StoryPage = lazy(() => import("./pages/StoryPage").then((m) => ({ default: m.StoryPage })));

export function App() {
  return (
    <HashRouter>
      <ProgressProvider>
        <ReaderSettingsProvider>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/lessons" element={<LessonsPage />} />
                <Route path="/lessons/:id" element={<LessonPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/stories/:id" element={<StoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/reader" element={<ReaderSettingsPage />} />
                <Route path="/not-found" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/not-found" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ReaderSettingsProvider>
      </ProgressProvider>
    </HashRouter>
  );
}

function RouteFallback() {
  return <div className="app-background app-background--dark route-fallback" aria-busy="true" />;
}

function NotFoundPage() {
  return (
    <DarkShell className="not-found-shell">
      <div className="not-found">
        <p className="eyebrow">ОШИБКА</p>
        <h2>Страница не найдена</h2>
        <p>Вернитесь к обзору и продолжите чтение.</p>
        <Link className="primary-button" to="/">
          На главную
        </Link>
      </div>
    </DarkShell>
  );
}
