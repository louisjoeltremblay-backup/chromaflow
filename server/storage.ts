import { db } from "./db";
import { palettes, type InsertPalette, type Palette } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAllPalettes(): Palette[];
  savePalette(palette: InsertPalette): Palette;
  deletePalette(id: number): void;
}

export class Storage implements IStorage {
  getAllPalettes(): Palette[] {
    return db.select().from(palettes).orderBy(desc(palettes.createdAt)).all();
  }

  savePalette(palette: InsertPalette): Palette {
    return db.insert(palettes).values(palette).returning().get();
  }

  deletePalette(id: number): void {
    db.delete(palettes).where(eq(palettes.id, id)).run();
  }
}

export const storage = new Storage();
