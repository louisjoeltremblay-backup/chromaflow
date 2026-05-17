// ─── ChromaFlow Full-Screen Canvas Color Wheel ───────────────────────────────
// Interactive HSL color wheel with brightness ring, crosshair, hex input

import { useRef, useEffect, useCallback, useState } from "react";

interface ColorWheelProps {
  value: string;          // current hex
  onChange: (hex: string) => void;
  onClose: () => void;
  onAddToPalette: (hex: string) => void;
}

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const lig = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6; break;
      case b: hue = ((r - g) / d + 4) / 6; break;
    }
  }
  return [hue * 360, sat * 100, lig * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function getContrastText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (v: number) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.179 ? "#000000" : "#FFFFFF";
}

// Draw the HSL color wheel
function drawWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, lightness: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw the hue-saturation disc
  const imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
  const { data } = imageData;

  for (let y = 0; y < ctx.canvas.height; y++) {
    for (let x = 0; x < ctx.canvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
        const sat = (dist / radius) * 100;
        const [r, g, b] = hslToRgb(angle, sat, lightness);
        const i = (y * ctx.canvas.width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Outer ring border glow
  const grd = ctx.createRadialGradient(cx, cy, radius - 2, cx, cy, radius + 8);
  grd.addColorStop(0, "rgba(168,85,247,0.0)");
  grd.addColorStop(0.5, "rgba(168,85,247,0.6)");
  grd.addColorStop(1, "rgba(168,85,247,0.0)");
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = grd;
  ctx.lineWidth = 6;
  ctx.stroke();
}

// Draw crosshair at hue/saturation position
function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const textColor = getContrastText(color);
  const SIZE = 12;

  ctx.save();
  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, SIZE + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner ring (colored)
  ctx.beginPath();
  ctx.arc(x, y, SIZE, 0, 2 * Math.PI);
  ctx.strokeStyle = textColor === "#000000" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * Math.PI);
  ctx.fillStyle = textColor === "#000000" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)";
  ctx.fill();

  // Cross lines
  ctx.strokeStyle = textColor === "#000000" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - SIZE - 6, y); ctx.lineTo(x - SIZE + 2, y);
  ctx.moveTo(x + SIZE - 2, y); ctx.lineTo(x + SIZE + 6, y);
  ctx.moveTo(x, y - SIZE - 6); ctx.lineTo(x, y - SIZE + 2);
  ctx.moveTo(x, y + SIZE - 2); ctx.lineTo(x, y + SIZE + 6);
  ctx.stroke();

  ctx.restore();
}

