export type Category = {
  id: string;
  name: string;
  removable: boolean;
  color?: string; // hex bg color
};

export type Video = {
  id: string;
  videoId: string;
  title: string;
  author?: string;
  thumbnail?: string;
  categoryId: string;
  durationSeconds: number;
  watchedSeconds: number;
  completed: boolean;
  addedAt: number;
};

export type Layout = {
  sidebarWidth: number;
  queueWidth: number;
};

export const DEFAULT_LAYOUT: Layout = {
  sidebarWidth: 300,
  queueWidth: 425,
};

export type TubestackState = {
  categories: Category[];
  videos: Video[];
  activeCategoryId: string;
  activeVideoId: string | null;
  layout: Layout;
};

/** Neo-brutalist color palette for category backgrounds */
export const CATEGORY_COLORS = [
  "#FDE047", // yellow
  "#86EFAC", // green
  "#67E8F9", // cyan
  "#F9A8D4", // pink
  "#FCA5A5", // red-light
  "#C4B5FD", // violet
  "#FED7AA", // orange
  "#6EE7B7", // emerald
  "#BAE6FD", // sky
  "#A7F3D0", // teal
  "#DDD6FE", // purple
  "#FBB6CE", // rose
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "podcast", name: "Podcast", removable: false, color: "#67E8F9" },
  { id: "tutorial", name: "Tutorial", removable: false, color: "#86EFAC" },
  { id: "music", name: "Music", removable: false, color: "#F9A8D4" },
  { id: "study", name: "Study", removable: false, color: "#FDE047" },
];
