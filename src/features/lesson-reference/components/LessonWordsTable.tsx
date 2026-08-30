import { useTranslation } from "react-i18next";
import { lessonReferenceWords } from "@/lib/content";
import type { LessonReferenceWord } from "@/lib/content.types";

interface LessonWordRow {
  key: string;
  word: string;
  pronunciation: string;
  meaning: string;
  noun?: boolean;
  plural?: boolean;
}

function getWordRows(
  lessonId: string,
  genderLabel: (gender: NonNullable<LessonReferenceWord["noun"]>["gender"]) => string,
  pluralLabel: (word: string) => string,
) {
  const words = lessonReferenceWords.filter((word) => word.lessonId === lessonId);
  return words.flatMap<LessonWordRow>((word) => {
    const rows: LessonWordRow[] = [
      {
        key: `${word.lessonId}:${word.order}`,
        word: word.noun ? `${word.word} (${genderLabel(word.noun.gender)})` : word.word,
        pronunciation: word.pronunciation,
        meaning: word.meaning,
        noun: Boolean(word.noun),
      },
    ];

    if (word.noun) {
      rows.push({
        key: `${word.lessonId}:${word.order}:plural`,
        word: word.noun.plural,
        pronunciation: word.noun.pluralPronunciation,
        meaning: pluralLabel(word.word),
        plural: true,
      });
    }

    return rows;
  });
}

export function LessonWordsTable({ lessonId }: { lessonId: string }) {
  const { t } = useTranslation();
  const rows = getWordRows(
    lessonId,
    (gender) => t(`cards.genderValues.${gender}`),
    (word) => t("lessonReference.wordsPluralOf", { word }),
  );

  return (
    <div className="lesson-reference-words">
      <div className="grammar-table-scroll" role="region" tabIndex={0} aria-label={t("lessonReference.wordsTable")}>
        <table className="reader-table">
          <thead>
            <tr>
              <th scope="col">{t("lessonReference.wordsRomanian")}</th>
              <th scope="col">{t("lessonReference.wordsPronunciation")}</th>
              <th scope="col">{t("lessonReference.wordsMeaning")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className={row.noun ? "lesson-reference-word-row--noun" : row.plural ? "lesson-reference-word-row--plural" : undefined}
              >
                <td>
                  <strong>{row.word}</strong>
                </td>
                <td>{row.pronunciation}</td>
                <td>{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
