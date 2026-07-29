import type { StoryReaderConfig, StoryWordTimingBeat } from "./story-reader";

export type TimedWord = {
  start: number;
  end: number;
};

export type StoryHeadingTimings = {
  version: number;
  audioDuration: number;
  cover: {
    start: number;
    end: number;
    words: ReadonlyArray<TimedWord>;
  };
  chapters: ReadonlyArray<{
    number: number;
    transitionStart: number;
    start: number;
    end: number;
    labelWords: ReadonlyArray<TimedWord>;
    titleWords: ReadonlyArray<TimedWord>;
  }>;
};

export type StoryBeatTiming = {
  number: number;
  start: number;
  end: number;
  chapterStart?: number;
};

export type StoryWordTimings = {
  version: number;
  audioDuration: number;
  beats: ReadonlyArray<StoryWordTimingBeat>;
};

export type ChapterPalette = {
  wash: string;
  secondary: string;
  paper?: string;
  paperDeep?: string;
  line?: string;
  motif?: "orbit" | "stone" | "vessel" | "reflection" | "mirror" | "summit" | "return";
  previous?: string;
  next?: string;
};

export type StoryReaderUi = {
  read: string;
  readAtYourPace: string;
  listen: string;
  readAloud: string;
  chapter: string;
  chapters: string;
  home: string;
  previousChapter: string;
  nextChapter: string;
  readingNavigation: string;
  backToBeginning: string;
  scrollIntoStory: string;
  drawing: string;
  drawingNeeded: string;
  drawingToCome: string;
};

export type StoryLanguageLink = {
  locale: string;
  label: string;
  href: string;
};

export type StoryBookSource = {
  slug: string;
  locale?: string;
  reader: StoryReaderConfig;
  manuscript: string;
  beatTimings: ReadonlyArray<StoryBeatTiming>;
  headingTimings: StoryHeadingTimings;
  wordTimings: StoryWordTimings;
  presentation?: {
    canonicalPath?: string;
    socialImage?: string;
    socialImageWidth?: number;
    socialImageHeight?: number;
    libraryCover?: string;
    themeColor?: string;
    navigation?: {
      kind: "mountain" | "chapters";
      homeLabel?: string;
    };
    ui?: Partial<StoryReaderUi>;
    languages?: ReadonlyArray<StoryLanguageLink>;
    chapterPalettes?: ReadonlyArray<ChapterPalette>;
    epigraph?: {
      quote: string;
      author: string;
      work: string;
      location: string;
      translationNote?: string;
    };
    companion?: {
      href: string;
      navLabel: string;
      eyebrow: string;
      title: string;
      description: string;
      actionLabel: string;
      inlineMarkdown?: string;
    };
  };
};

export type StoryCatalogEntry = {
  slug: string;
  title: string;
  intro: string;
  href: string;
  coverArt?: string;
  narrationAvailable: boolean;
};

export const catalogEntryFor = (book: StoryBookSource): StoryCatalogEntry => ({
  slug: book.slug,
  title: book.reader.title,
  intro: book.reader.intro,
  href: book.presentation?.canonicalPath ?? `/books/${book.slug}/`,
  coverArt: book.presentation?.libraryCover ?? book.reader.artwork.cover,
  narrationAvailable: book.reader.narrationAvailable !== false,
});
