export type AchievementId =
  | "first_steps" | "prolific" | "master_colorist" | "collector"
  | "image_analyst" | "ai_explorer" | "sound_artist" | "master_blender"
  | "data_scientist" | "century" | "harmony_master" | "gradient_guru" | "export_pro";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  points: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_steps", name: "First Steps", description: "Generate your first palette", icon: "✦", points: 50 },
  { id: "prolific", name: "Prolific Creator", description: "Generate 10 palettes", icon: "✧", points: 50 },
  { id: "master_colorist", name: "Master Colorist", description: "Generate 50 palettes", icon: "◆", points: 100 },
  { id: "collector", name: "Collector", description: "Save your first palette", icon: "◇", points: 50 },
  { id: "image_analyst", name: "Image Analyst", description: "Extract colors from an image", icon: "□", points: 50 },
  { id: "ai_explorer", name: "AI Explorer", description: "Use AI color generation", icon: "▣", points: 50 },
  { id: "sound_artist", name: "Sound Artist", description: "Generate from music frequency", icon: "▷", points: 50 },
  { id: "master_blender", name: "Master Blender", description: "Blend two colors into a palette", icon: "▶", points: 50 },
  { id: "data_scientist", name: "Data Scientist", description: "Generate a data viz palette", icon: "■", points: 50 },
  { id: "century", name: "Century", description: "Reach 100 points", icon: "★", points: 50 },
  { id: "harmony_master", name: "Harmony Master", description: "Try all 9 harmony modes", icon: "☆", points: 75 },
  { id: "gradient_guru", name: "Gradient Guru", description: "Export a gradient CSS", icon: "◈", points: 50 },
  { id: "export_pro", name: "Export Pro", description: "Export in 3 different formats", icon: "◉", points: 50 },
];
