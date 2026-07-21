import type { StoryChapter } from "./story";

export type StorySpeaker =
  | "narrator"
  | "boy"
  | "character"
  | "machine"
  | "stonecutter"
  | "keeper"
  | "potter"
  | "girl"
  | "gardener"
  | "house"
  | "wind";

export type VoicePassage = {
  beat: number;
  speaker: Exclude<StorySpeaker, "narrator">;
  text: string;
};

export type StoryReaderConfig = {
  id: string;
  title: string;
  intro: string;
  narrationAvailable?: boolean;
  audio: {
    src: string;
    sources?: ReadonlyArray<{
      src: string;
      type: string;
    }>;
    duration: number;
  };
  artwork: {
    cover?: string;
    originalThrough: number;
    originalRoot: string;
    studyRoot: string;
    sources?: Record<number, {
      src: string;
      kind: "original" | "study";
    }>;
  };
  motions: string[];
  voices: VoicePassage[];
  chapterCharacterVoices?: Partial<Record<number, Exclude<StorySpeaker, "narrator" | "character">>>;
};

export type VoicedWord = {
  text: string;
  speaker: StorySpeaker;
};

export type StoryWordTimingBeat = {
  number: number;
  start: number;
  end: number;
  paragraphs: ReadonlyArray<{
    words: ReadonlyArray<{
      start: number;
      end: number;
      speaker?: string;
    }>;
  }>;
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

export function validateStoryWordTimings(
  chapters: StoryChapter[],
  timings: ReadonlyArray<StoryWordTimingBeat>,
  duration: number,
) {
  const expectedBeats = chapters.flatMap((chapter) => chapter.beats);
  const timingByNumber = new Map(timings.map((timing) => [timing.number, timing]));
  if (timingByNumber.size !== timings.length) throw new Error("Story word timings contain duplicate beat numbers.");
  if (timings.length !== expectedBeats.length) {
    throw new Error(`Story has ${expectedBeats.length} beats but ${timings.length} aligned timing entries.`);
  }

  const validSpeakers = new Set<StorySpeaker>([
    "narrator", "boy", "character", "machine", "stonecutter", "keeper", "potter",
    "girl", "gardener", "house", "wind",
  ]);
  let previousCueEnd = 0;

  expectedBeats.forEach((beat) => {
    const timing = timingByNumber.get(beat.number);
    if (!timing) throw new Error(`Drawing ${beat.number} has no word timing entry.`);
    if (Math.abs(timing.start - beat.start) > 0.02 || Math.abs(timing.end - beat.end) > 0.02) {
      throw new Error(`Drawing ${beat.number} beat and word timing boundaries do not match.`);
    }
    if (timing.paragraphs.length !== beat.paragraphs.length) {
      throw new Error(
        `Drawing ${beat.number} has ${beat.paragraphs.length} paragraphs but ${timing.paragraphs.length} timed paragraphs.`,
      );
    }

    beat.paragraphs.forEach((paragraph, paragraphIndex) => {
      const displayedWordCount = [...paragraph.matchAll(/\S+/g)].length;
      const cues = timing.paragraphs[paragraphIndex]?.words ?? [];
      if (displayedWordCount !== cues.length) {
        throw new Error(
          `Drawing ${beat.number}, paragraph ${paragraphIndex + 1} has ${displayedWordCount} words but ${cues.length} cues.`,
        );
      }
      cues.forEach((cue, wordIndex) => {
        if (
          !Number.isFinite(cue.start)
          || !Number.isFinite(cue.end)
          || cue.start < previousCueEnd
          || cue.end < cue.start
          || cue.end > duration
        ) {
          throw new Error(`Drawing ${beat.number}, word ${wordIndex + 1} has an invalid or out-of-order cue.`);
        }
        if (cue.speaker && !validSpeakers.has(cue.speaker as StorySpeaker)) {
          throw new Error(`Drawing ${beat.number}, word ${wordIndex + 1} has unknown speaker “${cue.speaker}”.`);
        }
        previousCueEnd = cue.end;
      });
    });
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
