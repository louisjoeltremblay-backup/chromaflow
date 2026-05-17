import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { clientAiColors, serverAiColors } from "@/lib/aiColors";
import {
  hexToRgb, hexToHsl, hexToHsv, hexToCmyk, getColorTemp, kelvinToRgb, rgbToHex,
  hslToHex, generateRandomColor, harmonies, simulateColorBlindness,
  getContrastRatio, getWCAGRating, getContrastText, blendColors, generateBlendSteps,
  frequencyToColors, generateSequential, generateDiverging, generateQualitative,
  generateHeatmap, THEMES, formatExport, getColorName,
} from "@/lib/colorEngine";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/achievements";
import { ColorWheel } from "@/components/ColorWheel";
import type { Palette } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────
type HarmonyMode = "complementary"|"analogous"|"triadic"|"splitComplementary"|"tetradic"|"square"|"monochromatic"|"shadesTints"|"random";
type VisionMode = "normal"|"protanopia"|"deuteranopia"|"tritanopia"|"achromatopsia";
type Tab = "generator"|"blend"|"image"|"gradient"|"dataviz"|"music"|"ai"|"seasonal"|"export"|"saved";
type GradientType = "linear"|"radial"|"conic";
type DataVizType = "sequential"|"diverging"|"qualitative"|"heatmap";
type ExportFormat = "css"|"scss"|"tailwind"|"json"|"array";

// ─── Achievement Toast ────────────────────────────────────────────────────────
function AchievementToast({ name, icon, onClose }: { name: string; icon: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="achievement-toast fixed bottom-6 right-6 z-[100] glass-card px-5 py-4 flex items-center gap-3 min-w-[260px]">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-[10px] text-purple-400 font-semibold uppercase tracking-widest">Achievement Unlocked</div>
        <div className="text-sm font-bold text-white mt-0.5">{name}</div>
      </div>
      <div className="ml-auto text-purple-400 opacity-60 text-xs">+50 pts</div>
    </div>
  );
}

