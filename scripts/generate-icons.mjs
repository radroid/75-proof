// Generate the earned PWA/app icons from the canonical star.
// Sky-blue full-bleed tile + centered gold star. Run from project root:
//   node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Pull the star's inner geometry out of the canonical asset so there is a
// single source of truth for the star shape.
const starSvg = readFileSync(join(root, "public/star.svg"), "utf8");
const starInner = starSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

const SKY = "#0085D4";

/** Build a sky tile with the star centered, given size, padding and corner radius. */
function tileSvg(size, pad, rx = 0) {
  const inner = size - pad * 2;
  const scale = inner / 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${rx}" fill="${SKY}"/>
    <g transform="translate(${pad},${pad}) scale(${scale})">${starInner}</g>
  </svg>`;
}

const targets = [
  { out: "public/icon-192.png", size: 192, pad: 34, rx: 0 },
  { out: "public/icon-512.png", size: 512, pad: 92, rx: 0 },
  { out: "app/apple-icon.png", size: 180, pad: 30, rx: 0 },
  // Rounded PNG favicon fallback (browsers that prefer a raster icon).
  { out: "app/icon.png", size: 256, pad: 44, rx: 56 },
];

for (const t of targets) {
  const svg = tileSvg(t.size, t.pad, t.rx ?? 0);
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(join(root, t.out));
  console.log("wrote", t.out, `${t.size}x${t.size}`);
}
console.log("done");
