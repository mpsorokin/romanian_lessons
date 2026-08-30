import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const lessonsDir = join(process.cwd(), "src", "content", "lessons");
const nounMetadataPath = join(process.cwd(), "src", "content", "cards", "nouns.json");
const outputDir = join(process.cwd(), "src", "generated");
const outputPath = join(outputDir, "cards.generated.ts");
const countPath = join(outputDir, "cards.count.ts");
const hashPath = join(outputDir, "cards.source-hash");
const GENERATOR_VERSION = "lesson-decks-v2";

const CYRILLIC = /[А-Яа-яЁё]/;
const ROMANIAN = /[A-Za-zĂÂÎȘȚăâîșț]/;
const VALID_GENDERS = new Set(["masculine", "feminine", "neuter"]);

function clean(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nounCardKey(lessonId, answerRo) {
  return `${lessonId}:${clean(answerRo).toLocaleLowerCase("ro-RO")}`;
}

const nounMetadataRaw = await readFile(nounMetadataPath, "utf8");
let nounMetadataRecords;
try {
  nounMetadataRecords = JSON.parse(nounMetadataRaw);
} catch (error) {
  throw new Error(`Invalid noun metadata JSON: ${error.message}`);
}
if (!Array.isArray(nounMetadataRecords)) throw new Error("Noun metadata must be a JSON array.");

const nounMetadataByCard = new Map();
for (const record of nounMetadataRecords) {
  if (!record || typeof record !== "object") throw new Error("Every noun metadata entry must be an object.");
  const requiredFields = ["lessonId", "answerRo", "lemma", "gender", "plural", "pluralPronunciation", "sourceUrl"];
  if (requiredFields.some((field) => typeof record[field] !== "string" || !record[field].trim())) {
    throw new Error(`Noun metadata entry is missing a required field: ${JSON.stringify(record)}.`);
  }
  if (!VALID_GENDERS.has(record.gender)) throw new Error(`Invalid noun gender for ${record.lessonId}/${record.answerRo}.`);
  if (!/^https:\/\//.test(record.sourceUrl)) throw new Error(`Noun source must use HTTPS for ${record.lessonId}/${record.answerRo}.`);

  const key = nounCardKey(record.lessonId, record.answerRo);
  if (nounMetadataByCard.has(key)) throw new Error(`Duplicate noun metadata for ${record.lessonId}/${record.answerRo}.`);
  nounMetadataByCard.set(key, {
    lemma: clean(record.lemma),
    gender: record.gender,
    plural: clean(record.plural),
    pluralPronunciation: clean(record.pluralPronunciation),
    sourceUrl: record.sourceUrl.trim(),
  });
}

function frontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error("Missing YAML frontmatter in lesson content.");
  const values = {};
  for (const line of match?.[1]?.split(/\r?\n/) ?? []) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }
  return values;
}

function boldOnly(line) {
  const match = line.trim().match(/^\*\*(.+?)\*\*\s*$/);
  return match ? clean(match[1]) : null;
}

function headingUnit(line) {
  const match = line.trim().match(/^#{2,4}\s+(?:\*\*(.+?)\*\*|`(.+?)`)(?:\s*[—-]\s*(.+))?\s*$/);
  if (!match) return null;
  return { answer: clean(match[1] ?? match[2]), prompt: match[3] ? clean(match[3]) : "" };
}

function nextMeaning(lines, start) {
  for (let index = start + 1; index < Math.min(lines.length, start + 5); index += 1) {
    const candidate = lines[index].trim();
    if (!candidate) continue;
    if (candidate.startsWith("#") || candidate.startsWith("|") || candidate.startsWith("---")) return "";
    const meaning = clean(candidate);
    if (CYRILLIC.test(meaning)) return meaning;
    return "";
  }
  return "";
}

function extractCards(raw, lessonId, expectedCount) {
  const lines = raw.split(/\r?\n/);
  const candidates = [];
  const seen = new Set();

  const add = (answer, pronunciation, prompt) => {
    const normalizedAnswer = clean(answer);
    const normalizedPronunciation = clean(pronunciation);
    const normalizedPrompt = clean(prompt);
    if (!normalizedAnswer || !normalizedPronunciation || !normalizedPrompt) return;
    if (/^(romanian|română|romana|română|formă|форма|кто|значение|произношение)$/i.test(normalizedAnswer)) return;
    if (!ROMANIAN.test(normalizedAnswer) || !CYRILLIC.test(normalizedPronunciation) || !CYRILLIC.test(normalizedPrompt)) return;
    const key = normalizedAnswer.toLocaleLowerCase("ru-RU");
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ answerRo: normalizedAnswer, pronunciation: normalizedPronunciation, promptRu: normalizedPrompt });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith("|") || !line.endsWith("|")) continue;
    const cells = line.slice(1, -1).split("|").map(clean);
    if (cells.length < 3 || cells.every((cell) => /^-+$/.test(cell))) continue;
    add(cells[0], cells[1], cells[2] ?? cells[3] ?? "");
  }

  for (let index = 0; index < lines.length - 1; index += 1) {
    const answer = boldOnly(lines[index]);
    const pronunciation = boldOnly(lines[index + 1]);
    if (!answer || !pronunciation) continue;
    add(answer, pronunciation, nextMeaning(lines, index + 1));
  }

  for (let index = 0; index < lines.length - 1; index += 1) {
    const unit = headingUnit(lines[index]);
    const pronunciation = boldOnly(lines[index + 1]);
    if (!unit || !pronunciation) continue;
    add(unit.answer, pronunciation, unit.prompt || nextMeaning(lines, index + 1));
  }

  if (candidates.length < expectedCount) {
    throw new Error(`${lessonId}: found ${candidates.length} usable cards, expected ${expectedCount}.`);
  }
  return candidates.slice(0, expectedCount).map((card, index) => ({
    id: `${lessonId}:card-${String(index + 1).padStart(2, "0")}`,
    lessonId,
    order: index + 1,
    ...card,
  }));
}

