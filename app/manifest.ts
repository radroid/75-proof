import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "earned",
    short_name: "earned",
    description: "Show up. Every day. Earn the star.",
    start_url: "/dashboard",
    display: "standalone",
    theme_color: "#ffffff",
    background_color: "#ffffff",
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