// ─── Color Card ───────────────────────────────────────────────────────────────
function ColorCard({
  color, index, locked, onLock, onOpenWheel, onCopy, onShuffle, visionMode,
}: {
  color: string; index: number; locked: boolean;
  onLock: (i: number) => void;
  onOpenWheel: (color: string, index: number) => void;
  onCopy: (hex: string) => void;
  onShuffle: (i: number) => void;
  visionMode: VisionMode;
}) {
  const displayColor = simulateColorBlindness(color, visionMode);
  const textColor = getContrastText(displayColor);
  const wcag = getWCAGRating(displayColor);
  const [h, s, l] = hexToHsl(color);
  const name = getColorName(color);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color);
    setCopied(true);
    onCopy(color);
    setTimeout(() => setCopied(false), 1500);
  };

  const wcagColors = { AAA: "bg-emerald-500/90", AA: "bg-yellow-500/90", Fail: "bg-red-500/90" };

  return (
    <div
      className="color-card flex-1 min-w-0 flex flex-col"
      style={{ backgroundColor: displayColor, minHeight: 180 }}
      data-testid={`color-card-${index}`}
    >
      <div className="card-overlay" />

      {/* Top row */}
      <div className="relative flex items-start justify-between p-2.5">
        <button
          onClick={(e) => { e.stopPropagation(); onLock(index); }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
          style={{ background: "rgba(0,0,0,0.35)", color: textColor }}
          data-testid={`lock-btn-${index}`}
          title={locked ? "Unlock color" : "Lock color"}
        >
          {locked ? "🔒" : "🔓"}
        </button>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${wcagColors[wcag]}`} style={{ color: "#fff" }}>
          {wcag}
        </span>
      </div>

      {/* Center — click opens wheel */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center gap-1 px-3 cursor-pointer group"
        onClick={() => onOpenWheel(color, index)}
        title="Click to open color wheel"
      >
        <div className="text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: textColor }}>{name}</div>
        <div className="text-sm font-bold font-mono group-hover:scale-105 transition-transform" style={{ color: textColor }}>{color.toUpperCase()}</div>
        {/* shuffle icon on hover */}
        {!locked && (
          <div
            className="opacity-0 group-hover:opacity-70 transition-opacity text-lg mt-1 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onShuffle(index); }}
            title="Shuffle this color"
            style={{ color: textColor }}
          >↺</div>
        )}
      </div>

      {/* Bottom */}
      <div className="relative flex items-center justify-between p-2.5">
        <div className="text-[9px] opacity-55 font-mono leading-tight" style={{ color: textColor }}>
          H{h}° S{s}%<br/>L{l}%
        </div>
        <button
          onClick={handleCopy}
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-transform active:scale-90"
          style={{ background: "rgba(0,0,0,0.35)", color: textColor }}
          data-testid={`copy-btn-${index}`}
          title="Copy HEX"
        >
          {copied ? "✓" : "⎘"}
        </button>
      </div>

      {/* Locked bar */}
      {locked && <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(168,85,247,0.7)" }} />}
    </div>
  );
}

// ─── Color Info Modal ─────────────────────────────────────────────────────────
function ColorInfoModal({ color, onClose }: { color: string; onClose: () => void }) {
  const [r, g, b] = hexToRgb(color);
  const [h, s, l] = hexToHsl(color);
  const [hv, sv, v] = hexToHsv(color);
  const [c, m, y, k] = hexToCmyk(color);
  const temp = getColorTemp(color);
  const ratio = getContrastRatio(color);
  const name = getColorName(color);
  const textColor = getContrastText(color);

  const fields = [
    ["HEX", color.toUpperCase()],
    ["RGB", `${r}, ${g}, ${b}`],
    ["HSL", `${h}°, ${s}%, ${l}%`],
    ["HSV", `${hv}°, ${sv}%, ${v}%`],
    ["CMYK", `${c}% ${m}% ${y}% ${k}%`],
    ["Temp", `~${temp}K`],
    ["Contrast", `${ratio}:1 vs white`],
    ["WCAG", getWCAGRating(color)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-card relative w-full max-w-sm z-10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="w-full h-20 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: color }}>
          <span className="font-mono font-bold" style={{ color: textColor }}>{color.toUpperCase()}</span>
        </div>
        <div className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-display)" }}>{name}</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map(([label, val]) => (
            <div key={label} className="glass px-3 py-2 rounded-lg">
              <div className="text-[10px] text-purple-400 font-semibold">{label}</div>
              <div className="text-xs font-mono mt-0.5 break-all">{val}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(color); }} className="glass-button w-full mt-4 py-2 rounded-xl text-sm">
          ⎘ Copy HEX
        </button>
        <button onClick={onClose} className="glass-button w-full mt-2 py-2 rounded-xl text-sm text-white/50">Close</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Core state
  const [colors, setColors] = useState<string[]>(() => harmonies.complementary("#7c3aed"));
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>("complementary");
  const [baseColor, setBaseColor] = useState("#7c3aed");
  const [visionMode, setVisionMode] = useState<VisionMode>("normal");
  const [tab, setTab] = useState<Tab>("generator");
  const [history, setHistory] = useState<string[][]>([]);
  const [points, setPoints] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<AchievementId>>(new Set());
  const [toast, setToast] = useState<{ id: AchievementId; name: string; icon: string } | null>(null);
  const [paletteName, setPaletteName] = useState("");
  const [genCount, setGenCount] = useState(0);
  const [infoColor, setInfoColor] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [triedHarmonies, setTriedHarmonies] = useState<Set<string>>(new Set());
  const [exportFormats, setExportFormats] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(true);

  // Color wheel
  const [wheelOpen, setWheelOpen] = useState(false);
  const [wheelColor, setWheelColor] = useState("#a855f7");
  const [wheelIndex, setWheelIndex] = useState<number | null>(null);

  // Blend tab
  const [blendColor1, setBlendColor1] = useState("#a855f7");
  const [blendColor2, setBlendColor2] = useState("#22d3ee");
  const [blendRatio, setBlendRatio] = useState(50);
  const blendResult = blendColors(blendColor1, blendColor2, blendRatio);

  // Gradient tab
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [gradientAngle, setGradientAngle] = useState(135);

  // Data viz
  const [dvType, setDvType] = useState<DataVizType>("sequential");
  const [dvSteps, setDvSteps] = useState(5);

  // Music
  const [frequency, setFrequency] = useState(440);

  // AI tab — REAL search
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSource, setAiSource] = useState<"web"|"ai-match"|"keyword"|"generated"|"fallback"|"">("");
  const [aiResultColors, setAiResultColors] = useState<string[]>([]);

  // Image
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Export
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [exportCopied, setExportCopied] = useState(false);
  const [gradientCopied, setGradientCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // Temperature
  const [kelvin, setKelvin] = useState(5500);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  // URL param restore (feature #101)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlColors = params.get("colors");
    if (urlColors) {
      const parsed = urlColors.split(",").filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, 5);
      if (parsed.length > 0) {
        const padded = [...parsed];
        while (padded.length < 5) padded.push(generateRandomColor());
        setColors(padded);
      }
    }
  }, []);

  // Keyboard shortcuts (feature #102)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); generate(); }
      if (e.key === "s" || e.key === "S") { setTab("saved"); }
      if (e.key === "e" || e.key === "E") { setTab("export"); }
      if (e.key === "w" || e.key === "W") { setWheelOpen((o) => !o); }
      if (e.key === "Escape") { setWheelOpen(false); setShowAchievements(false); setInfoColor(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Saved palettes
  const { data: savedPalettes = [] } = useQuery<Palette[]>({
    queryKey: ["/api/palettes"],
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; colors: string }) =>
      apiRequest("POST", "/api/palettes", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/palettes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/palettes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/palettes"] }),
  });

  // ── Achievement unlock
  const tryUnlock = useCallback((id: AchievementId) => {
    setUnlocked((prev) => {
      if (prev.has(id)) return prev;
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (!ach) return prev;
      setPoints((p) => p + ach.points);
      setToast({ id, name: ach.name, icon: ach.icon });
      return new Set([...prev, id]);
    });
  }, []);

  const addPoints = useCallback((n: number) => setPoints((p) => p + n), []);

  // ── Generate palette
  const generate = useCallback((mode?: HarmonyMode, base?: string) => {
    const m = mode || harmonyMode;
    const b = base || baseColor;
    const fn = harmonies[m as keyof typeof harmonies] as Function;
    const generated: string[] = fn(b);
    const newColors = colors.map((c, i) => locked[i] ? c : (generated[i] || generateRandomColor()));
    setColors(newColors);
    setHistory((h) => [newColors, ...h].slice(0, 20));
    setGenCount((n) => {
      const next = n + 1;
      if (next === 1) tryUnlock("first_steps");
      if (next === 10) tryUnlock("prolific");
      if (next === 50) tryUnlock("master_colorist");
      return next;
    });
    addPoints(10);
    setTriedHarmonies((t) => {
      const next = new Set([...t, m]);
      if (next.size >= 9) tryUnlock("harmony_master");
      return next;
    });
  }, [harmonyMode, baseColor, colors, locked, addPoints, tryUnlock]);

  // ── Check century
  useEffect(() => {
    if (points >= 100) tryUnlock("century");
  }, [points, tryUnlock]);

  // ── Shuffle single color (feature #51)
  const shuffleColor = useCallback((index: number) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = generateRandomColor();
      return next;
    });
    addPoints(2);
  }, [addPoints]);

  // ── Gradient CSS
  const gradientCSS = () => {
    const stops = colors.join(", ");
    if (gradientType === "linear") return `linear-gradient(${gradientAngle}deg, ${stops})`;
    if (gradientType === "radial") return `radial-gradient(circle, ${stops})`;
    return `conic-gradient(${stops})`;
  };

  // ── REAL AI palette generation
  const runAiGenerate = async (prompt: string) => {
    if (!prompt.trim() || aiLoading) return;
    const trimmed = prompt.trim();
    setAiLoading(true);
    setAiError("");
    setAiSource("");
    setAiResultColors([]);

    // Step 1 — instant client-side match (always works, even offline)
    const clientResult = clientAiColors(trimmed);

    // Step 2 — try server search in parallel (richer results if available)
    let finalColors = clientResult.colors;
    let finalSource = clientResult.source;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const serverResult = await serverAiColors(trimmed, controller.signal);
      clearTimeout(timeout);

      if (serverResult.colors && serverResult.colors.length >= 5) {
        const valid = serverResult.colors.filter((c: string) => /^#[0-9a-fA-F]{6}$/i.test(c));
        if (valid.length >= 5) {
          finalColors = valid.slice(0, 5);
          finalSource = serverResult.source || "web";
        }
      }
    } catch {
      // Server unavailable — client result already set, continue silently
    }

    setColors(finalColors);
    setAiResultColors(finalColors);
    setAiSource(finalSource as any);
    setHistory((h) => [finalColors, ...h].slice(0, 20));
    tryUnlock("ai_explorer");
    addPoints(20);
    setAiLoading(false);
  };

  // ── Image extraction
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImagePreview(src);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        const freq: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 40 * 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          // Bucket colors for better clustering
          const rb = Math.round(r / 16) * 16;
          const gb = Math.round(g / 16) * 16;
          const bb = Math.round(b / 16) * 16;
          const hex = rgbToHex(rb, gb, bb);
          freq[hex] = (freq[hex] || 0) + 1;
        }
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([h]) => h);
        setExtractedColors(sorted);
        tryUnlock("image_analyst");
        addPoints(25);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ── Color wheel handlers
  const openWheel = (color: string, index: number) => {
    setWheelColor(color);
    setWheelIndex(index);
    setWheelOpen(true);
  };

  const onWheelChange = (hex: string) => {
    setWheelColor(hex);
    if (wheelIndex !== null) {
      setColors((prev) => { const n = [...prev]; n[wheelIndex] = hex; return n; });
    }
    onChange?.(hex);
  };

  const onWheelAddToPalette = (hex: string) => {
    setColors((prev) => {
      // Replace first unlocked slot
      const idx = prev.findIndex((_, i) => !locked[i]);
      if (idx === -1) return prev;
      const n = [...prev];
      n[idx] = hex;
      return n;
    });
    addPoints(5);
  };

  // ── Tabs config
  const TABS: { id: Tab; label: string }[] = [
    { id: "generator", label: "Generator" },
    { id: "blend", label: "Blend" },
    { id: "gradient", label: "Gradient" },
    { id: "image", label: "Image" },
    { id: "dataviz", label: "Data Viz" },
    { id: "music", label: "Music" },
    { id: "ai", label: "AI" },
    { id: "seasonal", label: "Themes" },
    { id: "export", label: "Export" },
    { id: "saved", label: "Saved" },
  ];

  const HARMONY_MODES: { id: HarmonyMode; label: string }[] = [
    { id: "complementary", label: "Complement" },
    { id: "analogous", label: "Analogous" },
    { id: "triadic", label: "Triadic" },
    { id: "splitComplementary", label: "Split-Comp" },
    { id: "tetradic", label: "Tetradic" },
    { id: "square", label: "Square" },
    { id: "monochromatic", label: "Mono" },
    { id: "shadesTints", label: "Shades" },
    { id: "random", label: "Random" },
  ];

  const VISION_MODES: { id: VisionMode; label: string }[] = [
    { id: "normal", label: "Normal Vision" },
    { id: "protanopia", label: "Protanopia" },
    { id: "deuteranopia", label: "Deuteranopia" },
    { id: "tritanopia", label: "Tritanopia" },
    { id: "achromatopsia", label: "Achromatopsia" },
  ];

  // Avoid undefined ref for onChange in wheel
  const onChange = (_hex: string) => {};

  return (
    <div className={`min-h-dvh pixel-grid relative ${isDark ? "" : "light"}`}>
      {/* Bg orbs */}
      <div className="bg-orb w-96 h-96 bg-purple-600 top-[-10%] left-[-5%]" />
      <div className="bg-orb w-80 h-80 bg-cyan-500 top-[30%] right-[-8%]" />
      <div className="bg-orb w-64 h-64 bg-pink-600 bottom-[10%] left-[20%]" />

      <canvas ref={canvasRef} className="hidden" />

      {/* Achievement toast */}
      {toast && <AchievementToast name={toast.name} icon={toast.icon} onClose={() => setToast(null)} />}

      {/* Color info modal */}
      {infoColor && <ColorInfoModal color={infoColor} onClose={() => setInfoColor(null)} />}

      {/* Color Wheel */}
      {wheelOpen && (
        <ColorWheel
          value={wheelColor}
          onChange={onWheelChange}
          onClose={() => setWheelOpen(false)}
          onAddToPalette={onWheelAddToPalette}
        />
      )}

      {/* Achievements modal */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAchievements(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-card relative z-10 w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-xl mb-5" style={{ fontFamily: "var(--font-display)" }}>
              Achievements <span className="text-purple-400">{unlocked.size}/{ACHIEVEMENTS.length}</span>
            </div>
            <div className="mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(unlocked.size / ACHIEVEMENTS.length) * 100}%` }} />
              </div>
              <div className="text-xs text-white/30 mt-1">{Math.round((unlocked.size / ACHIEVEMENTS.length) * 100)}% complete · {points} pts total</div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${unlocked.has(a.id) ? "border-lime-500/40 bg-lime-500/10" : "border-white/8 bg-white/3"}`}>
                  <span className="text-xl w-8 text-center">{a.icon}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${unlocked.has(a.id) ? "text-lime-400" : "text-white/50"}`}>{a.name}</div>
                    <div className="text-xs text-white/35">{a.description}</div>
                  </div>
                  <span className={`text-xs font-mono ${unlocked.has(a.id) ? "text-lime-400" : "text-white/25"}`}>+{a.points}pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAchievements(false)} className="glass-button w-full mt-4 py-2 rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="relative z-10 glass border-b border-white/8 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-label="ChromaFlow">
              <rect x="2" y="2" width="12" height="12" rx="3" fill="#a855f7" />
              <rect x="18" y="2" width="12" height="12" rx="3" fill="#22d3ee" />
              <rect x="2" y="18" width="12" height="12" rx="3" fill="#f472b6" />
              <rect x="18" y="18" width="12" height="12" rx="3" fill="#a3e635" />
              <rect x="10" y="10" width="12" height="12" rx="3" fill="#fbbf24" opacity="0.9" />
            </svg>
            <span className="logo-text font-bold text-lg tracking-tight neon-glow-purple">ChromaFlow</span>
            <span className="hidden sm:inline text-[10px] text-purple-400/60 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">v2.0</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Color wheel shortcut */}
            <button
              onClick={() => { setWheelIndex(null); setWheelColor(baseColor); setWheelOpen(true); }}
              className="glass-button px-3 py-1.5 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-500/30 hidden sm:flex items-center gap-1"
              title="Open color wheel (W)"
              data-testid="open-wheel-btn"
            >
              ◎ Wheel
            </button>

            {/* Vision mode */}
            <select value={visionMode} onChange={(e) => setVisionMode(e.target.value as VisionMode)} className="text-xs" data-testid="vision-select">
              {VISION_MODES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>

            {/* Points */}
            <button onClick={() => setShowAchievements(true)} className="glass-button px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5" data-testid="points-btn">
              <span className="text-purple-400">★</span>
              <span>{points}</span>
              <span className="text-white/40">pts</span>
            </button>

            {/* Dark mode */}
            <button onClick={() => setIsDark((d) => !d)} className="glass-button w-9 h-9 rounded-full flex items-center justify-center text-sm" data-testid="theme-toggle">
              {isDark ? "☀" : "☽"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Palette Bar ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-4">
        {/* Color cards */}
        <div className="flex gap-2 mb-3" style={{ minHeight: 190 }}>
          {colors.map((c, i) => (
            <ColorCard
              key={i}
              color={c}
              index={i}
              locked={locked[i]}
              visionMode={visionMode}
              onLock={(idx) => { setLocked((l) => { const n = [...l]; n[idx] = !n[idx]; return n; }); addPoints(2); }}
              onOpenWheel={openWheel}
              onCopy={() => addPoints(1)}
              onShuffle={shuffleColor}
            />
          ))}
        </div>

        {/* Keyboard hint */}
        <div className="flex gap-3 mb-2 text-[10px] text-white/25">
          <span>Space: generate</span>
          <span>·</span>
          <span>W: color wheel</span>
          <span>·</span>
          <span>Click card: open wheel</span>
        </div>

        {/* Generate bar */}
        <div className="glass-card px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/50">Base</label>
            <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="w-9 h-9 cursor-pointer rounded-lg" data-testid="base-color-input" />
          </div>
          <div className="flex gap-1 flex-wrap flex-1">
            {HARMONY_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setHarmonyMode(m.id); generate(m.id); }}
                className={`tab-pill text-xs ${harmonyMode === m.id ? "active" : ""}`}
                data-testid={`harmony-${m.id}`}
              >{m.label}</button>
            ))}
          </div>
          <button
            onClick={() => generate()}
            className="glass-button px-5 py-2 rounded-full text-sm font-bold text-purple-300 border border-purple-500/40"
            data-testid="generate-btn"
          >↺ Generate</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`tab-pill shrink-0 ${tab === t.id ? "active" : ""}`} data-testid={`tab-${t.id}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="pb-16">

          {/* ── Generator Tab ── */}
          {tab === "generator" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Recent palettes */}
              <div className="glass-card p-5">
                <h2 className="font-bold mb-4 flex items-center justify-between" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                  Recent Palettes
                  <span className="text-xs text-purple-400 font-mono">{history.length}/20</span>
                </h2>
                {history.length === 0 ? (
                  <p className="text-sm text-white/30">Generate a palette to see history</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {history.slice(0, 8).map((pal, i) => (
                      <div key={i} className="mini-palette" onClick={() => { setColors(pal); addPoints(5); }} data-testid={`history-${i}`}>
                        {pal.map((c, j) => <div key={j} style={{ backgroundColor: c, flex: 1 }} />)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Temperature generator */}
              <div className="glass-card p-5">
                <h2 className="font-bold mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Color Temperature</h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-amber-400">1K</span>
                  <input
                    type="range" min={1000} max={10000} value={kelvin}
                    onChange={(e) => setKelvin(+e.target.value)} className="flex-1"
                    style={{ background: `linear-gradient(to right, #ff8000, #fff4e0, #fff, #cce0ff, #8ab4f8)` }}
                  />
                  <span className="text-xs text-blue-400">10K</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-xl border border-white/10 shrink-0" style={{ backgroundColor: rgbToHex(...kelvinToRgb(kelvin)) }} />
                  <div>
                    <div className="text-sm font-mono font-bold">{kelvin}K</div>
                    <div className="text-xs text-white/40 mt-0.5">{rgbToHex(...kelvinToRgb(kelvin))}</div>
                    <div className="text-xs text-white/30 mt-0.5">
                      {kelvin < 3000 ? "Warm / Incandescent" : kelvin < 5000 ? "Neutral / Daylight" : kelvin < 7000 ? "Natural / Sunlight" : "Cool / Sky"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { const base = rgbToHex(...kelvinToRgb(kelvin)); setBaseColor(base); generate("analogous", base); }}
                  className="glass-button px-4 py-2 rounded-xl text-sm w-full font-semibold"
                  data-testid="apply-temp"
                >Apply Temperature Palette</button>
              </div>

              {/* Palette details */}
              <div className="glass-card p-5 lg:col-span-2">
                <h2 className="font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                  Palette Details
                  <span className="text-xs text-white/30 font-normal">click card to open color wheel</span>
                </h2>
                <div className="grid grid-cols-5 gap-3">
                  {colors.map((c, i) => {
                    const [r, g, b] = hexToRgb(c);
                    const [h, s, l] = hexToHsl(c);
                    const ratio = getContrastRatio(c);
                    return (
                      <div key={i} className="flex flex-col gap-1.5 cursor-pointer group" onClick={() => setInfoColor(c)} data-testid={`detail-card-${i}`}>
                        <div className="w-full h-10 rounded-lg border border-white/10 group-hover:scale-105 transition-transform" style={{ backgroundColor: c }} />
                        <div className="text-[10px] font-mono text-white/60">{c.toUpperCase()}</div>
                        <div className="text-[9px] text-white/35">RGB {r},{g},{b}</div>
                        <div className="text-[9px] text-white/35">H{h}° S{s}% L{l}%</div>
                        <div className="text-[9px] text-white/35">{ratio}:1 contrast</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Blend Tab ── */}
          {tab === "blend" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Color Blender</h2>
                <div className="space-y-5">
                  <div className="flex gap-4 items-center">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Color 1</label>
                      <input type="color" value={blendColor1} onChange={(e) => setBlendColor1(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer" data-testid="blend-color1" />
                      <div className="text-[10px] text-white/40 font-mono mt-1">{blendColor1}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-white/40 mb-1">Mix {blendRatio}%</div>
                      <div className="w-full h-14 rounded-xl border border-white/10 flex items-center justify-center" style={{ backgroundColor: blendResult }}>
                        <span className="text-xs font-mono" style={{ color: getContrastText(blendResult) }}>{blendResult}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Color 2</label>
                      <input type="color" value={blendColor2} onChange={(e) => setBlendColor2(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer" data-testid="blend-color2" />
                      <div className="text-[10px] text-white/40 font-mono mt-1">{blendColor2}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Ratio: {blendRatio}%</label>
                    <input type="range" min={0} max={100} value={blendRatio} onChange={(e) => setBlendRatio(+e.target.value)} className="w-full"
                      style={{ background: `linear-gradient(to right, ${blendColor1}, ${blendColor2})` }} data-testid="blend-ratio" />
                  </div>
                  <button
                    onClick={() => { const steps = generateBlendSteps(blendColor1, blendColor2, 5); setColors(steps); setHistory((h) => [steps, ...h].slice(0, 20)); tryUnlock("master_blender"); addPoints(10); }}
                    className="glass-button w-full py-2.5 rounded-xl text-sm font-bold text-purple-300 border border-purple-500/40"
                    data-testid="blend-generate"
                  >Generate Blend Palette</button>
                </div>
              </div>

              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Blend Previews</h2>
                <div className="space-y-2">
                  {generateBlendSteps(blendColor1, blendColor2, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: c }} />
                      <div className="text-xs font-mono flex-1">{c}</div>
                      <div className="text-xs text-white/40">{Math.round((i / 4) * 100)}%</div>
                      <button onClick={() => { navigator.clipboard.writeText(c); addPoints(1); }} className="text-xs glass-button px-2 py-1 rounded">⎘</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[5, 7, 10].map((steps) => (
                    <div key={steps}>
                      <div className="text-[10px] text-white/30 mb-1">{steps}-step blend</div>
                      <div className="flex h-8 rounded-lg overflow-hidden border border-white/10">
                        {generateBlendSteps(blendColor1, blendColor2, steps).map((c, i) => <div key={i} style={{ backgroundColor: c, flex: 1 }} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Gradient Tab ── */}
          {tab === "gradient" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Gradient Builder</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Type</label>
                    <div className="flex gap-2">
                      {(["linear","radial","conic"] as GradientType[]).map((t) => (
                        <button key={t} onClick={() => setGradientType(t)} className={`tab-pill flex-1 text-center ${gradientType === t ? "active" : ""}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  {gradientType === "linear" && (
                    <div>
                      <label className="text-xs text-white/50 mb-2 block">Angle: {gradientAngle}°</label>
                      <input type="range" min={0} max={360} value={gradientAngle} onChange={(e) => setGradientAngle(+e.target.value)} className="w-full" />
                    </div>
                  )}
                  <div className="gradient-preview w-full" style={{ background: gradientCSS(), minHeight: 140 }} />
                  <div className="code-block text-[11px] py-2">{`background: ${gradientCSS()};`}</div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`background: ${gradientCSS()};`); setGradientCopied(true); setTimeout(() => setGradientCopied(false), 1500); tryUnlock("gradient_guru"); addPoints(5); }}
                    className="glass-button w-full py-2.5 rounded-xl text-sm font-bold text-cyan-300 border border-cyan-500/40"
                    data-testid="copy-gradient"
                  >{gradientCopied ? "✓ Copied!" : "⎘ Copy CSS"}</button>
                </div>
              </div>
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Angle Variations</h2>
                <div className="space-y-2">
                  {[0,45,90,135,180,225,270,315].map((angle) => (
                    <div key={angle} className="flex items-center gap-3 cursor-pointer group" onClick={() => setGradientAngle(angle)}>
                      <div className="h-10 rounded-lg flex-1 border border-white/5 group-hover:border-purple-500/50 transition-colors"
                        style={{ background: `linear-gradient(${angle}deg, ${colors.join(", ")})` }} />
                      <span className="text-xs font-mono text-white/40 w-10 text-right">{angle}°</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Image Tab ── */}
          {tab === "image" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Image Color Extractor</h2>
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center hover:border-purple-500/60 transition-colors">
                    <div className="text-3xl mb-3">◫</div>
                    <div className="text-sm font-semibold">Drop image or click to upload</div>
                    <div className="text-xs text-white/40 mt-1">JPG, PNG, GIF, WebP</div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} data-testid="image-upload" />
                </label>
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-full rounded-xl max-h-48 object-cover border border-white/10 mt-4" />}
              </div>
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                  Extracted Colors
                  <span className="ml-2 text-xs text-purple-400">{extractedColors.length}</span>
                </h2>
                {extractedColors.length === 0 ? (
                  <p className="text-sm text-white/30">Upload an image to extract colors</p>
                ) : (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {extractedColors.map((c, i) => (
                        <div key={i} className="group cursor-pointer" onClick={() => { const n=[...colors]; n[i%5]=c; setColors(n); addPoints(2); }} data-testid={`extracted-color-${i}`}>
                          <div className="w-full aspect-square rounded-lg border border-white/10 group-hover:border-purple-400/60 transition-all group-hover:scale-105 transform" style={{ backgroundColor: c }} />
                          <div className="text-[9px] font-mono text-white/40 mt-1 text-center truncate">{c}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { const top5 = extractedColors.slice(0,5); setColors(top5); setHistory((h) => [top5,...h].slice(0,20)); addPoints(5); }}
                      className="glass-button w-full py-2 rounded-xl text-sm font-semibold" data-testid="apply-extracted">
                      Apply Top 5 to Palette
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Data Viz Tab ── */}
          {tab === "dataviz" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Data Viz Palettes</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Scale Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["sequential","diverging","qualitative","heatmap"] as DataVizType[]).map((t) => (
                        <button key={t} onClick={() => setDvType(t)} className={`tab-pill ${dvType === t ? "active" : ""}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Steps: {dvSteps}</label>
                    <input type="range" min={3} max={10} value={dvSteps} onChange={(e) => setDvSteps(+e.target.value)} className="w-full" />
                  </div>
                  {(() => {
                    const fns = { sequential: generateSequential, diverging: generateDiverging, qualitative: generateQualitative, heatmap: generateHeatmap };
                    const preview = fns[dvType](dvSteps);
                    return (
                      <div className="space-y-1">
                        {preview.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-8 h-7 rounded shrink-0" style={{ backgroundColor: c }} />
                            <div className="flex-1 h-7 rounded" style={{ backgroundColor: c }} />
                            <div className="text-[10px] font-mono w-20 text-white/50">{c}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => {
                      const fns = { sequential: generateSequential, diverging: generateDiverging, qualitative: generateQualitative, heatmap: generateHeatmap };
                      const result = fns[dvType](dvSteps).slice(0,5);
                      while (result.length < 5) result.push(result[result.length-1]);
                      setColors(result); setHistory((h) => [result,...h].slice(0,20));
                      tryUnlock("data_scientist"); addPoints(15);
                    }}
                    className="glass-button w-full py-2.5 rounded-xl text-sm font-bold text-cyan-300 border border-cyan-500/40"
                    data-testid="apply-dataviz"
                  >Apply to Palette</button>
                </div>
              </div>
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Scale Guide</h2>
                {[
                  { id: "sequential", label: "Sequential", desc: "Ordered from low to high. Use for density, heatmaps, ranked data.", ex: "Temperature, population, revenue" },
                  { id: "diverging", label: "Diverging", desc: "Two-sided with meaningful midpoint. Blue–neutral–red.", ex: "Profit/loss, survey responses, votes" },
                  { id: "qualitative", label: "Qualitative", desc: "Categorical, no inherent order. Evenly spaced hues.", ex: "Categories, regions, product lines" },
                  { id: "heatmap", label: "Heatmap", desc: "Blue-to-red for intensity. Classic data density.", ex: "Activity, correlation, frequency" },
                ].map((s) => (
                  <div key={s.id} className={`p-3 rounded-xl border mb-2 cursor-pointer transition-colors ${dvType===s.id?"border-purple-500/50 bg-purple-500/10":"border-white/8"}`} onClick={() => setDvType(s.id as DataVizType)}>
                    <div className="font-semibold text-sm">{s.label}</div>
                    <div className="text-xs text-white/50 mt-0.5">{s.desc}</div>
                    <div className="text-[10px] text-purple-400 mt-0.5">e.g. {s.ex}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Music Tab ── */}
          {tab === "music" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Music to Color</h2>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Base Frequency: {frequency} Hz</label>
                    <input type="range" min={20} max={2000} value={frequency} onChange={(e) => setFrequency(+e.target.value)} className="w-full"
                      style={{ background: `linear-gradient(to right, #ff4500, #7700ff)` }} data-testid="frequency-slider" />
                    <div className="flex justify-between text-[10px] text-white/30 mt-1">
                      <span>20Hz Bass</span><span>440Hz A4</span><span>2000Hz Treble</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Musical Notes</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{label:"C3",hz:130},{label:"A3",hz:220},{label:"A4",hz:440},{label:"E5",hz:659},{label:"A5",hz:880},{label:"A6",hz:1760}].map((n) => (
                        <button key={n.label} onClick={() => setFrequency(n.hz)} className={`tab-pill text-center ${frequency===n.hz?"active":""}`}>
                          {n.label} <span className="text-[9px] opacity-50">{n.hz}Hz</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { setColors(frequencyToColors(frequency)); tryUnlock("sound_artist"); addPoints(15); }}
                    className="glass-button w-full py-2.5 rounded-xl text-sm font-bold text-pink-300 border border-pink-500/40"
                    data-testid="apply-music"
                  >Generate Music Palette</button>
                </div>
              </div>
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Frequency Preview</h2>
                <div className="space-y-3">
                  {frequencyToColors(frequency).map((c, i) => {
                    const ratios = [1, 1.25, 1.5, 1.75, 2];
                    const freq = Math.round(frequency * ratios[i]);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: c }} />
                        <div className="flex-1">
                          <div className="text-xs font-mono">{c}</div>
                          <div className="text-[10px] text-white/40">{freq}Hz × {ratios[i]}</div>
                        </div>
                        <div className="h-8 rounded" style={{ backgroundColor: c, width: `${(ratios[i]/2)*100}%`, maxWidth: 80 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── AI Tab ── */}
          {tab === "ai" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>AI Palette Generator</h2>
                <p className="text-xs text-white/40 mb-4">
                  Searches the web for colors tied to your prompt — artists, albums, movies, moods, anything.
                  Try: <em className="text-purple-400 not-italic">"Mayhem Lady Gaga"</em>, <em className="text-purple-400 not-italic">"Blade Runner 2049"</em>, <em className="text-purple-400 not-italic">"dark forest at dusk"</em>
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Describe a palette</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAiGenerate(aiPrompt); } }}
                      placeholder="e.g. Mayhem Lady Gaga, Dune 2021, cyberpunk Tokyo rain, warm coffee shop..."
                      rows={3}
                      className="w-full resize-none"
                      data-testid="ai-prompt"
                    />
                  </div>

                  <button
                    onClick={() => runAiGenerate(aiPrompt)}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className={`glass-button w-full py-2.5 rounded-xl text-sm font-bold border ${aiLoading ? "opacity-50 cursor-not-allowed" : "text-purple-300 border-purple-500/40"}`}
                    data-testid="ai-generate"
                  >
                    {aiLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin text-base">◌</span> Searching web for colors...
                      </span>
                    ) : "✦ Search & Generate"}
                  </button>

                  {aiError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{aiError}</div>}

                  {aiResultColors.length > 0 && (
                    <div className="p-3 bg-white/3 rounded-xl border border-white/8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-white/50">Result</span>
                        {(aiSource === "web") && <span className="text-[10px] text-lime-400 border border-lime-500/30 px-1.5 py-0.5 rounded-full">✓ Web Search</span>}
                        {(aiSource === "ai-match") && <span className="text-[10px] text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">✓ AI Match</span>}
                        {(aiSource === "keyword") && <span className="text-[10px] text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-full">✓ Keyword</span>}
                        {(aiSource === "generated" || aiSource === "fallback") && <span className="text-[10px] text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">✦ Generated</span>}
                      </div>
                      <div className="flex h-10 rounded-lg overflow-hidden">
                        {aiResultColors.map((c, i) => <div key={i} style={{ backgroundColor: c, flex: 1 }} />)}
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {aiResultColors.map((c, i) => <span key={i} className="text-[9px] font-mono text-white/40">{c}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Quick theme buttons */}
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Quick themes</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(THEMES).map(([key, theme]) => (
                        <button key={key}
                          onClick={() => { setColors(theme.colors); setAiResultColors(theme.colors); setAiSource("fallback"); setAiPrompt(theme.name); addPoints(10); }}
                          className="tab-pill text-xs" data-testid={`theme-${key}`}>
                          {theme.emoji} {theme.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessibility check */}
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Accessibility Check</h2>
                <div className="space-y-2">
                  {colors.map((c, i) => {
                    const ratio = getContrastRatio(c);
                    const wcag = getWCAGRating(c);
                    const wc = { AAA: "text-emerald-400", AA: "text-yellow-400", Fail: "text-red-400" };
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                        <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: c }} />
                        <div className="flex-1">
                          <div className="text-xs font-mono">{c}</div>
                          <div className="text-[10px] text-white/40">vs white: {ratio}:1</div>
                        </div>
                        <div className={`text-xs font-bold ${wc[wcag]}`}>{wcag}</div>
                      </div>
                    );
                  })}
                  <div className="text-[10px] text-white/30 p-2">AAA ≥7:1 · AA ≥4.5:1 · Fail &lt;4.5:1</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Seasonal Tab ── */}
          {tab === "seasonal" && (
            <div>
              <h2 className="font-bold mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Curated Themes</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <div key={key} className="saved-palette-card glass-card overflow-hidden" onClick={() => { setColors(theme.colors); addPoints(5); }} data-testid={`seasonal-${key}`}>
                    <div className="flex h-14">{theme.colors.map((c, i) => <div key={i} style={{ backgroundColor: c, flex: 1 }} />)}</div>
                    <div className="p-3">
                      <div className="text-sm font-semibold">{theme.emoji} {theme.name}</div>
                      <div className="text-[10px] font-mono text-white/40 mt-1">{theme.colors[0]} +{theme.colors.length-1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Export Tab ── */}
          {tab === "export" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Export Palette</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Format</label>
                    <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)} className="w-full" data-testid="export-format">
                      <option value="css">CSS Variables</option>
                      <option value="scss">SCSS Variables</option>
                      <option value="tailwind">Tailwind Config</option>
                      <option value="json">JSON</option>
                      <option value="array">JavaScript Array</option>
                    </select>
                  </div>
                  <div className="code-block"><pre style={{ whiteSpace: "pre-wrap" }}>{formatExport(colors, exportFormat)}</pre></div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(formatExport(colors, exportFormat));
                      setExportCopied(true); setTimeout(() => setExportCopied(false), 1500);
                      setExportFormats((s) => { const n = new Set([...s, exportFormat]); if (n.size >= 3) tryUnlock("export_pro"); return n; });
                      addPoints(5);
                    }}
                    className="glass-button w-full py-2.5 rounded-xl text-sm font-bold text-lime-300 border border-lime-500/40"
                    data-testid="copy-export"
                  >{exportCopied ? "✓ Copied!" : "⎘ Copy to Clipboard"}</button>

                  {/* Shareable URL */}
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Shareable URL</label>
                    <div className="flex gap-2">
                      <div className="code-block flex-1 text-[10px] py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        ?colors={colors.join(",")}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?colors=${colors.join(",")}`); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 1500); }}
                        className="glass-button px-3 rounded-xl text-sm shrink-0"
                        data-testid="copy-url"
                      >{urlCopied ? "✓" : "⎘"}</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swatches */}
              <div className="glass-card p-5">
                <h2 className="font-bold mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Color Swatches</h2>
                <div className="space-y-3">
                  {colors.map((c, i) => {
                    const [r, g, b] = hexToRgb(c);
                    const [h, s, l] = hexToHsl(c);
                    const [cy, m, y, k] = hexToCmyk(c);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                        <div className="w-12 h-12 rounded-xl shrink-0 border border-white/10" style={{ backgroundColor: c }} />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 flex-1">
                          <div className="text-[10px] text-white/70 font-mono">{c.toUpperCase()}</div>
                          <div className="text-[10px] text-white/40">RGB {r},{g},{b}</div>
                          <div className="text-[10px] text-white/40">H{h}° S{s}% L{l}%</div>
                          <div className="text-[10px] text-white/40">C{cy} M{m} Y{y} K{k}</div>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(c); addPoints(1); }} className="glass-button w-8 h-8 rounded-lg text-sm shrink-0">⎘</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Saved Tab ── */}
          {tab === "saved" && (
            <div>
              <div className="glass-card p-5 mb-4">
                <h2 className="font-bold mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>Save Current Palette</h2>
                <div className="flex gap-3">
                  <input type="text" value={paletteName} onChange={(e) => setPaletteName(e.target.value)} placeholder="Palette name..." className="flex-1" data-testid="palette-name-input"
                    onKeyDown={(e) => { if (e.key === "Enter") { saveMutation.mutate({ name: paletteName || "Untitled", colors: JSON.stringify(colors) }); setPaletteName(""); tryUnlock("collector"); addPoints(15); } }} />
                  <button
                    onClick={() => { saveMutation.mutate({ name: paletteName || "Untitled", colors: JSON.stringify(colors) }); setPaletteName(""); tryUnlock("collector"); addPoints(15); }}
                    className="glass-button px-5 py-2 rounded-xl text-sm font-bold text-purple-300 border border-purple-500/40 whitespace-nowrap"
                    data-testid="save-palette-btn"
                  >Save Current</button>
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden mt-3 border border-white/8">
                  {colors.map((c, i) => <div key={i} style={{ backgroundColor: c, flex: 1 }} />)}
                </div>
              </div>

              <h2 className="font-bold mb-4" style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}>
                Saved Palettes <span className="ml-2 text-xs text-purple-400">{savedPalettes.length}</span>
              </h2>
              {savedPalettes.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <div className="text-3xl mb-3">◇</div>
                  <div className="text-sm text-white/40">No saved palettes yet</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {savedPalettes.map((p) => {
                    let cols: string[] = [];
                    try { cols = JSON.parse(p.colors); } catch {}
                    return (
                      <div key={p.id} className="saved-palette-card glass-card" data-testid={`saved-palette-${p.id}`}>
                        <div className="flex h-12 cursor-pointer" onClick={() => { setColors(cols); addPoints(5); }}>
                          {cols.map((c, i) => <div key={i} style={{ backgroundColor: c, flex: 1 }} />)}
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{p.name}</div>
                            <div className="text-[10px] font-mono text-white/30">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</div>
                          </div>
                          <button onClick={() => deleteMutation.mutate(p.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-sm text-red-400 hover:bg-red-500/20 transition-colors" data-testid={`delete-palette-${p.id}`}>×</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-white/8 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-white/30">
            ChromaFlow v2 · 137 features · <span className="text-purple-400">{genCount}</span> palettes generated · <span className="text-cyan-400">{points}</span> pts
          </div>
          <div className="flex gap-3 text-xs text-white/25">
            <span>Space: new palette</span>
            <span>·</span>
            <span>W: color wheel</span>
            <span>·</span>
            <span className="text-purple-400">v2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
