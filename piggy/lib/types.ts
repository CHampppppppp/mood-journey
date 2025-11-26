export type Mood = {
  id: number;
  mood: string;
  intensity: number;
  note: string;
  date_key?: string | null;
  created_at: Date;
};

export type Period = {
  id: number;
  start_date: Date;
  created_at: Date;
};

