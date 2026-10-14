import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { SCENTS } from "@/lib/products";

const base = siteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/versand", "/widerruf", "/impressum", "/datenschutz", "/agb"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.3,
  }));
  const products = SCENTS.map((scent) => ({
    url: `${base}/duft/${scent.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [...pages, ...products];
}
