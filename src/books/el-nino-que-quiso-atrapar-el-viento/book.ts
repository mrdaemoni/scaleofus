import storyMarkdown from "./el-nino-que-quiso-atrapar-el-viento.md?raw";
import storyHeadingTimings from "../the-boy-who-tried-to-catch-the-wind/story-heading-timings.json";
import storyTimings from "../the-boy-who-tried-to-catch-the-wind/story-timings.json";
import storyWordTimings from "../the-boy-who-tried-to-catch-the-wind/story-word-timings.json";
import { windStoryReader } from "../the-boy-who-tried-to-catch-the-wind/reader";
import { windStoryBook } from "../the-boy-who-tried-to-catch-the-wind/book";
import type { StoryBookSource } from "../../lib/story-book";

const spanishReader = {
  ...windStoryReader,
  id: "el-nino-que-quiso-atrapar-el-viento",
  title: "El niño que quiso atrapar el viento",
  intro: "Una historia sobre un niño, una máquina y esa parte de nosotros que ninguna respuesta puede contener.",
  narrationAvailable: false,
  artwork: {
    ...windStoryReader.artwork,
    title: undefined,
    chapterSources: undefined,
    companionTitle: undefined,
  },
  voices: [],
};

export const spanishWindStoryBook = {
  slug: "el-nino-que-quiso-atrapar-el-viento",
  locale: "es",
  reader: spanishReader,
  manuscript: storyMarkdown,
  // The visual stages stay aligned with the English edition even without
  // Spanish narration, so every drawing retains the same stable page number.
  beatTimings: storyTimings,
  headingTimings: storyHeadingTimings,
  wordTimings: storyWordTimings,
  presentation: {
    canonicalPath: "/es/",
    socialImage: "/images/wind-story/og-wind-drawing-01.png",
    socialImageWidth: 1200,
    socialImageHeight: 630,
    libraryCover: "/images/wind-story/mobile/n01.webp",
    themeColor: "#f2dfd4",
    navigation: {
      kind: "mountain",
      homeLabel: "El niño que quiso atrapar el viento",
    },
    languages: [
      { locale: "en", label: "EN", href: "/" },
      { locale: "es", label: "ES", href: "/es/" },
    ],
    ui: {
      read: "Leer",
      readAtYourPace: "A tu ritmo",
      listen: "Escuchar",
      readAloud: "lectura en voz alta",
      chapter: "Capítulo",
      chapters: "Capítulos",
      home: "Inicio",
      previousChapter: "Capítulo anterior",
      nextChapter: "Capítulo siguiente",
      readingNavigation: "Navegación de lectura",
      backToBeginning: "Volver al inicio",
      scrollIntoStory: "Entrar al cuento",
      drawing: "Dibujo",
      drawingNeeded: "pendiente",
      drawingToCome: "Dibujo por venir",
    },
    chapterPalettes: windStoryBook.presentation.chapterPalettes,
  },
} satisfies StoryBookSource;
