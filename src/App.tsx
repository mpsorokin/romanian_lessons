import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { DarkShell } from "./components/PageShell";
import { ProgressProvider } from "./features/progress/ProgressProvider";
import { ReaderSettingsProvider } from "./features/reader-settings/ReaderSettingsProvider";
import { LessonPage } from "./pages/LessonPage";
import { LessonsPage } from "./pages/LessonsPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReaderSettingsPage } from "./pages/ReaderSettingsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { StoriesPage } from "./pages/StoriesPage";
import { StoryPage } from "./pages/StoryPage";
import { contentLoadError } from "./lib/content";

export function App() {
  return (
    <HashRouter>
      <ProgressProvider>
        <ReaderSettingsProvider>
          {contentLoadError ? <ContentErrorPage error={contentLoadError} /> : <Routes>
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
            </Routes>}
        </ReaderSettingsProvider>
      </ProgressProvider>
    </HashRouter>
  );
}

function ContentErrorPage({ error }: { error: Error }) {
  return <DarkShell title="Calea"><div className="not-found"><p className="eyebrow">ОШИБКА КОНТЕНТА</p><h2>Не удалось загрузить материалы</h2><p>Проверьте YAML frontmatter и Markdown в папке src/content.</p><code className="error-detail">{error.message}</code></div></DarkShell>;
}

function NotFoundPage() {
  return <DarkShell title="Calea"><div className="not-found"><p className="eyebrow">ОШИБКА</p><h2>Страница не найдена</h2><p>Вернитесь к обзору и продолжите чтение.</p><a className="primary-button" href="#/">На главную</a></div></DarkShell>;
}
