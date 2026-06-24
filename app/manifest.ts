import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "earned",
    short_name: "earned",
    description: "Show up. Every day. Build the streak.",
    start_url: "/dashboard",
    display: "standalone",
    // Match the cream paper so the PWA chrome/splash reads full-screen, not a
    // contrasting blue bar.
    theme_color: "#F4ECD8",
    background_color: "#F4ECD8",
    orientation: "portrait-primary",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
