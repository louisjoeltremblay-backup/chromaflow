import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertPaletteSchema } from "@shared/schema";
import { searchColorsForPrompt, promptToColorsFallback } from "./aiColors";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function registerRoutes(httpServer: Server, app: Express) {
  // Get all saved palettes
  app.get("/api/palettes", (_req, res) => {
    try {
      const result = storage.getAllPalettes();
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch palettes" });
    }
  });

  // Save a palette
  app.post("/api/palettes", (req, res) => {
    try {
      const body = insertPaletteSchema.parse(req.body);
      const result = storage.savePalette(body);
      res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json({ error: e.errors });
      } else {
        res.status(500).json({ error: "Failed to save palette" });
      }
    }
  });

  // Delete a palette
  app.delete("/api/palettes/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      storage.deletePalette(id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete palette" });
    }
  });

  // ── REAL AI PALETTE GENERATION ──────────────────────────────────────────────
  // Searches the web for color associations tied to any prompt (artists, albums, movies, etc.)
  app.post("/api/ai-colors", async (req, res) => {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const trimmed = prompt.trim().slice(0, 200);

    try {
      // Try real web search first
      let colors = await searchColorsForPrompt(trimmed);

      if (!colors || colors.length < 5) {
        // Fallback to smart keyword matching
        colors = promptToColorsFallback(trimmed);
      }

      // Ensure we always have exactly 5 valid hex colors
      const valid = colors
        .map((c) => {
          if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
          return null;
        })
        .filter(Boolean) as string[];

      // Fill up to 5 if needed
      while (valid.length < 5) {
        const extras = promptToColorsFallback(trimmed + " " + valid.length);
        for (const e of extras) {
          if (!valid.includes(e)) { valid.push(e); break; }
        }
        if (valid.length === 5) break;
        // safety: generate from hash
        const hash = Math.abs(trimmed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0) + valid.length * 137);
        valid.push(`#${(hash & 0xFFFFFF).toString(16).padStart(6, "0")}`);
      }

      res.json({
        colors: valid.slice(0, 5),
        prompt: trimmed,
        source: colors.some((c) => /^#[0-9a-fA-F]{6}$/.test(c)) ? "web" : "fallback",
      });
    } catch (err) {
      console.error("AI palette error:", err);
      const fallback = promptToColorsFallback(trimmed);
      res.json({ colors: fallback.slice(0, 5), prompt: trimmed, source: "fallback" });
    }
  });
}
