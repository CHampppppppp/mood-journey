'use server';

import pool from './db';
import { revalidatePath } from 'next/cache';

export type Mood = {
  id: number;
  mood: string;
  intensity: number;
  note: string;
  created_at: Date;
};

// 保存心情记录
// Save mood record
export async function saveMood(formData: FormData) {
  const mood = formData.get('mood') as string;
  const intensity = parseInt(formData.get('intensity') as string);
  const note = formData.get('note') as string;

  if (!mood) throw new Error('Mood is required');

  // 插入数据到 moods 表
  // Insert data into moods table
  await pool.query(
    'INSERT INTO moods (mood, intensity, note) VALUES ($1, $2, $3)',
    [mood, intensity, note]
  );

  revalidatePath('/');
}

// 获取所有心情记录
// Get all mood records
export async function getMoods() {
  const { rows } = await pool.query('SELECT * FROM moods ORDER BY created_at DESC');
  return rows as Mood[];
}

