import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertPaletteSchema } from "@shared/schema";
import { z } from "zod";

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
}
