// ─── Real AI Color Generator ─────────────────────────────────────────────────
// Uses Perplexity search to find actual color associations for any prompt

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Extract hex codes from text
function extractHexCodes(text: string): string[] {
  const matches = text.match(/#[0-9a-fA-F]{6}\b/g) || [];
  return [...new Set(matches)].slice(0, 10);
}

// Extract color names from text and convert to hex
function extractColorNames(text: string): string[] {
  const COLOR_MAP: Record<string, string> = {
    red: "#E53E3E", crimson: "#DC143C", scarlet: "#FF2400", burgundy: "#800020",
    maroon: "#800000", ruby: "#9B111E", rose: "#FF007F", magenta: "#FF00FF",
    pink: "#FF69B4", hotpink: "#FF1493", fuchsia: "#FF00FF", coral: "#FF6B6B",
    orange: "#FF8C00", amber: "#FFBF00", gold: "#FFD700", yellow: "#FFD700",
    lemon: "#FFF44F", lime: "#BFFF00", chartreuse: "#7FFF00", green: "#2D8653",
    emerald: "#50C878", mint: "#98FF98", teal: "#008080", cyan: "#00BCD4",
    turquoise: "#40E0D0", aqua: "#00FFFF", sky: "#87CEEB", cerulean: "#0099CD",
    blue: "#2B6CB0", navy: "#001F5B", indigo: "#3F00FF", cobalt: "#0047AB",
    electric: "#7DF9FF", violet: "#EE82EE", purple: "#7B2FBE", lavender: "#B57BDB",
    lilac: "#C8A2C8", plum: "#DDA0DD", mauve: "#E0B0FF", orchid: "#DA70D6",
    white: "#FFFFFF", ivory: "#FFFFF0", cream: "#FFFDD0", beige: "#F5F5DC",
    tan: "#D2B48C", sand: "#C2B280", khaki: "#C3B091", brown: "#964B00",
    chocolate: "#7B3F00", mahogany: "#C04000", coffee: "#6F4E37", black: "#0A0A0A",
    onyx: "#353839", charcoal: "#36454F", slate: "#708090", gray: "#808080",
    silver: "#C0C0C0", pewter: "#96A8A1", platinum: "#E5E4E2", metallic: "#AAA9AD",
    neon: "#39FF14", glow: "#88FF22", toxic: "#00FF00", acid: "#B0BF1A",
    pastel: "#FFD1DC", muted: "#9EADBC", dusty: "#B0A89F", sage: "#B2AC88",
    olive: "#808000", forest: "#228B22", pine: "#01796F", moss: "#8A9A5B",
    flesh: "#FF9F8C", peach: "#FFDAB9", salmon: "#FA8072", terracotta: "#E2725B",
    rust: "#B7410E", copper: "#B87333", bronze: "#CD7F32", brass: "#B5A642",
    champagne: "#F7E7CE", nude: "#E3BC9A", blush: "#DE5D83", wine: "#722F37",
    midnight: "#191970", dusk: "#E6B17E", dawn: "#F9A472", twilight: "#E3A857",
    electric_blue: "#7DF9FF", hot_pink: "#FF69B4", lime_green: "#32CD32",
    blood: "#880808", poison: "#B5B500", glacier: "#80B8D0", frost: "#A0C0C8",
    ice: "#D0E8F0", storm: "#4B5563", thunder: "#5B6066", smoke: "#738276",
    ash: "#B2BEB5", pearl: "#F0EAD6", obsidian: "#1C1C1C", jet: "#343434",
    void: "#080808", shadow: "#1C2526", darkness: "#0F0F0F", coal: "#1C1C1C",
    chrome: "#DBE2E9", steel: "#7F8FA6", iron: "#4A4A4A", mercury: "#E5E4E2",
    golden: "#FFD700", sunshine: "#FFE142", canary: "#FFEF00", mustard: "#FFDB58",
    honey: "#FFC30B", caramel: "#C68642", cinnamon: "#D2691E", ginger: "#B06500",
    tiger: "#FD7C2A", tangerine: "#F28500", papaya: "#FFEFD5", mango: "#FDBE02",
    tropical: "#00B16A", caribbean: "#00827F", bahama: "#026395", lagoon: "#00B4D8",
    azure: "#F0FFFF", sapphire: "#0F52BA", cobalt_blue: "#0047AB", lapis: "#26619C",
    ultramarine: "#3F00FF", periwinkle: "#CCCCFF", wisteria: "#C9A0DC", amethyst: "#9966CC",
    grape: "#6F2DA8", eggplant: "#614051", dark_purple: "#4B0082",
    bright_red: "#FF0000", deep_red: "#8B0000", strawberry: "#FC5A8D",
    watermelon: "#FC6C85", cherry: "#DE3163", raspberry: "#C41E3A",
    tangy: "#FF4500", vivid: "#FF6700", bold: "#CC0000",
  };

  const words = text.toLowerCase().split(/[\s,;]+/);
  const found: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[^a-z_]/g, "");
    if (COLOR_MAP[clean]) found.push(COLOR_MAP[clean]);
    // also try compound: "dark blue" → darkblue check
    for (const [key, val] of Object.entries(COLOR_MAP)) {
      if (clean.includes(key) || key.includes(clean)) {
        if (!found.includes(val)) found.push(val);
      }
    }
    if (found.length >= 10) break;
  }
  return found;
}

