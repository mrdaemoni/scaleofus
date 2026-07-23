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
  previous?: string;
  next?: string;
};

export type StoryBookSource = {
  slug: string;
  reader: StoryReaderConfig;
  manuscript: string;
  beatTimings: ReadonlyArray<StoryBeatTiming>;
  headingTimings: StoryHeadingTimings;
  wordTimings: StoryWordTimings;
  presentation?: {
    canonicalPath?: string;
    socialImage?: string;
    libraryCover?: string;
    themeColor?: string;
    navigation?: {
      kind: "mountain" | "chapters";
      homeLabel?: string;
    };
    chapterPalettes?: ReadonlyArray<ChapterPalette>;
    companion?: {
      href: string;
      navLabel: string;
      eyebrow: string;
      title: string;
      description: string;
      actionLabel: string;
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
