import type { StoryChapter } from "./story";

export type StorySpeaker = "narrator" | "boy" | "character" | "machine" | "house" | "wind";

export type VoicePassage = {
  beat: number;
  speaker: Exclude<StorySpeaker, "narrator">;
  text: string;
};

export type StoryArtworkLoop = {
  kind: "wind" | "shine" | "speech" | "pulse" | "path" | "stream" | "steam" | "flame";
  /** Percentage inset: top, right, bottom, left. Keeps the moving ink local to the drawn detail. */
  inset: [number, number, number, number];
  duration?: number;
  delay?: number;
  intensity?: number;
};

export type StoryReaderConfig = {
  id: string;
  title: string;
  intro: string;
  audio: {
    src: string;
    duration: number;
  };
  artwork: {
    cover?: string;
    coverLoop?: StoryArtworkLoop;
    originalThrough: number;
    originalRoot: string;
    studyRoot: string;
    sources?: Record<number, {
      src: string;
      kind: "original" | "study";
    }>;
    loops?: Record<number, StoryArtworkLoop>;
  };
  motions: string[];
  voices: VoicePassage[];
};

export type VoicedWord = {
  text: string;
  speaker: StorySpeaker;
};

const occurrences = (value: string, fragment: string) => {
  let count = 0;
  let cursor = 0;
  while ((cursor = value.indexOf(fragment, cursor)) !== -1) {
    count += 1;
    cursor += fragment.length;
  }
  return count;
};

export function validateVoicePassages(chapters: StoryChapter[], passages: VoicePassage[]) {
  const beats = new Map(
    chapters.flatMap((chapter) => chapter.beats.map((beat) => [beat.number, beat.paragraphs.join("\n")] as const)),
  );
  passages.forEach((passage) => {
    const count = occurrences(beats.get(passage.beat) ?? "", passage.text);
    if (count !== 1) {
      throw new Error(
        `Voice passage for beat ${passage.beat} must match exactly once; found ${count}: ${passage.text}`,
      );
    }
  });
}

export function voiceWords(paragraph: string, passages: VoicePassage[]): VoicedWord[] {
  const tokens = [...paragraph.matchAll(/\S+/g)].map((match) => ({
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
    speaker: "narrator" as StorySpeaker,
  }));

  passages.forEach((passage) => {
    const start = paragraph.indexOf(passage.text);
    if (start < 0) return;
    const end = start + passage.text.length;
    tokens.forEach((token) => {
      if (token.end > start && token.start < end) token.speaker = passage.speaker;
    });
  });

  return tokens.map(({ text, speaker }) => ({ text, speaker }));
}

export function storyArt(config: StoryReaderConfig, number: number) {
  if (config.artwork.sources) return config.artwork.sources[number]?.src ?? null;
  const root = number <= config.artwork.originalThrough
    ? config.artwork.originalRoot
    : config.artwork.studyRoot;
  const extension = number <= config.artwork.originalThrough ? "png" : "jpg";
  return `${root}/beat-${String(number).padStart(2, "0")}.${extension}`;
}

export function storyArtKind(config: StoryReaderConfig, number: number) {
  if (config.artwork.sources) return config.artwork.sources[number]?.kind ?? null;
  return number <= config.artwork.originalThrough ? "original" : "study";
}
