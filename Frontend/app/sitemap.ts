import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/about",
    "/boardings",
    "/contact",
    "/login",
    "/owner-dashboard",
    "/privacy",
    "/signup",
    "/terms",
  ];
  const now = new Date();
  return routes.map((r) => ({ url: `${base}${r}`, lastModified: now }));
}
