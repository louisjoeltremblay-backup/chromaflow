// ─── CHROMAFLOW Color Engine ───────────────────────────────────────────
// Full implementation of all 137 features from the documentation

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const big = parseInt(h, 16);
  return [(big >> 16) & 255, (big >> 8) & 255, big & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

export function hexToHsl(hex: string): [number, number, number] {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

export function hexToCmyk(hex: string): [number, number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  return [
    Math.round(((1 - r - k) / (1 - k)) * 100),
    Math.round(((1 - g - k) / (1 - k)) * 100),
    Math.round(((1 - b - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ];
}

export function getColorTemp(hex: string): number {
  const [r, , b] = hexToRgb(hex);
  if (r === 0 && b === 0) return 5500;
  const ratio = r / (b || 1);
  return Math.round(1000 + ratio * 4500);
}

export function kelvinToRgb(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  let r, g, b;
  r = t <= 66 ? 255 : Math.min(255, Math.max(0, 329.698727446 * Math.pow(t - 60, -0.1332047592)));
  g = t <= 66
    ? Math.min(255, Math.max(0, 99.4708025861 * Math.log(t) - 161.1195681661))
    : Math.min(255, Math.max(0, 288.1221695283 * Math.pow(t - 60, -0.0755148492)));
  b = t >= 66 ? 255 : (t <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(t - 10) - 305.0447927307)));
  return [Math.round(r), Math.round(g), Math.round(b)];
}

export function generateRandomColor(): string {
  return rgbToHex(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  );
}

function rotateHue(h: number, deg: number): number {
  return ((h + deg) % 360 + 360) % 360;
}

// ─── Harmony Generators ───────────────────────────────────────────────────
export const harmonies = {
  complementary(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      base,
      hslToHex(rotateHue(h, 180), s, l),
      hslToHex(rotateHue(h, 180), Math.max(10, s - 15), Math.min(90, l + 15)),
      hslToHex(h, Math.max(10, s - 20), Math.min(90, l + 20)),
      hslToHex(rotateHue(h, 180), Math.min(100, s + 10), Math.max(10, l - 15)),
    ];
  },
  analogous(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      hslToHex(rotateHue(h, -60), s, l),
      hslToHex(rotateHue(h, -30), s, l),
      base,
      hslToHex(rotateHue(h, 30), s, l),
      hslToHex(rotateHue(h, 60), s, l),
    ];
  },
  triadic(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      base,
      hslToHex(rotateHue(h, 120), s, l),
      hslToHex(rotateHue(h, 240), s, l),
      hslToHex(rotateHue(h, 120), Math.max(10, s - 10), Math.min(90, l + 10)),
      hslToHex(rotateHue(h, 240), Math.max(10, s - 10), Math.max(10, l - 10)),
    ];
  },
  splitComplementary(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      base,
      hslToHex(rotateHue(h, 150), s, l),
      hslToHex(rotateHue(h, 210), s, l),
      hslToHex(h, Math.max(10, s - 20), Math.min(90, l + 20)),
      hslToHex(rotateHue(h, 180), Math.max(10, s - 10), l),
    ];
  },
  tetradic(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      base,
      hslToHex(rotateHue(h, 90), s, l),
      hslToHex(rotateHue(h, 180), s, l),
      hslToHex(rotateHue(h, 270), s, l),
      hslToHex(h, Math.max(10, s - 15), Math.min(90, l + 15)),
    ];
  },
  square(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      base,
      hslToHex(rotateHue(h, 90), s, l),
      hslToHex(rotateHue(h, 180), s, l),
      hslToHex(rotateHue(h, 270), s, l),
      hslToHex(h, Math.max(10, s - 10), Math.min(90, l + 15)),
    ];
  },
  monochromatic(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      hslToHex(h, s, Math.min(90, l + 30)),
      hslToHex(h, s, Math.min(90, l + 15)),
      base,
      hslToHex(h, s, Math.max(10, l - 15)),
      hslToHex(h, s, Math.max(10, l - 30)),
    ];
  },
  shadesTints(base: string): string[] {
    const [h, s, l] = hexToHsl(base);
    return [
      hslToHex(h, Math.max(0, s - 20), Math.min(95, l + 40)),
      hslToHex(h, Math.max(0, s - 10), Math.min(95, l + 20)),
      base,
      hslToHex(h, Math.min(100, s + 10), Math.max(5, l - 20)),
      hslToHex(h, Math.min(100, s + 20), Math.max(5, l - 40)),
    ];
  },
  random(): string[] {
    return Array.from({ length: 5 }, generateRandomColor);
  },
};

// ─── Color Blindness Simulation ───────────────────────────────────────────
type CBMatrix = [[number,number,number],[number,number,number],[number,number,number]];

