import { lazy } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Providers } from "@/app/Providers";
import { OverviewPage } from "@/pages/OverviewPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// The overview is the entry point and stays in the main chunk; everything else —
// above all the markdown reader — is split off so it never blocks the first paint.
const LessonPage = lazy(() => import("@/features/reading/pages/LessonPage").then((m) => ({ default: m.LessonPage })));
const LessonsRefPage = lazy(() => import("@/features/lesson-reference/pages/LessonsRefPage").then((m) => ({ default: m.LessonsRefPage })));
const LessonReferenceArticlePage = lazy(() =>
  import("@/features/lesson-reference/pages/LessonReferenceArticlePage").then((m) => ({ default: m.LessonReferenceArticlePage })),
);
const StoryPage = lazy(() => import("@/features/reading/pages/StoryPage").then((m) => ({ default: m.StoryPage })));
const GrammarArticlePage = lazy(() => import("@/features/grammar/pages/GrammarArticlePage").then((m) => ({ default: m.GrammarArticlePage })));
const LibraryPage = lazy(() => import("@/pages/LibraryPage").then((m) => ({ default: m.LibraryPage })));
const CardsPage = lazy(() => import("@/features/cards/pages/CardsPage").then((m) => ({ default: m.CardsPage })));
const CardDeckPage = lazy(() => import("@/features/cards/pages/CardDeckPage").then((m) => ({ default: m.CardDeckPage })));
const ReaderSettingsPage = lazy(() =>
  import("@/features/reader/pages/ReaderSettingsPage").then((m) => ({ default: m.ReaderSettingsPage })),
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

export function App() {
  return (
    <HashRouter>
      <Providers>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:section" element={<LibraryPage />} />
          <Route path="/lessons" element={<Navigate to="/library/lessons" replace />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/lessons-ref" element={<LessonsRefPage />} />
          <Route path="/lessons-ref/:id" element={<LessonReferenceArticlePage />} />
          <Route path="/stories" element={<Navigate to="/library/stories" replace />} />
          <Route path="/stories/:id" element={<StoryPage />} />
          <Route path="/grammar" element={<Navigate to="/library/grammar" replace />} />
          <Route path="/grammar/:id" element={<GrammarArticlePage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/cards/:deckId" element={<CardDeckPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/stats" element={<Navigate to="/profile" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/reader" element={<ReaderSettingsPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Providers>
    </HashRouter>
  );
}