const fileNames = (await readdir(lessonsDir)).filter((file) => file.endsWith(".md")).sort();
const sourceHash = createHash("sha256");
sourceHash.update(`generator:${GENERATOR_VERSION}\0`);
sourceHash.update("noun-metadata\0");
sourceHash.update(nounMetadataRaw);
sourceHash.update("\0");
const lessons = [];
const cards = [];

for (const fileName of fileNames) {
  const raw = await readFile(join(lessonsDir, fileName), "utf8");
  sourceHash.update(fileName);
  sourceHash.update("\0");
  sourceHash.update(raw);
  sourceHash.update("\0");
  const meta = frontmatter(raw);
  const lesson = {
    id: meta.id,
    order: Number(meta.order),
    title: meta.title,
    wordCount: Number(meta.wordCount ?? 0),
  };
  if (!lesson.id || !Number.isFinite(lesson.order) || !Number.isFinite(lesson.wordCount)) {
    throw new Error(`Invalid lesson metadata in ${fileName}.`);
  }
  lessons.push(lesson);
  if (lesson.wordCount > 0) {
    const lessonCards = extractCards(raw, lesson.id, lesson.wordCount);
    for (const card of lessonCards) {
      const noun = nounMetadataByCard.get(nounCardKey(card.lessonId, card.answerRo));
      if (noun) card.noun = noun;
    }
    cards.push(...lessonCards);
  }
}

const generatedCardKeys = new Set(cards.map((card) => nounCardKey(card.lessonId, card.answerRo)));
for (const key of nounMetadataByCard.keys()) {
  if (!generatedCardKeys.has(key)) throw new Error(`Noun metadata does not match a generated card: ${key}.`);
}

const digest = sourceHash.digest("hex");

let previousHash = "";
try {
  previousHash = (await readFile(hashPath, "utf8")).trim();
} catch {
  // First run or missing hash file — regenerate.
}

if (previousHash === digest) {
  try {
    await readFile(outputPath, "utf8");
    const countSource = await readFile(countPath, "utf8");
    const countMatch = countSource.match(/export const generatedCardCount = (\d+)/);
    const count = countMatch?.[1] ?? "?";
    console.log(`Card source unchanged — skipped generate (${count} cards).`);
    process.exit(0);
  } catch {
    // Hash matched but outputs are missing — fall through and write.
  }
}

lessons.sort((a, b) => a.order - b.order);
const lessonOrder = new Map(lessons.map((lesson) => [lesson.id, lesson.order]));
cards.sort((a, b) => (lessonOrder.get(a.lessonId) ?? 0) - (lessonOrder.get(b.lessonId) ?? 0) || a.order - b.order);

const decks = lessons.filter((lesson) => lesson.wordCount > 0).map((lesson) => ({
  id: lesson.id,
  lessonId: lesson.id,
  kind: "lesson",
  sourceLessonIds: [lesson.id],
}));

const generatedOutput = `// Generated by scripts/generate-cards.mjs. Edit lesson Markdown or noun metadata, then run npm run generate:cards.\n\nexport interface GeneratedNounMetadata {\n  lemma: string;\n  gender: "masculine" | "feminine" | "neuter";\n  plural: string;\n  pluralPronunciation: string;\n  sourceUrl: string;\n}\n\nexport interface GeneratedStudyCard {\n  id: string;\n  lessonId: string;\n  order: number;\n  promptRu: string;\n  answerRo: string;\n  pronunciation: string;\n  noun?: GeneratedNounMetadata;\n}\n\nexport interface GeneratedCardDeck {\n  id: string;\n  lessonId: string;\n  kind: "lesson" | "recall";\n  sourceLessonIds: string[];\n}\n\nexport const generatedStudyCards: GeneratedStudyCard[] = ${JSON.stringify(cards, null, 2)};\n\nexport const generatedCardDecks: GeneratedCardDeck[] = ${JSON.stringify(decks, null, 2)};\n`;
const generatedOutputWithLessonDeckType = generatedOutput.replace(
  '  kind: "lesson" | "recall";',
  '  kind: "lesson";',
);

const countOutput = `// Generated by scripts/generate-cards.mjs. Edit lesson Markdown, then run npm run generate:cards.\n\nexport const generatedCardCount = ${cards.length};\n`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, generatedOutputWithLessonDeckType, "utf8");
await writeFile(countPath, countOutput, "utf8");
await writeFile(hashPath, digest, "utf8");
console.log(`Generated ${cards.length} cards for ${lessons.length} lessons at ${relative(process.cwd(), outputPath)}.`);
