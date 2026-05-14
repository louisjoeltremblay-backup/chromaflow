import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const palettes = sqliteTable("palettes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("Untitled"),
  colors: text("colors").notNull(), // JSON array of hex strings
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertPaletteSchema = createInsertSchema(palettes).omit({ id: true, createdAt: true });
export type InsertPalette = z.infer<typeof insertPaletteSchema>;
export type Palette = typeof palettes.$inferSelect;
