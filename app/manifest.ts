import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "75 Proof - 75 HARD Challenge Tracker",
    short_name: "75 Proof",
    description:
      "Track workouts, water, reading, and progress photos. Build mental toughness with the ultimate 75 HARD companion.",
    start_url: "/dashboard",
    display: "standalone",
    theme_color: "#FF6154",
    background_color: "#ffffff",
    orientation: "portrait-primary",
    categories: ["health", "fitness"],
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
