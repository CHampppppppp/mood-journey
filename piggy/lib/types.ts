/**
 * Type Definitions - 类型定义
 * 
 * 这个文件包含应用中通用的 TypeScript 类型定义，主要对应数据库模型。
 * 
 * 主要类型：
 * 1. Mood: 心情记录模型 (id, mood, intensity, note, date_key, created_at)
 * 2. Period: 经期记录模型 (id, start_date, created_at)
 */

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

