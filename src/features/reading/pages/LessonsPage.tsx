import { AppShell } from "@/components/layout/AppShell";
import { LessonRow } from "@/features/reading/components/ContentRow";
import { lessonContent } from "@/lib/content";
import { useProgress } from "@/features/reading/useProgress";

export function LessonsPage() {
  const { getLessonStatus } = useProgress();
  return (
    <AppShell title="Уроки" showBack className="list-shell">
      <div className="list-intro"><p>{lessonContent.length} небольших уроков о языке и жизни в Румынии.</p></div>
      <div className="content-list">
        {lessonContent.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} status={getLessonStatus(lesson.id)} />)}
      </div>
    </AppShell>
  );
}
