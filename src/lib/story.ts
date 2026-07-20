export type StoryBeat = {
  number: number;
  prompt: string;
  paragraphs: string[];
  start: number;
  end: number;
};

export type StoryChapter = {
  number: number;
  numeral: string;
  title: string;
  shortTitle: string;
  id: string;
  start: number;
  beats: StoryBeat[];
};

export type ReadingChapter = {
  number: number;
  numeral: string;
  title: string;
  id: string;
  paragraphs: string[];
};

const words = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export function parseStoryMarkdown(
  raw: string,
  duration = 885.54,
  timings: ReadonlyArray<{ number: number; start: number; end: number; chapterStart?: number }> = [],
): StoryChapter[] {
  const chapters: StoryChapter[] = [];
  let chapter: StoryChapter | null = null;
  let beat: StoryBeat | null = null;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    const chapterMatch = line.match(/^## Chapter ([A-Za-z]+)\s*(?:—|:)\s*(.+)$/);
    if (chapterMatch) {
      const number = words.indexOf(chapterMatch[1]) + 1;
      chapter = {
        number,
        numeral: String(number),
        title: chapterMatch[2],
        shortTitle: chapterMatch[2].replace(/^The /, ""),
        id: `chapter-${number}-${slugify(chapterMatch[2])}`,
        start: 0,
        beats: [],
      };
      chapters.push(chapter);
      beat = null;
      continue;
    }

    const drawingMatch = line.match(/^\*\*Drawing (\d+) — \*\((.+)\)\*\*\*$/)
      ?? line.match(/^\*\(drawing (\d+):\s*(.+)\)\*$/i);
    if (drawingMatch && chapter) {
      beat = {
        number: Number(drawingMatch[1]),
        prompt: drawingMatch[2],
        paragraphs: [],
        start: 0,
        end: 0,
      };
      chapter.beats.push(beat);
      continue;
    }

    if (chapter && beat && line && line !== "---" && !line.startsWith("*Cover —")) {
      beat.paragraphs.push(line);
    }
  }

  const chapterWords = chapters.map((item) =>
    item.beats.reduce(
      (total, itemBeat) => total + itemBeat.paragraphs.reduce((sum, paragraph) => sum + wordCount(paragraph), 0),
      0,
    ),
  );
  const totalWords = chapterWords.reduce((sum, count) => sum + count, 0);
  let elapsedWords = 0;

  chapters.forEach((item, index) => {
    item.start = Math.round((elapsedWords / totalWords) * duration);
    elapsedWords += chapterWords[index];
  });

  if (timings.length) {
    const timingByNumber = new Map(timings.map((timing) => [timing.number, timing]));
    chapters.forEach((item) => {
      item.beats.forEach((itemBeat) => {
        const timing = timingByNumber.get(itemBeat.number);
        if (!timing) return;
        itemBeat.start = timing.start;
        itemBeat.end = timing.end;
      });
      const firstBeat = item.beats[0];
      const firstTiming = firstBeat ? timingByNumber.get(firstBeat.number) : undefined;
      item.start = firstTiming?.chapterStart ?? item.beats[0]?.start ?? item.start;
    });
  }

  return chapters;
}

export function parseReadingMarkdown(raw: string) {
  const chapters: ReadingChapter[] = [];
  const intro: string[] = [];
  let chapter: ReadingChapter | null = null;

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    const chapterMatch = line.match(/^### Chapter ([A-Za-z]+) — (.+)$/);
    if (chapterMatch) {
      const number = words.indexOf(chapterMatch[1]) + 1;
      chapter = {
        number,
        numeral: String(number),
        title: chapterMatch[2],
        id: `chapter-${number}-${slugify(chapterMatch[2])}`,
        paragraphs: [],
      };
      chapters.push(chapter);
      continue;
    }

    if (!line || line === "---" || line.startsWith("# ")) continue;
    if (chapter) chapter.paragraphs.push(line);
    else intro.push(line.replace(/^\*|\*$/g, ""));
  }

  return { intro, chapters };
}

export function inlineMarkdown(value: string) {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const renderInline = (fragment: string) => fragment
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const readingLead = escaped.match(/^\*\*(.+)\*\* — (.+)$/);
  if (readingLead) {
    return `<strong>${renderInline(readingLead[1])}</strong> — ${renderInline(readingLead[2])}`;
  }

  return renderInline(escaped).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
