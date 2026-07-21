import type { StoryReaderConfig } from "../lib/story-reader";

const assetNumber = (number: number) => String(number).padStart(2, "0");
const study = (number: number): { src: string; kind: "study" } => ({
  src: `/images/wind-story/beats/beat-${assetNumber(number)}.jpg`,
  kind: "study",
});

export const windStoryReader: StoryReaderConfig = {
  id: "the-boy-who-tried-to-catch-the-wind",
  title: "The Boy Who Tried to Catch the Wind",
  intro: "A story about a boy, a machine, and the part of us no answer can hold.",
  narrationAvailable: false,
  audio: {
    src: "/audio/the-boy-who-tried-to-catch-the-wind.mp3?v=full-cast-v10-20260719",
    sources: [
      {
        src: "/audio/wind-story-hls/story.m3u8?v=full-cast-v10-chapters-20260720",
        type: "application/vnd.apple.mpegurl",
      },
      {
        src: "/audio/the-boy-who-tried-to-catch-the-wind.mp3?v=full-cast-v10-20260720b",
        type: "audio/mpeg",
      },
      {
        src: "/audio/the-boy-who-tried-to-catch-the-wind.m4a?v=full-cast-v10-20260720",
        type: 'audio/mp4; codecs="mp4a.40.2"',
      },
    ],
    duration: 1045.567,
  },
  artwork: {
    cover: "/images/wind-story/sketches/scale-22-cover.png",
    originalThrough: 11,
    originalRoot: "/images/wind-story/sketches",
    studyRoot: "/images/wind-story/beats",
    sources: {
      1: { src: "/images/wind-story/sketches/scale-22-beat-01.png", kind: "original" },
      2: { src: "/images/wind-story/sketches/scale-22-beat-03.png", kind: "original" },
      3: { src: "/images/wind-story/sketches/scale-22-beat-02.png", kind: "original" },
      5: { src: "/images/wind-story/sketches/scale-22-beat-04.png", kind: "original" },
      7: { src: "/images/wind-story/sketches/scale-22-beat-05.png", kind: "original" },
      8: { src: "/images/wind-story/sketches/scale-22-beat-06.png", kind: "original" },
      9: { src: "/images/wind-story/sketches/scale-22-beat-07.png", kind: "original" },
      10: { src: "/images/wind-story/sketches/scale-22-beat-08.png", kind: "original" },
      11: { src: "/images/wind-story/sketches/scale-22-beat-09.png", kind: "original" },
      12: { src: "/images/wind-story/sketches/scale-22-beat-10.png", kind: "original" },
      13: { src: "/images/wind-story/sketches/scale-22-beat-11.png", kind: "original" },
      14: { src: "/images/wind-story/sketches/scale-22-beat-12.png", kind: "original" },
      15: { src: "/images/wind-story/sketches/scale-22-beat-13.png", kind: "original" },
      16: { src: "/images/wind-story/sketches/scale-22-beat-14.png", kind: "original" },
      18: { src: "/images/wind-story/sketches/scale-22-beat-20.png", kind: "original" },
      19: { src: "/images/wind-story/sketches/scale-22-beat-21.png", kind: "original" },
      20: { src: "/images/wind-story/sketches/scale-22-beat-22.png", kind: "original" },
      22: { src: "/images/wind-story/sketches/scale-22-beat-17.png", kind: "original" },
      24: { src: "/images/wind-story/sketches/scale-22-beat-24.png", kind: "original" },
      25: { src: "/images/wind-story/sketches/scale-22-beat-25.png", kind: "original" },
      26: { src: "/images/wind-story/sketches/scale-22-beat-26.png", kind: "original" },
      27: study(18),
      29: study(19),
      32: study(20),
      33: study(25),
      34: study(26),
      37: study(27),
      41: study(29),
      44: study(30),
      45: study(31),
      46: study(32),
      48: study(33),
      50: study(34),
      51: study(35),
      53: study(36),
      54: study(37),
      56: study(38),
    },
  },
  motions: [
    "wind", "glow", "card", "card", "card", "glow", "tap", "path", "glow", "wind",
    "path", "tap", "tap", "card", "stream", "pebble", "wheel", "path", "clay", "sun",
    "flame", "glow", "flame", "pond", "pond", "ripple", "ripple", "still", "rain", "flower",
    "sprout", "leaf", "windows", "mirrors", "glow", "card", "fragments", "still", "ripple", "question",
    "wind", "windows", "question", "sky", "fragments", "gifts", "wind", "breath", "glow", "map",
    "windows", "glow", "breath", "page", "card", "wind",
  ],
  chapterCharacterVoices: {
    2: "stonecutter",
    3: "potter",
    4: "girl",
    5: "house",
  },
  // The existing full-cast audio belongs to the prior draft. Speaker passages
  // will return when narration is re-aligned to v9.
  voices: [],
};
