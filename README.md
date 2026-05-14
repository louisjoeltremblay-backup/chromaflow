# ChromaFlow — Ultimate Color Picker

<div align="center">

![ChromaFlow](https://img.shields.io/badge/version-1.0.0-a855f7?style=flat-square)
![Features](https://img.shields.io/badge/features-137+-22d3ee?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)

**A professional color tool with 137+ features, liquid glass UI, and pixel art aesthetics.**

</div>

---

## ✦ Features

### Color Spaces & Conversion
- HEX, RGB, HSL, HSV, CMYK conversions
- Color temperature (Kelvin) calculator
- Perceptual color name matching
- sRGB color space with gamma correction

### Harmony Generation (9 modes)
- Complementary, Analogous, Triadic
- Split-Complementary, Tetradic, Square
- Monochromatic, Shades & Tints, Random

### Palette Management
- Save / load / delete palettes (SQLite persistence)
- 20-item palette history with undo
- Palette naming and organization
- Shareable URL generation

### Image Extraction
- Upload JPG, PNG, GIF, WebP
- Canvas-based pixel sampling
- Extract top 10 dominant colors
- Click to apply extracted colors

### Contrast & Accessibility
- WCAG 2.1 contrast checker (AA/AAA/Fail)
- Relative luminance calculation (ITU-R BT.709)
- 4 color blindness simulations:
  - Protanopia, Deuteranopia, Tritanopia, Achromatopsia

### Gradients
- Linear, Radial, Conic gradients
- Angle control (0–360°)
- Multi-stop from current palette
- One-click CSS export

### Data Visualization
- Sequential, Diverging, Qualitative, Heatmap scales
- 3–10 step adjustment
- ColorBrewer-inspired principles

### Music to Color
- Frequency → Hue mapping (20–2000Hz)
- Harmonic ratio intervals (major third, perfect fifth, octave)
- Musical note presets (A4=440Hz)

### AI Palette Generator
- Natural language prompt matching
- 18 curated theme palettes
- Keyword-based color psychology

### Export Formats
- CSS Variables, SCSS Variables
- Tailwind Config, JSON, JavaScript Array
- Shareable URL parameters

### Gamification
- Points system (10+ action types)
- 13 achievements with unlock animations
- Generation counter and history tracking

---

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/chromaflow.git
cd chromaflow
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

## 📦 Build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v3 + Custom Glass CSS |
| State | TanStack Query v5 |
| Backend | Express.js |
| Database | SQLite (better-sqlite3 + Drizzle ORM) |
| Build | Vite 7 |
| Fonts | Clash Display + Satoshi (Fontshare) |

## 🎨 UI Design

ChromaFlow uses a unique **Liquid Glass + Pixel Art** aesthetic:
- Glassmorphism panels with backdrop blur
- Neon accent colors (purple, cyan, pink, lime)
- Pixel grid background texture
- Scanline overlays on components
- Smooth 220ms cubic-bezier transitions
- Dark/light mode toggle

## 📁 Project Structure

```
chromaflow/
├── client/
│   └── src/
│       ├── App.tsx          # Main application (all tabs)
│       ├── lib/
│       │   ├── colorEngine.ts   # All color algorithms
│       │   └── achievements.ts  # Achievement definitions
│       └── index.css        # Liquid glass design system
├── server/
│   ├── routes.ts            # REST API endpoints
│   ├── storage.ts           # Database access layer
│   └── db.ts                # SQLite + Drizzle setup
├── shared/
│   └── schema.ts            # Drizzle schema + Zod types
└── data.db                  # SQLite database (auto-created)
```

## 📝 License

MIT — free for personal and commercial use.

---

*Made with 🎨 and ChromaFlow*
