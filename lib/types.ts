export type Category = {
  id: string;
  name: string;
  removable: boolean;
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

export type TubestackState = {
  categories: Category[];
  videos: Video[];
  activeCategoryId: string;
  activeVideoId: string | null;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "podcast", name: "Podcast", removable: false },
  { id: "tutorial", name: "Tutorial", removable: false },
  { id: "music", name: "Music", removable: false },
  { id: "study", name: "Study", removable: false },
];
