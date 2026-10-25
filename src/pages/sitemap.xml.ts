import type { APIRoute } from "astro";

const pages = [
  "/",
  "/about/",
  "/press/",
  "/reviews/",
  "/reflections/",
  "/help/",
  "/stories/",
  "/stories/the-boy-who-tried-to-catch-the-wind/",
  "/books/the-boy-who-tried-to-catch-the-wind/",
  "/read/wind/",
  "/read/es/",
  "/immerse/wind/",
  "/immerse/es/",
  "/es/",
  "/grown-ups/",
];

export const GET: APIRoute = () => {
  const urls = pages.map((path) => `  <url><loc>https://scaleofus.com${path}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
