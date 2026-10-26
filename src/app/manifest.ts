import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nagrik Saathi",
    short_name: "Nagrik Saathi",
    description:
      "Understand a government notice, check scam signals, read a reviewed process playbook, and open the official portal yourself.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f4f7",
    theme_color: "#25406a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
