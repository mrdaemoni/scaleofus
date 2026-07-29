import storyMarkdown from "./el-nino-que-quiso-atrapar-el-viento.md?raw";
import storyHeadingTimings from "./story-heading-timings.json";
import storyTimings from "./story-timings.json";
import storyWordTimings from "./story-word-timings.json";
import { windStoryReader } from "../the-boy-who-tried-to-catch-the-wind/reader";
import { windStoryBook } from "../the-boy-who-tried-to-catch-the-wind/book";
import type { StoryBookSource } from "../../lib/story-book";
import type { StoryArtworkSource } from "../../lib/story-reader";

const spanishLive = (name: string): StoryArtworkSource => ({
  src: `/images/wind-story/live/${name}.svg`,
  mobileSrc: `/images/wind-story/mobile/${name}.webp`,
  kind: "live",
});

const spanishReader = {
  ...windStoryReader,
  id: "el-nino-que-quiso-atrapar-el-viento",
  title: "El niño que quiso atrapar el viento",
  intro: "Una historia sobre un niño, una máquina y esa parte de nosotros que ninguna respuesta puede contener.",
  narrationAvailable: true,
  audio: {
    src: "/books/el-nino-que-quiso-atrapar-el-viento/audio/narration.mp3?v=story-es-v1-scored-20260729",
    sources: [
      {
        src: "/books/el-nino-que-quiso-atrapar-el-viento/audio/narration.mp3?v=story-es-v1-scored-20260729",
        type: "audio/mpeg",
      },
      {
        src: "/books/el-nino-que-quiso-atrapar-el-viento/audio/narration.m4a?v=story-es-v1-scored-20260729",
        type: 'audio/mp4; codecs="mp4a.40.2"',
      },
    ],
    duration: 1208.554,
  },
  artwork: {
    ...windStoryReader.artwork,
    title: spanishLive("es-title"),
    chapterSources: {
      1: spanishLive("es-title"),
      2: spanishLive("es-ch-stonecutter"),
      3: spanishLive("es-ch-potter"),
      4: spanishLive("es-ch-pond"),
      5: spanishLive("es-ch-mirrors"),
      6: spanishLive("es-ch-mountain"),
      7: spanishLive("es-ch-oneturn"),
    },
    companionTitle: undefined,
  },
  voices: [],
};

export const spanishWindStoryBook = {
  slug: "el-nino-que-quiso-atrapar-el-viento",
  locale: "es",
  reader: spanishReader,
  manuscript: storyMarkdown,
  // The Spanish narration has its own timing pass while retaining the English
  // edition's artwork and stable drawing numbers.
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
