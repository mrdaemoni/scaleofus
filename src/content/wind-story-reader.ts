import type { StoryReaderConfig } from "../lib/story-reader";

const assetNumber = (number: number) => String(number).padStart(2, "0");
const original = (number: number): { src: string; kind: "original" } => ({
  src: `/images/wind-story/sketches/beat-${assetNumber(number)}.png`,
  kind: "original",
});
const study = (number: number): { src: string; kind: "study" } => ({
  src: `/images/wind-story/beats/beat-${assetNumber(number)}.jpg`,
  kind: "study",
});

export const windStoryReader: StoryReaderConfig = {
  id: "the-boy-who-tried-to-catch-the-wind",
  title: "The Boy Who Tried to Catch the Wind",
  intro: "A story about a boy, a machine, and the part of us no answer can hold.",
  audio: {
    src: "/audio/the-boy-who-tried-to-catch-the-wind.mp3",
    duration: 885.54,
  },
  artwork: {
    originalThrough: 11,
    originalRoot: "/images/wind-story/sketches",
    studyRoot: "/images/wind-story/beats",
    sources: {
      1: original(1),
      2: original(2),
      3: original(3),
      6: original(4),
      7: original(5),
      9: original(6),
      11: original(7),
      13: original(8),
      14: original(9),
      15: original(10),
      16: original(11),
      17: study(12),
      19: study(13),
      20: study(14),
      21: study(15),
      22: study(16),
      25: study(17),
      27: study(18),
      29: study(19),
      30: study(20),
      31: study(21),
      33: study(22),
      34: study(23),
      36: study(24),
      37: study(25),
      38: study(26),
      41: study(27),
      43: study(28),
      45: study(29),
      48: study(30),
      49: study(31),
      50: study(32),
      51: study(33),
      53: study(34),
      54: study(35),
      56: study(36),
      57: study(37),
      59: study(38),
    },
  },
  motions: [
    "wind", "card", "glow", "card", "tap", "path", "glow", "wind", "path", "tap",
    "tap", "card", "stream", "pebble", "smoke", "flame", "glow", "flame", "wheel", "path",
    "clay", "sun", "smoke", "pond", "pond", "ripple", "ripple", "still", "rain", "leaf",
    "flower", "sprout", "sprout", "flower", "tap", "path", "windows", "mirrors", "glow", "card",
    "fragments", "still", "ripple", "question", "wind", "windows", "question", "sky", "fragments", "gifts",
    "breath", "glow", "map", "windows", "glow", "breath", "page", "card", "wind",
  ],
  // Most speaker identity travels with the aligned word cues. These exact
  // passages restore voice on phrases rewritten more substantially.
  voices: [
    { beat: 12, speaker: "character", text: "I can't carve the parts that move. Stone can't hold them." },
    { beat: 13, speaker: "character", text: "I gave it that name forty years ago. The name is still the same. The water changes every moment. You're the water, boy. The card is the rock. Carry it. Just never think it is you." },
    { beat: 16, speaker: "boy", text: "Aren't you afraid of all this fire?" },
    { beat: 17, speaker: "character", text: "A machine with all the words in the world is a very big fire" },
    { beat: 22, speaker: "character", text: "The only one in the whole world." },
    { beat: 34, speaker: "character", text: "I never planted it" },
    { beat: 55, speaker: "machine", text: "I've never seen that answer written down" },
  ],
};
