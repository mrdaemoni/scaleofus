// Public allowlist snapshot of approved canonical facts. Private publishing records stay local.
import canonicalRecord from "./wind-publication.public.json";

const canonicalBook = canonicalRecord.book;

export const scaleOfUs = canonicalRecord.publisher;

export const windPublication = {
  title: canonicalBook.title,
  spanishTitle: canonicalBook.spanishTitle,
  slug: canonicalBook.slug,
  isbn: canonicalBook.isbn,
  isbnRegistryUrl: canonicalBook.isbnRegistry.url,
  isbnRegistryStatus: canonicalBook.isbnRegistry.status,
  author: canonicalBook.roles.author,
  illustrator: canonicalBook.roles.illustrator,
  designer: canonicalBook.roles.designer,
  spanishLanguageAuthor: canonicalBook.roles.spanishLanguageAuthor,
  publisher: canonicalRecord.publisher.name,
  copyrightYear: canonicalBook.copyrightYear,
  webFirstPublished: canonicalBook.digital.projectWebsiteFirstPublished,
  immersiveFirstPublished: canonicalBook.digital.englishImmersiveFirstPublished,
  printPublicationDate: canonicalBook.print.printPublicationDate,
  printPublicationLabel: canonicalBook.print.publicationLabel,
  audience: canonicalBook.audience,
  printLanguage: canonicalBook.print.language,
  digitalLanguages: canonicalBook.digital.languages,
  pages: canonicalBook.print.pages,
  format: canonicalBook.print.format,
  dimensions: canonicalBook.print.dimensions,
  englishAudioDuration: canonicalBook.digital.englishAudioDuration,
  spanishAudioDuration: canonicalBook.digital.spanishAudioDuration,
  description: canonicalBook.description,
  rights: canonicalBook.rightsStatement,
};

export function windBookStructuredData({
  url = `${scaleOfUs.url}/stories/${windPublication.slug}/`,
  language = "en",
  name = windPublication.title,
  audio = false,
}: {
  url?: string;
  language?: "en" | "es";
  name?: string;
  audio?: boolean;
} = {}) {
  return {
    "@context": "https://schema.org",
    "@type": audio ? ["Book", "Audiobook"] : "Book",
    name,
    url,
    description: windPublication.description,
    inLanguage: language,
    isbn: windPublication.isbn,
    sameAs: windPublication.isbnRegistryUrl,
    numberOfPages: windPublication.pages,
    bookFormat: windPublication.printPublicationDate
      ? "https://schema.org/Hardcover"
      : undefined,
    datePublished: windPublication.webFirstPublished,
    copyrightYear: windPublication.copyrightYear,
    author: { "@type": "Person", name: windPublication.author },
    illustrator: { "@type": "Person", name: windPublication.illustrator },
    publisher: {
      "@type": "Organization",
      name: windPublication.publisher,
      url: scaleOfUs.url,
    },
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: 8,
      audienceType: "Children and adults",
    },
    image: `${scaleOfUs.url}/edition/cover.webp`,
    workExample: [
      ...(windPublication.printPublicationDate ? [{
        "@type": "Book",
        bookFormat: "https://schema.org/Hardcover",
        inLanguage: "en",
        isbn: windPublication.isbn,
        datePublished: windPublication.printPublicationDate,
      }] : []),
      {
        "@type": "CreativeWork",
        name: `${windPublication.title} — online reading`,
        inLanguage: ["en", "es"],
        url: `${scaleOfUs.url}/immerse/wind/`,
        isAccessibleForFree: true,
      },
    ],
  };
}