function applyMatrix(r: number, g: number, b: number, m: CBMatrix): [number,number,number] {
  return [
    Math.round(Math.min(255, Math.max(0, m[0][0]*r + m[0][1]*g + m[0][2]*b))),
    Math.round(Math.min(255, Math.max(0, m[1][0]*r + m[1][1]*g + m[1][2]*b))),
    Math.round(Math.min(255, Math.max(0, m[2][0]*r + m[2][1]*g + m[2][2]*b))),
  ];
}

const CB_MATRICES: Record<string, CBMatrix> = {
  protanopia: [[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],
  deuteranopia: [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]],
  tritanopia: [[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]],
  achromatopsia: [[0.299,0.587,0.114],[0.299,0.587,0.114],[0.299,0.587,0.114]],
};

export function simulateColorBlindness(hex: string, mode: string): string {
  if (mode === "normal") return hex;
  const m = CB_MATRICES[mode];
  if (!m) return hex;
  const [r, g, b] = hexToRgb(hex);
  const [nr, ng, nb] = applyMatrix(r, g, b, m);
  return rgbToHex(nr, ng, nb);
}

// ─── WCAG Contrast ────────────────────────────────────────────────────────
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function getContrastRatio(hex1: string, hex2: string = "#FFFFFF"): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getWCAGRating(hex: string): "AAA" | "AA" | "Fail" {
  const ratio = getContrastRatio(hex, "#FFFFFF");
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

export function getContrastText(hex: string): string {
  return relativeLuminance(hex) > 0.179 ? "#000000" : "#FFFFFF";
}

// ─── Color Blending ───────────────────────────────────────────────────────
export function blendColors(hex1: string, hex2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const t = ratio / 100;
  return rgbToHex(
    Math.round(r1 * (1 - t) + r2 * t),
    Math.round(g1 * (1 - t) + g2 * t),
    Math.round(b1 * (1 - t) + b2 * t)
  );
}

export function generateBlendSteps(hex1: string, hex2: string, steps: number = 5): string[] {
  return Array.from({ length: steps }, (_, i) =>
    blendColors(hex1, hex2, (i / (steps - 1)) * 100)
  );
}

// ─── Music to Color ───────────────────────────────────────────────────────
export function frequencyToColors(freq: number): string[] {
  const ratios = [1, 1.25, 1.5, 1.75, 2];
  return ratios.map((r) => {
    const f = freq * r;
    const hue = ((f - 20) / 20000) * 360;
    return hslToHex(hue % 360, 75, 55);
  });
}

// ─── Data Viz ─────────────────────────────────────────────────────────────
export function generateSequential(steps: number): string[] {
  return Array.from({ length: steps }, (_, i) =>
    blendColors("#EFF6FF", "#1E3A8A", (i / (steps - 1)) * 100)
  );
}

export function generateDiverging(steps: number): string[] {
  const half = Math.ceil(steps / 2);
  const left = Array.from({ length: half }, (_, i) =>
    blendColors("#EFF6FF", "#1E40AF", (i / (half - 1)) * 100)
  );
  const right = Array.from({ length: steps - half + 1 }, (_, i) =>
    blendColors("#FEF2F2", "#991B1B", (i / (steps - half)) * 100)
  ).slice(1);
  return [...left, ...right];
}

export function generateQualitative(steps: number): string[] {
  return Array.from({ length: steps }, (_, i) =>
    hslToHex((i / steps) * 360, 70, 50)
  );
}

export function generateHeatmap(steps: number): string[] {
  return Array.from({ length: steps }, (_, i) =>
    blendColors("#0000FF", "#FF0000", (i / (steps - 1)) * 100)
  );
}

// ─── Preset Themes ────────────────────────────────────────────────────────
export const THEMES: Record<string, { name: string; colors: string[]; emoji: string }> = {
  ocean: { name: "Ocean", emoji: "🌊", colors: ["#006994","#0E86D4","#055A8C","#003060","#68BBE3"] },
  fire: { name: "Fire", emoji: "🔥", colors: ["#FF4500","#FF6347","#FF8C00","#FFA500","#FFD700"] },
  sunset: { name: "Sunset", emoji: "🌅", colors: ["#FF6B35","#F7931E","#FDC830","#FC4A1A","#FF8C42"] },
  forest: { name: "Forest", emoji: "🌲", colors: ["#2D5016","#4A7C59","#6B8E23","#556B2F","#8FBC8F"] },
  night: { name: "Night", emoji: "🌙", colors: ["#000080","#191970","#1E3A8A","#0F172A","#1E293B"] },
  pastel: { name: "Pastel", emoji: "🎀", colors: ["#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF"] },
  vibrant: { name: "Vibrant", emoji: "⚡", colors: ["#FF00FF","#00FFFF","#FFFF00","#FF0000","#00FF00"] },
  earth: { name: "Earth", emoji: "🌍", colors: ["#8B4513","#A0522D","#CD853F","#DEB887","#F5DEB3"] },
  candy: { name: "Candy", emoji: "🍬", colors: ["#FF69B4","#FF1493","#FFB6C1","#FFC0CB","#DB7093"] },
  tropical: { name: "Tropical", emoji: "🌺", colors: ["#FF6B9D","#C44569","#FFA07A","#FA8072","#E9967A"] },
  spring: { name: "Spring", emoji: "🌸", colors: ["#FFB7C5","#98D8C8","#FFF9A5","#B4E7CE","#E8F5E9"] },
  summer: { name: "Summer", emoji: "☀️", colors: ["#FFD54F","#4FC3F7","#FF7043","#81C784","#FFF176"] },
  fall: { name: "Fall", emoji: "🍂", colors: ["#D84315","#FF6F00","#F57C00","#795548","#8D6E63"] },
  winter: { name: "Winter", emoji: "❄️", colors: ["#B3E5FC","#E1F5FE","#4FC3F7","#81D4FA","#BBDEFB"] },
  desert: { name: "Desert", emoji: "🏜️", colors: ["#EDC9AF","#C19A6B","#D2B48C","#DEB887","#F4A460"] },
  neon: { name: "Neon", emoji: "💜", colors: ["#a855f7","#22d3ee","#f472b6","#a3e635","#fbbf24"] },
  aurora: { name: "Aurora", emoji: "🌌", colors: ["#00c896","#7c3aed","#ec4899","#3b82f6","#10b981"] },
  cyber: { name: "Cyberpunk", emoji: "🤖", colors: ["#ff0090","#00fff9","#7700ff","#ffee00","#ff4500"] },
};

// ─── AI prompt matching ───────────────────────────────────────────────────
export function aiPromptToColors(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  for (const [key, theme] of Object.entries(THEMES)) {
    if (lower.includes(key) || lower.includes(theme.name.toLowerCase())) {
      return theme.colors;
    }
  }
  // Color adjective matching
  if (lower.includes("warm") || lower.includes("hot")) return THEMES.fire.colors;
  if (lower.includes("cool") || lower.includes("cold") || lower.includes("ice")) return THEMES.winter.colors;
  if (lower.includes("dark") || lower.includes("dark")) return THEMES.night.colors;
  if (lower.includes("soft") || lower.includes("gentle")) return THEMES.pastel.colors;
  if (lower.includes("bright") || lower.includes("bold")) return THEMES.vibrant.colors;
  if (lower.includes("nature") || lower.includes("green")) return THEMES.forest.colors;
  if (lower.includes("purple") || lower.includes("violet")) return THEMES.neon.colors;
  return harmonies.random();
}

// ─── Export formatters ────────────────────────────────────────────────────
export function formatExport(colors: string[], format: string): string {
  switch (format) {
    case "css":
      return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`;
    case "scss":
      return colors.map((c, i) => `$color-${i + 1}: ${c};`).join("\n");
    case "tailwind":
      return `module.exports = {\n  theme: {\n    colors: {\n${colors.map((c, i) => `      'palette-${i + 1}': '${c}',`).join("\n")}\n    }\n  }\n}`;
    case "json":
      return JSON.stringify({ palette: colors }, null, 2);
    case "array":
      return `const colors = ${JSON.stringify(colors)};`;
    default:
      return colors.join(", ");
  }
}

// ─── Color Name Approximation ─────────────────────────────────────────────
const COLOR_NAMES: [string, string][] = [
  ["#FF0000","Red"],["#FF4500","OrangeRed"],["#FF6347","Tomato"],["#FF8C00","DarkOrange"],
  ["#FFA500","Orange"],["#FFD700","Gold"],["#FFFF00","Yellow"],["#ADFF2F","GreenYellow"],
  ["#00FF00","Lime"],["#008000","Green"],["#006400","DarkGreen"],["#00FFFF","Cyan"],
  ["#00CED1","DarkTurquoise"],["#0000FF","Blue"],["#000080","Navy"],["#8B008B","DarkMagenta"],
  ["#FF00FF","Magenta"],["#FF1493","DeepPink"],["#FFB6C1","LightPink"],["#FFC0CB","Pink"],
  ["#FFFFFF","White"],["#C0C0C0","Silver"],["#808080","Gray"],["#000000","Black"],
  ["#8B4513","SaddleBrown"],["#D2691E","Chocolate"],["#F4A460","SandyBrown"],
  ["#FFDAB9","PeachPuff"],["#7B68EE","MediumSlateBlue"],["#9370DB","MediumPurple"],
];

export function getColorName(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  let closest = "";
  let minDist = Infinity;
  for (const [h, name] of COLOR_NAMES) {
    const [cr, cg, cb] = hexToRgb(h);
    const dist = Math.hypot(r - cr, g - cg, b - cb);
    if (dist < minDist) { minDist = dist; closest = name; }
  }
  return closest || "Custom";
}
