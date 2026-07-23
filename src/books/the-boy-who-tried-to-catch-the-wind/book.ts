import storyMarkdown from "./the-boy-who-tried-to-catch-the-wind.md?raw";
import storyHeadingTimings from "./story-heading-timings.json";
import storyTimings from "./story-timings.json";
import storyWordTimings from "./story-word-timings.json";
import { windStoryReader } from "./reader";
import type { StoryBookSource } from "../../lib/story-book";

export const windStoryBook = {
  slug: "the-boy-who-tried-to-catch-the-wind",
  reader: windStoryReader,
  manuscript: storyMarkdown,
  beatTimings: storyTimings,
  headingTimings: storyHeadingTimings,
  wordTimings: storyWordTimings,
  presentation: {
    canonicalPath: "/",
    socialImage: "/images/wind-story/og-wind-pink.jpg",
    libraryCover: "/images/wind-story/mobile/d00.webp",
    themeColor: "#f3dfe1",
    navigation: {
      kind: "mountain",
      homeLabel: "The Boy Who Tried to Catch the Wind",
    },
    chapterPalettes: [
      { wash: "#ff4f75", secondary: "#f58b59", previous: "#ff4f75", next: "#aeb1b3" },
      { wash: "#aeb1b3", secondary: "#d2bda6", previous: "#ff4f75", next: "#f29a49" },
      { wash: "#c9825f", secondary: "#e3a25f", previous: "#aeb1b3", next: "#59acd1" },
      { wash: "#59acd1", secondary: "#8ccfc9", previous: "#c9825f", next: "#9da7b8" },
      { wash: "#9da7b8", secondary: "#c3a7c8", previous: "#59acd1", next: "#55a0d2" },
      { wash: "#55a0d2", secondary: "#91c7df", previous: "#9da7b8", next: "#ec6a91" },
      { wash: "#ec6a91", secondary: "#b476c9", previous: "#55a0d2", next: "#ec6a91" },
    ],
    companion: {
      href: "/grown-ups/",
      navLabel: "For grown-ups",
      eyebrow: "The story keeps company",
      title: "There is another room for grown-ups.",
      description: "Seven short notes trace the old ideas underneath the boy’s climb. They are companions to the story, not a key to it.",
      actionLabel: "Enter the grown-ups room",
    },
  },
} satisfies StoryBookSource;
