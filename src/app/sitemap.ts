import type { MetadataRoute } from "next";
import { listPlaybooks } from "@/lib/playbooks/registry";

const BASE_URL = "https://nagrik-saathi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date("2026-10-26T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/playground`,
      lastModified: new Date("2026-10-26T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/playbooks`,
      lastModified: new Date("2026-10-26T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const playbookPages: MetadataRoute.Sitemap = listPlaybooks().map((playbook) => ({
    url: `${BASE_URL}/playbooks/${playbook.slug}`,
    lastModified: new Date(`${playbook.lastReviewed}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...playbookPages];
}