// Deduplicate and normalize colors
function deduplicateColors(colors: string[]): string[] {
  const seen = new Set<string>();
  return colors.filter((c) => {
    const norm = c.toLowerCase();
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

// Generate a search query for colors from a prompt
function buildSearchQuery(prompt: string): string {
  return `"${prompt}" color palette hex codes aesthetic`;
}

// Core: call pplx search web via shell
export async function searchColorsForPrompt(prompt: string): Promise<string[]> {
  try {
    const query = buildSearchQuery(prompt);
    const cmd = `PPLX_API_KEY="$PPLX_API_KEY" pplx search web ${JSON.stringify(query)} 2>/dev/null`;

    const { stdout } = await execAsync(cmd, {
      timeout: 12000,
      env: { ...process.env },
    });

    const data = JSON.parse(stdout);
    const allText = (data.hits || [])
      .map((h: any) => `${h.title || ""} ${h.snippet || ""} ${h.summary || ""}`)
      .join(" ");

    const hexColors = extractHexCodes(allText);
    const nameColors = extractColorNames(allText + " " + prompt);

    const combined = deduplicateColors([...hexColors, ...nameColors]);

    if (combined.length >= 5) return combined.slice(0, 5);

    // Fallback: search specifically for color aesthetic
    const query2 = `${prompt} color palette mood board hex`;
    const { stdout: stdout2 } = await execAsync(
      `pplx search web ${JSON.stringify(query2)} 2>/dev/null`,
      { timeout: 8000, env: { ...process.env } }
    );
    const data2 = JSON.parse(stdout2);
    const allText2 = (data2.hits || [])
      .map((h: any) => `${h.title || ""} ${h.snippet || ""} ${h.summary || ""}`)
      .join(" ");

    const hexColors2 = extractHexCodes(allText2);
    const nameColors2 = extractColorNames(allText2 + " " + prompt);
    const combined2 = deduplicateColors([...combined, ...hexColors2, ...nameColors2]);

    return combined2.slice(0, 5);
  } catch (err) {
    console.error("AI color search error:", err);
    return [];
  }
}

// Smart fallback: use name-based color extraction without API
export function promptToColorsFallback(prompt: string): string[] {
  const colors = extractColorNames(prompt);
  if (colors.length >= 5) return colors.slice(0, 5);

  // Mood-based fallbacks
  const lower = prompt.toLowerCase();
  const MOOD_PALETTES: Record<string, string[]> = {
    dark: ["#1a1a2e","#16213e","#0f3460","#533483","#e94560"],
    light: ["#f8f9fa","#e9ecef","#dee2e6","#adb5bd","#6c757d"],
    warm: ["#ff6b6b","#ffa502","#ff6348","#ff4757","#eccc68"],
    cool: ["#70a1ff","#1e90ff","#5352ed","#3742fa","#00d2d3"],
    neon: ["#ff00ff","#00ffff","#ff3300","#00ff66","#ffff00"],
    minimal: ["#2d3436","#636e72","#b2bec3","#dfe6e9","#f9f9f9"],
    retro: ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#845ec2"],
    cyber: ["#ff0090","#00fff9","#7700ff","#ffee00","#ff4500"],
    gothic: ["#1a0a0a","#4a0e0e","#800020","#c41e3a","#8b0000"],
    summer: ["#ffd700","#ff8c00","#00ced1","#32cd32","#ff6347"],
    winter: ["#b0c4de","#4169e1","#add8e6","#e0ffff","#7b68ee"],
    spring: ["#ff69b4","#98fb98","#fffacd","#b0e0e6","#ffb6c1"],
    fall: ["#d84315","#ff6f00","#f57c00","#795548","#ff8f00"],
    sad: ["#4a5568","#718096","#a0aec0","#2d3748","#1a202c"],
    happy: ["#ffd700","#ff8c00","#ff6b6b","#00d2ff","#a29bfe"],
    angry: ["#ff0000","#cc0000","#990000","#660000","#ff4500"],
    calm: ["#81ecec","#74b9ff","#a29bfe","#fd79a8","#fdcb6e"],
    luxury: ["#d4af37","#c0a060","#b8860b","#daa520","#ffd700"],
    nature: ["#2d5016","#4a7c59","#6b8e23","#228b22","#8fbc8f"],
    ocean: ["#006994","#0e86d4","#055a8c","#003060","#68bbe3"],
    fire: ["#ff4500","#ff6347","#ff8c00","#ffa500","#ffd700"],
    space: ["#0b0c1a","#1a1a3e","#2d1b69","#533483","#6f42c1"],
    dreamy: ["#a8edea","#fed6e3","#d299c2","#fef9d7","#96c3eb"],
    grungy: ["#2c2c2c","#4a3728","#6b4226","#8b5e3c","#a0785a"],
    electric: ["#7df9ff","#00b4d8","#0077b6","#023e8a","#03045e"],
    psychedelic: ["#ff006e","#8338ec","#3a86ff","#06d6a0","#ffbe0b"],
  };

  for (const [key, palette] of Object.entries(MOOD_PALETTES)) {
    if (lower.includes(key)) return palette;
  }

  // Last resort — generate from hash of prompt
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
  const base = Math.abs(hash) % 360;
  return [
    `hsl(${base}, 70%, 50%)`,
    `hsl(${(base + 72) % 360}, 65%, 45%)`,
    `hsl(${(base + 144) % 360}, 80%, 55%)`,
    `hsl(${(base + 216) % 360}, 60%, 40%)`,
    `hsl(${(base + 288) % 360}, 75%, 60%)`,
  ].map(hslStrToHex);
}

function hslStrToHex(hsl: string): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return "#888888";
  const h = +m[1], s = +m[2] / 100, l = +m[3] / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
