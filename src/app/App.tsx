import { lazy } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Providers } from "@/app/Providers";
import { OverviewPage } from "@/pages/OverviewPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// The overview is the entry point and stays in the main chunk; everything else —
// above all the markdown reader — is split off so it never blocks the first paint.
const LessonPage = lazy(() => import("@/features/reading/pages/LessonPage").then((m) => ({ default: m.LessonPage })));
const LessonsPage = lazy(() => import("@/features/reading/pages/LessonsPage").then((m) => ({ default: m.LessonsPage })));
const StoriesPage = lazy(() => import("@/features/reading/pages/StoriesPage").then((m) => ({ default: m.StoriesPage })));
const StoryPage = lazy(() => import("@/features/reading/pages/StoryPage").then((m) => ({ default: m.StoryPage })));
const CardsPage = lazy(() => import("@/features/cards/pages/CardsPage").then((m) => ({ default: m.CardsPage })));
const CardDeckPage = lazy(() => import("@/features/cards/pages/CardDeckPage").then((m) => ({ default: m.CardDeckPage })));
const ReaderSettingsPage = lazy(() =>
  import("@/features/reader/pages/ReaderSettingsPage").then((m) => ({ default: m.ReaderSettingsPage })),
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const StatsPage = lazy(() => import("@/pages/StatsPage").then((m) => ({ default: m.StatsPage })));

export function App() {
  return (
    <HashRouter>
      <Providers>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/stories/:id" element={<StoryPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/cards/:deckId" element={<CardDeckPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/reader" element={<ReaderSettingsPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Providers>
    </HashRouter>
  );
}
