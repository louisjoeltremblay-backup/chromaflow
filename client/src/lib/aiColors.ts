// ─── ChromaFlow AI Color Engine — Client-Side ─────────────────────────────────
// Fetches real color associations from Perplexity search API via our backend proxy,
// with a rich client-side fallback covering music, art, cinema, moods, and more.

import { hslToHex, rgbToHex } from "./colorEngine";

// ── Extract #RRGGBB codes from any text ──────────────────────────────────────
export function extractHexCodes(text: string): string[] {
  const matches = text.match(/#[0-9a-fA-F]{6}\b/g) || [];
  return [...new Set(matches.map((h) => h.toLowerCase()))];
}

// ── Huge color keyword → hex dictionary ──────────────────────────────────────
const KEYWORD_HEX: Record<string, string> = {
  // Basic
  red:"#e53e3e", crimson:"#dc143c", scarlet:"#ff2400", burgundy:"#800020", maroon:"#800000",
  ruby:"#9b111e", rose:"#ff007f", magenta:"#ff00ff", pink:"#ff69b4", hotpink:"#ff1493",
  fuchsia:"#ff00ff", coral:"#ff6b6b", salmon:"#fa8072", orange:"#ff8c00", amber:"#ffbf00",
  gold:"#ffd700", yellow:"#ffd700", lemon:"#fff44f", lime:"#bfff00", chartreuse:"#7fff00",
  green:"#2d8653", emerald:"#50c878", mint:"#98ff98", teal:"#008080", cyan:"#00bcd4",
  turquoise:"#40e0d0", aqua:"#00ffff", sky:"#87ceeb", cerulean:"#0099cd", blue:"#2b6cb0",
  navy:"#001f5b", indigo:"#3f00ff", cobalt:"#0047ab", violet:"#ee82ee", purple:"#7b2fbe",
  lavender:"#b57bdb", lilac:"#c8a2c8", plum:"#dda0dd", mauve:"#e0b0ff", orchid:"#da70d6",
  white:"#ffffff", ivory:"#fffff0", cream:"#fffdd0", beige:"#f5f5dc", tan:"#d2b48c",
  brown:"#964b00", chocolate:"#7b3f00", coffee:"#6f4e37", black:"#0a0a0a", charcoal:"#36454f",
  slate:"#708090", gray:"#808080", grey:"#808080", silver:"#c0c0c0", smoke:"#738276",
  // Neons / cyber
  neon:"#39ff14", electric:"#7df9ff", toxic:"#00ff00", acid:"#b0bf1a", glitch:"#ff00ff",
  cyber:"#00fff9", holo:"#cc99ff", plasma:"#df00ff", ultraviolet:"#7f00ff",
  // Materials / textures
  metallic:"#aaa9ad", chrome:"#dbe2e9", steel:"#7f8fa6", iron:"#4a4a4a", bronze:"#cd7f32",
  copper:"#b87333", brass:"#b5a642", rust:"#b7410e", terracotta:"#e2725b", clay:"#c4825a",
  // Nature
  forest:"#228b22", pine:"#01796f", moss:"#8a9a5b", olive:"#808000", sage:"#b2ac88",
  ocean:"#006994", sea:"#2e8b57", glacier:"#80b8d0", frost:"#a0c0c8", ice:"#d0e8f0",
  sand:"#c2b280", desert:"#c19a6b", earth:"#8b4513", mud:"#704214", soil:"#3d2b1f",
  // Weather / sky
  storm:"#4b5563", thunder:"#5b6066", fog:"#c8c8c8", mist:"#c8d8e0", cloud:"#d3d3d3",
  midnight:"#191970", dusk:"#e6b17e", dawn:"#f9a472", twilight:"#e3a857", sunset:"#ff6b35",
  sunrise:"#ff9f45", moonlight:"#e8e8f0", starlight:"#c8d8ff",
  // Emotions / moods
  dark:"#1a1a2e", shadow:"#1c2526", void:"#080808", darkness:"#0f0f0f",
  dreamy:"#a8edea", ethereal:"#e0d0ff", mystical:"#6b4fa0", enchanted:"#7b2d8b",
  romantic:"#c2185b", passionate:"#b71c1c", fierce:"#e64a19", wild:"#558b2f",
  calm:"#81ecec", peaceful:"#74b9ff", serene:"#a29bfe", tranquil:"#00cec9",
  happy:"#ffd700", joyful:"#ffb300", vibrant:"#ff6700", vivid:"#cc0000",
  sad:"#4a5568", melancholy:"#5c6bc0", nostalgic:"#a1887f", lonely:"#37474f",
  angry:"#c62828", rage:"#b71c1c", fury:"#d84315", danger:"#f44336",
  cold:"#b3e5fc", frozen:"#e1f5fe", arctic:"#e0f7fa", winter:"#78909c",
  warm:"#ff8f00", hot:"#ff6f00", fire:"#ff4500", flame:"#ff3d00", inferno:"#bf360c",
  // Pop culture / music moods
  retro:"#ff6b6b", vaporwave:"#ff71ce", synthwave:"#7f00ff", lofi:"#a8c5da",
  punk:"#ff0055", grunge:"#5c4033", gothic:"#1a0a0a", emo:"#2d1b2e",
  glam:"#e91e63", disco:"#ffd700", rave:"#ff00ff", techno:"#0a0a2e",
  jazz:"#4a3000", blues:"#1565c0", soul:"#4e342e", gospel:"#f9a825",
  classical:"#795548", opera:"#880e4f", baroque:"#8d6e63", renaissance:"#a1887f",
  // Lady Gaga specific
  gaga:"#d926be", mayhem:"#d926be", chromatica:"#ff6eb4", joanne:"#b0a090",
  artpop:"#ff00aa", fame:"#c0a0d0", monster:"#8b0000", poker:"#d4a017",
  alejandro:"#1a1a3e", paparazzi:"#gold",
  // Artists / bands
  bowie:"#e8a0c0", prince:"#800080", madonna:"#ff1493", beyonce:"#f5c518",
  rihanna:"#ff4757", drake:"#1a1a2e", weeknd:"#8b0000", doja:"#ff69b4",
  billie:"#00ff85", lana:"#f8c8d0", olivia:"#ff6b9d", taylor:"#d4a0c0",
  nirvana:"#a0c0d0", radiohead:"#303030", metallica:"#1a1a1a", acdc:"#c0392b",
  // Movies / shows
  matrix:"#00ff41", interstellar:"#1a0a00", dune:"#c19a6b", blade:"#b22222",
  avatar:"#00ffff", inception:"#4a4a6a", tenet:"#2c3e50", arrival:"#404050",
  alien:"#00ff00", predator:"#ff6600", terminator:"#c0c0c0", batman:"#2c2c2c",
  joker:"#8b0000", marvel:"#e23636", dc:"#0075f2", disney:"#1a78c2",
  // Fashion / design
  luxury:"#d4af37", minimal:"#f5f5f5", brutalist:"#808080", bauhaus:"#e53935",
  art_deco:"#c9a96e", modernist:"#2196f3", postmodern:"#ff5722",
  // Food / drinks
  coffee_brown:"#6f4e37", espresso:"#3c1a0a", mocha:"#7b3f00", caramel:"#c68642",
  vanilla:"#f3e5ab", chocolate_dark:"#3d1a00", wine_red:"#722f37", champagne:"#f7e7ce",
  blood_orange:"#cc3300", mango:"#fdbe02", tropical:"#00b16a",
};

// ── Map a prompt to colors using keyword matching ─────────────────────────────
export function extractColorsFromText(text: string): string[] {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = lower.split(/\s+/);
  const found: string[] = [];

  // Try single words
  for (const word of words) {
    if (KEYWORD_HEX[word] && !found.includes(KEYWORD_HEX[word])) {
      found.push(KEYWORD_HEX[word]);
    }
  }

  // Try bigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + "_" + words[i + 1];
    if (KEYWORD_HEX[bigram] && !found.includes(KEYWORD_HEX[bigram])) {
      found.push(KEYWORD_HEX[bigram]);
    }
  }

  return found.filter((c) => /^#[0-9a-fA-F]{6}$/i.test(c));
}

// ── Mood palette map for full-phrase matching ─────────────────────────────────
const MOOD_PALETTES: [RegExp, string[]][] = [
  // Artists / albums
  [/lady\s*gaga|mayhem|chromatica|artpop|fame\s*monster/i, ["#d926be","#ff00aa","#7700ff","#ff71ce","#c0a0d0"]],
  [/bowie|ziggy|aladdin\s*sane|glam\s*rock/i,             ["#e8a0c0","#c0c060","#4040c0","#e04040","#f0f0a0"]],
  [/blade\s*runner|cyberpunk|neon\s*city|tokyo\s*night/i,  ["#ff0090","#00fff9","#7700ff","#ff4500","#120020"]],
  [/dune|arrakis|spice|desert\s*planet/i,                  ["#c19a6b","#8b6914","#d4a96a","#f0e0b0","#704214"]],
  [/matrix|neo|morpheus|simulation/i,                      ["#00ff41","#003b00","#00c030","#1a3300","#80ff80"]],
  [/stranger\s*things|upside\s*down|hawkins/i,             ["#c81d25","#1a1a3e","#ff3300","#7b00d4","#090909"]],
  [/halloween|horror|spooky|creepy/i,                      ["#ff6600","#1a0a00","#800000","#0a0a0a","#4a0080"]],
  [/christmas|holiday|winter|snow/i,                       ["#c41e3a","#165b33","#f8b229","#ffffff","#146b3a"]],
  [/ocean|beach|tropical|caribbean/i,                      ["#006994","#00b4d8","#0077b6","#48cae4","#90e0ef"]],
  [/sunset|golden\s*hour|dusk|twilight/i,                  ["#ff6b35","#f7931e","#fdc830","#fc4a1a","#ff8c42"]],
  [/forest|jungle|nature|botanical/i,                      ["#2d5016","#4a7c59","#6b8e23","#228b22","#8fbc8f"]],
  [/galaxy|space|cosmos|nebula|universe/i,                 ["#0b0c1a","#1a1a3e","#2d1b69","#6f42c1","#c084fc"]],
  [/pastel|soft|gentle|kawaii/i,                           ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff"]],
  [/neon|rave|edm|festival/i,                              ["#ff00ff","#00ffff","#ff3300","#00ff66","#ffff00"]],
  [/vaporwave|aesthetic|lo.?fi|retro\s*wave/i,             ["#ff71ce","#01cdfe","#05ffa1","#b967ff","#fffb96"]],
  [/gothic|goth|dark\s*wave|cemetery/i,                    ["#1a0a0a","#4a0e0e","#800020","#c41e3a","#2d0a2d"]],
  [/minimalist|minimal|clean|white/i,                      ["#ffffff","#f5f5f5","#e0e0e0","#bdbdbd","#9e9e9e"]],
  [/luxury|gold|premium|elegant|royal/i,                   ["#d4af37","#c0a060","#b8860b","#1a1a1a","#f0e68c"]],
  [/fire|flame|burning|inferno|lava/i,                     ["#ff4500","#ff6347","#ff8c00","#ffa500","#ffd700"]],
  [/ice|frozen|arctic|glacial|tundra/i,                    ["#b3e5fc","#e1f5fe","#4fc3f7","#81d4fa","#bbdefb"]],
  [/cyberpunk|dystopia|megacity|tech\s*noir/i,             ["#ff0090","#00fff9","#7700ff","#ffee00","#ff4500"]],
  [/marvel|superhero|avengers|comic/i,                     ["#e23636","#1a78c2","#f0e130","#1a1a1a","#518649"]],
  [/nirvana|grunge|seattle|kurt/i,                         ["#a0c0d0","#5c4033","#607080","#2c3e50","#8d6e63"]],
  [/metallica|metal|heavy|thrash/i,                        ["#1a1a1a","#2c2c2c","#3d3d3d","#c0392b","#707070"]],
  [/jazz|blues|soul|swing/i,                               ["#4a3000","#8b6914","#c0882a","#1565c0","#2e1a00"]],
  [/bubblegum|pop|bright|fun/i,                            ["#ff69b4","#ffef00","#00cfff","#ff8c00","#a020f0"]],
  [/earth\s*tone|terracotta|bohemian|boho/i,               ["#e2725b","#c68642","#8b6914","#556b2f","#d2b48c"]],
  [/monochrome|grayscale|black\s*white/i,                  ["#000000","#404040","#808080","#bdbdbd","#ffffff"]],
  [/sunrise|morning|dawn|aurora/i,                         ["#ff9f45","#ffb347","#ffd194","#f9a8d4","#c084fc"]],
  [/rain|stormy|thunderstorm|moody/i,                      ["#4b5563","#6b7280","#9ca3af","#374151","#1f2937"]],
  [/spring|bloom|floral|garden/i,                          ["#ffb7c5","#98d8c8","#fff9a5","#b4e7ce","#e8f5e9"]],
  [/summer|beach|sun|vacation/i,                           ["#ffd700","#ff8c00","#00ced1","#32cd32","#ff6347"]],
  [/autumn|fall|harvest|pumpkin/i,                         ["#d84315","#ff6f00","#f57c00","#795548","#ff8f00"]],
  [/radiohead|thom\s*yorke|ok\s*computer/i,                ["#303030","#484848","#c0c0c0","#3060a0","#1a1a1a"]],
  [/prince|purple\s*rain/i,                                ["#800080","#4b0082","#ff00ff","#9400d3","#d4af37"]],
  [/pink\s*floyd|dark\s*side|prism/i,                      ["#000000","#ff0000","#ff8c00","#ffff00","#00ff00"]],
  [/taylor|swift|eras|folklore/i,                          ["#d4a0c0","#9b8ea0","#3c3050","#c0a870","#4a6080"]],
  [/billie|eilish|happier|bad\s*guy/i,                     ["#00ff85","#1a1a1a","#00c060","#ffffff","#303030"]],
  [/weeknd|blinding\s*lights|xo/i,                         ["#8b0000","#ff0040","#1a0000","#c00030","#300010"]],
  [/doja\s*cat|planet\s*her/i,                             ["#ff69b4","#9b59b6","#e91e63","#ff1493","#8b008b"]],
  [/lana\s*del\s*rey|ultraviolence|born\s*to\s*die/i,      ["#f8c8d0","#c8a0b8","#9080a0","#604870","#a0d0e8"]],
];

// ── Generate from deterministic hash when nothing else matches ────────────────
function hashPalette(prompt: string): string[] {
  let h = 5381;
  for (let i = 0; i < prompt.length; i++) h = ((h << 5) + h + prompt.charCodeAt(i)) | 0;
  const base = Math.abs(h) % 360;
  return [0, 72, 144, 216, 288].map((offset, i) => {
    const hue = (base + offset) % 360;
    const sat = 55 + (Math.abs(h >> (i * 3)) % 30);
    const lig = 35 + (Math.abs(h >> (i * 5)) % 35);
    return hslToHex(hue, sat, lig);
  });
}

// ── Main client-side AI function ──────────────────────────────────────────────
export function clientAiColors(prompt: string): { colors: string[]; source: string } {
  const lower = prompt.toLowerCase().trim();

  // 1. Try mood palette regex matches
  for (const [regex, palette] of MOOD_PALETTES) {
    if (regex.test(lower)) {
      return { colors: palette, source: "ai-match" };
    }
  }

  // 2. Try keyword extraction
  const keywordColors = extractColorsFromText(prompt);
  if (keywordColors.length >= 3) {
    // Pad to 5 with hue-rotated variants
    while (keywordColors.length < 5) {
      const base = keywordColors[keywordColors.length - 1];
      const hex = parseInt(base.replace("#", ""), 16);
      const r = ((hex >> 16) + 30) & 255;
      const g = ((hex >> 8) & 255);
      const b = (hex & 255 + 30) & 255;
      keywordColors.push(rgbToHex(r, g, b));
    }
    return { colors: keywordColors.slice(0, 5), source: "keyword" };
  }

  // 3. Hash-based deterministic fallback
  return { colors: hashPalette(prompt), source: "generated" };
}

// ── Server-side search (calls our Express proxy) ──────────────────────────────
export async function serverAiColors(
  prompt: string,
  signal?: AbortSignal
): Promise<{ colors: string[]; source: string }> {
  const res = await fetch("/api/ai-colors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}
