import { windStoryBook } from "./the-boy-who-tried-to-catch-the-wind/book";
import { catalogEntryFor } from "../lib/story-book";

// Add a new imported book to this array. The reader route, library metadata,
// validation, and build budgets derive from this one registry.
export const storyBooks = [windStoryBook] as const;
export const storyCatalog = storyBooks.map(catalogEntryFor);

export const storyBookBySlug = (slug: string) =>
  storyBooks.find((book) => book.slug === slug);