export function ColorWheel({ value, onChange, onClose, onAddToPalette }: ColorWheelProps) {
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const lightnessRef = useRef<HTMLCanvasElement>(null);
  const isDraggingWheel = useRef(false);
  const isDraggingLight = useRef(false);

  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(value));
  const [hexInput, setHexInput] = useState(value.toUpperCase());
  const [copied, setCopied] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const currentHex = hslToHex(hsl[0], hsl[1], hsl[2]);

  // Wheel geometry
  const WHEEL_SIZE = Math.min(window.innerWidth * 0.55, 480);
  const WHEEL_PAD = 20;
  const CX = WHEEL_SIZE / 2;
  const CY = WHEEL_SIZE / 2;
  const RADIUS = WHEEL_SIZE / 2 - WHEEL_PAD;

  // ── Draw wheel
  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    canvas.width = WHEEL_SIZE;
    canvas.height = WHEEL_SIZE;
    const ctx = canvas.getContext("2d")!;
    drawWheel(ctx, CX, CY, RADIUS, hsl[2]);

    // Draw crosshair
    const angle = ((hsl[0] - 180) * Math.PI) / 180;
    const dist = (hsl[1] / 100) * RADIUS;
    const cx2 = CX + dist * Math.cos(angle);
    const cy2 = CY + dist * Math.sin(angle);
    drawCrosshair(ctx, cx2, cy2, currentHex);
  }, [hsl, WHEEL_SIZE]);

  // ── Draw lightness slider
  useEffect(() => {
    const canvas = lightnessRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 32;
    canvas.height = canvas.offsetHeight || 260;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;

    // Gradient: black → full-saturation hue → white
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(0.5, hslToHex(hsl[0], hsl[1], 50));
    grad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Border glow
    ctx.strokeStyle = "rgba(168,85,247,0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, h);

    // Thumb
    const thumbY = h - (hsl[2] / 100) * h;
    ctx.fillStyle = currentHex;
    ctx.strokeStyle = getContrastText(currentHex);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, thumbY - 8, w - 4, 16, 4);
    ctx.fill();
    ctx.stroke();
  }, [hsl, currentHex]);

  // ── Handlers
  const getWheelColor = useCallback((e: MouseEvent | React.MouseEvent, canvas: HTMLCanvasElement): [number, number, number] | null => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const dx = (e.clientX - rect.left) * scaleX - CX;
    const dy = (e.clientY - rect.top) * scaleY - CY;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), RADIUS);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const sat = (dist / RADIUS) * 100;
    return [angle, sat, hsl[2]];
  }, [CX, CY, RADIUS, hsl]);

  const getLightnessVal = useCallback((e: MouseEvent | React.MouseEvent, canvas: HTMLCanvasElement): number => {
    const rect = canvas.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return 100 - (y / rect.height) * 100;
  }, []);

  const applyHsl = useCallback((newHsl: [number, number, number]) => {
    setHsl(newHsl);
    const hex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
    setHexInput(hex.toUpperCase());
    onChange(hex);
  }, [onChange]);

  // Wheel mouse events
  const onWheelMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingWheel.current = true;
    const res = getWheelColor(e, e.currentTarget);
    if (res) applyHsl(res);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDraggingWheel.current && wheelRef.current) {
        const res = getWheelColor(e, wheelRef.current);
        if (res) applyHsl(res);
      }
      if (isDraggingLight.current && lightnessRef.current) {
        const l = getLightnessVal(e, lightnessRef.current);
        applyHsl([hsl[0], hsl[1], l]);
      }
    };
    const onUp = () => {
      isDraggingWheel.current = false;
      isDraggingLight.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [hsl, getWheelColor, getLightnessVal, applyHsl]);

  const onLightMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingLight.current = true;
    const l = getLightnessVal(e, e.currentTarget);
    applyHsl([hsl[0], hsl[1], l]);
  };

  const handleHexInput = (v: string) => {
    setHexInput(v.toUpperCase());
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      const newHsl = hexToHsl(v);
      setHsl(newHsl);
      onChange(v);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAddToPalette = () => {
    setRecentColors((r) => [currentHex, ...r].slice(0, 10));
    onAddToPalette(currentHex);
  };

  // Hue presets
  const HUE_PRESETS = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330];
  const textColor = getContrastText(currentHex);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
    >
      {/* Background close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="glass-card relative z-10 flex flex-col lg:flex-row gap-6 p-6 w-full max-w-4xl overflow-y-auto max-h-[95dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lg:hidden flex items-center justify-between mb-2">
          <div className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>Color Wheel</div>
          <button onClick={onClose} className="glass-button w-8 h-8 rounded-full text-lg flex items-center justify-center">×</button>
        </div>

        {/* ── Left: Wheel ── */}
        <div className="flex flex-col items-center gap-4 flex-1">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Hue · Saturation</div>

          <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, maxWidth: "100%", maxHeight: "100vw" }}>
            <canvas
              ref={wheelRef}
              onMouseDown={onWheelMouseDown}
              className="rounded-full cursor-crosshair"
              style={{
                width: "100%",
                height: "100%",
                touchAction: "none",
                boxShadow: `0 0 40px rgba(168,85,247,0.25), 0 0 0 2px rgba(168,85,247,0.3)`,
              }}
            />
          </div>

          {/* Hue presets */}
          <div className="flex gap-1.5 flex-wrap justify-center">
            {HUE_PRESETS.map((h) => {
              const c = hslToHex(h, 80, 55);
              return (
                <button
                  key={h}
                  onClick={() => applyHsl([h, hsl[1], hsl[2]])}
                  title={`${h}°`}
                  style={{ backgroundColor: c }}
                  className="w-7 h-7 rounded-full border-2 border-white/20 hover:scale-110 transition-transform hover:border-white/60"
                />
              );
            })}
          </div>
        </div>

        {/* ── Right: Controls ── */}
        <div className="flex flex-col gap-5 w-full lg:w-72 shrink-0">
          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>Color Wheel</div>
            <button onClick={onClose} className="glass-button w-8 h-8 rounded-full text-lg flex items-center justify-center">×</button>
          </div>

          {/* Current color preview */}
          <div
            className="rounded-2xl flex items-center justify-center font-mono font-bold text-lg"
            style={{
              backgroundColor: currentHex,
              color: textColor,
              minHeight: 100,
              boxShadow: `0 8px 32px ${currentHex}66`,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {currentHex}
          </div>

          {/* HSL display */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "H", value: `${Math.round(hsl[0])}°`, color: "#a855f7" },
              { label: "S", value: `${Math.round(hsl[1])}%`, color: "#22d3ee" },
              { label: "L", value: `${Math.round(hsl[2])}%`, color: "#f472b6" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass px-3 py-2.5 rounded-xl text-center">
                <div className="text-[10px] font-semibold mb-0.5" style={{ color }}>{label}</div>
                <div className="text-sm font-mono font-bold">{value}</div>
              </div>
            ))}
          </div>

          {/* Lightness slider (canvas) */}
          <div>
            <div className="text-xs text-white/50 mb-2">Lightness</div>
            <div className="flex gap-3 items-center">
              <canvas
                ref={lightnessRef}
                onMouseDown={onLightMouseDown}
                className="rounded-xl cursor-ns-resize"
                style={{ width: 36, height: 200, flexShrink: 0 }}
              />
              {/* Saturation slider */}
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <div className="text-xs text-white/40 mb-1">Saturation: {Math.round(hsl[1])}%</div>
                  <input
                    type="range" min={0} max={100} value={Math.round(hsl[1])}
                    onChange={(e) => applyHsl([hsl[0], +e.target.value, hsl[2]])}
                    className="w-full"
                    style={{ background: `linear-gradient(to right, ${hslToHex(hsl[0], 0, hsl[2])}, ${hslToHex(hsl[0], 100, hsl[2])})` }}
                  />
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Hue: {Math.round(hsl[0])}°</div>
                  <input
                    type="range" min={0} max={360} value={Math.round(hsl[0])}
                    onChange={(e) => applyHsl([+e.target.value, hsl[1], hsl[2]])}
                    className="w-full"
                    style={{ background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}
                  />
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Lightness: {Math.round(hsl[2])}%</div>
                  <input
                    type="range" min={0} max={100} value={Math.round(hsl[2])}
                    onChange={(e) => applyHsl([hsl[0], hsl[1], +e.target.value])}
                    className="w-full"
                    style={{ background: `linear-gradient(to right, #000, ${hslToHex(hsl[0], hsl[1], 50)}, #fff)` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HEX input */}
          <div>
            <div className="text-xs text-white/50 mb-2">HEX Code</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                maxLength={7}
                className="flex-1 font-mono uppercase"
                placeholder="#000000"
                spellCheck={false}
                data-testid="wheel-hex-input"
              />
              <button onClick={handleCopy} className="glass-button px-3 rounded-xl text-sm" data-testid="wheel-copy">
                {copied ? "✓" : "⎘"}
              </button>
            </div>
          </div>

          {/* Quick harmonies from this color */}
          <div>
            <div className="text-xs text-white/50 mb-2">Quick Harmonies</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Complement", deg: 180 },
                { label: "+120°", deg: 120 },
                { label: "+90°", deg: 90 },
                { label: "+30°", deg: 30 },
              ].map(({ label, deg }) => {
                const hc = hslToHex((hsl[0] + deg) % 360, hsl[1], hsl[2]);
                return (
                  <button
                    key={deg}
                    onClick={() => applyHsl([(hsl[0] + deg) % 360, hsl[1], hsl[2]])}
                    className="flex items-center gap-2 glass-button px-2 py-1.5 rounded-lg text-xs"
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: hc, flexShrink: 0 }} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent picks */}
          {recentColors.length > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-2">Recent Picks</div>
              <div className="flex flex-wrap gap-1.5">
                {recentColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { const h = hexToHsl(c); applyHsl(h); }}
                    className="w-7 h-7 rounded-lg border border-white/15 hover:scale-110 transition-transform hover:border-white/40"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={handleAddToPalette}
              className="glass-button py-2.5 rounded-xl font-bold text-sm text-purple-300 border border-purple-500/40"
              data-testid="wheel-add-palette"
            >
              + Add to Palette
            </button>
            <button
              onClick={onClose}
              className="glass-button py-2 rounded-xl text-sm text-white/60"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
