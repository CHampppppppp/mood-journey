/**
 * Server Actions - 业务逻辑处理层
 * 
 * 这个文件包含了应用的核心业务逻辑，作为 Next.js 的 Server Actions 供前端调用。
 * 主要功能：
 * 1. 心情记录管理 (CRUD)：处理心情的记录、查询、更新和删除。
 * 2. 经期记录管理 (CRUD)：处理经期的记录、查询、更新和删除。
 * 3. 副作用处理：在保存心情时触发邮件提醒（强度较高时）和向量记忆存储。
 * 4. AI 交互接口：提供给 AI 工具调用的专用函数 (xxxFromAI)。
 * 
 * 依赖：db, email, vectorStore
 */

'use server';

import pool from './db';
import { revalidatePath } from 'next/cache';

import type { Mood, Period } from './types';
import { sendSuperMoodAlert } from './email';
import { addMemories, searchMemories, deleteMemories, type MemoryRecord } from './vectorStore';
export type { Mood, Period } from './types';

// 标记 date_key 列是否已确保存在（避免重复检查）
let dateKeyColumnEnsured = false;

/**
 * 确保 moods 表存在 date_key 列
 * 
 * 这是一个数据库迁移辅助函数，用于向后兼容
 * 如果表还没有 date_key 列，则添加它
 * 
 * 使用标志位避免重复检查，提升性能
 */
async function ensureDateKeyColumn() {
  if (dateKeyColumnEnsured) return;
  try {
    // 检查列是否存在
    const { rows } = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'moods' AND column_name = 'date_key' LIMIT 1"
    );
    if (!rows || rows.length === 0) {
      // 列不存在，添加它
      await pool.query('ALTER TABLE moods ADD COLUMN date_key VARCHAR(20)');
    }
  } catch (err) {
    console.warn('[actions] Failed to ensure date_key column exists', err);
  } finally {
    dateKeyColumnEnsured = true; // 无论成功失败，都标记为已检查
  }
}

/**
 * 保存心情记录
 * 
 * 这个函数处理心情记录的创建和更新，以及相关的副作用：
 * 1. 保存心情到数据库
 * 2. 如果是经期开始，记录经期
 * 3. 如果心情强度为3（超级），发送邮件提醒
 * 4. 将心情记录异步写入向量记忆库（用于 RAG）
 * 
 * @param formData - 表单数据，包含心情信息
 * 
 * 处理流程：
 * - 如果有 id，更新现有记录
 * - 如果没有 id，插入新记录
 * - 如果是经期开始，额外插入经期记录
 * - 如果强度为3，发送邮件提醒（异步，不阻塞）
 * - 将心情记录写入向量库（异步，不阻塞）
 */
export async function saveMood(formData: FormData) {
  const id = formData.get('id') as string;
  const mood = formData.get('mood') as string;
  const intensity = parseInt(formData.get('intensity') as string);
  const note = formData.get('note') as string;
  const isPeriodStart = formData.get('is_period_start') === 'on';
  const dateKey = (formData.get('date_key') as string) || null; // 前端生成的日期键，用于时区处理

  if (!mood) throw new Error('Mood is required');

  const now = new Date();
  const datetime = now.toISOString();
  await ensureDateKeyColumn(); // 确保 date_key 列存在

  if (id) {
    // 更新现有记录
    // 使用 COALESCE 确保如果 dateKey 为 null，保留原有值
    await pool.query(
      'UPDATE moods SET mood = ?, intensity = ?, note = ?, date_key = COALESCE(?, date_key) WHERE id = ?',
      [mood, intensity, note, dateKey, id]
    );
  } else {
    // 插入新记录
    await pool.query(
      'INSERT INTO moods (mood, intensity, note, date_key) VALUES (?, ?, ?, ?)',
      [mood, intensity, note, dateKey]
    );

    // 如果是经期开始，保存经期记录
    // 使用前端传入的 date_key 来构造日期，避免时区问题
    // 如果 date_key 不存在，则使用当前日期（作为后备方案）
    if (isPeriodStart) {
      let periodDate: Date;
      if (dateKey) {
        // 使用 date_key (格式: YYYY-MM-DD) 构造日期
        // 设置为当地时间的 00:00:00，避免时区转换问题
        const [year, month, day] = dateKey.split('-').map(Number);
        periodDate = new Date(year, month - 1, day);
      } else {
        // 后备方案：使用当前日期（服务器时区）
        periodDate = new Date();
        periodDate.setHours(0, 0, 0, 0);
      }
      
      await pool.query(
        'INSERT INTO periods (start_date) VALUES (?)',
        [periodDate]
      );
    }
  }

  // 如果心情强度为3（超级），发送邮件提醒
  // 异步执行，不阻塞主流程
  if (intensity === 3) {
    sendSuperMoodAlert({ mood, note, isUpdate: Boolean(id) }).catch((err) => {
      console.error('Failed to send mood alert email', err);
    });
  }

  /**
   * 将心情记录异步写入向量记忆库
   * 
   * 这样 AI 在聊天时可以回忆起之前的心情记录
   * 例如："你还记得我上周心情不好的时候吗"
   */
  try {
    const textParts = [
      `日期：${now.toLocaleString('zh-CN', { hour12: false })}`,
      `心情类型：${mood}`,
      `强烈程度：${intensity}`,
    ];
    if (note) {
      textParts.push(`备注：${note}`);
    }
    const memoryText = textParts.join('\n');

    const memory: MemoryRecord = {
      id: `mood-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: memoryText,
      metadata: {
        type: 'mood',
        author: 'piggy',
        datetime,
      },
    };

    // 异步执行，不阻塞主流程
    // 即使向量库写入失败，心情记录也已经保存到数据库了
    addMemories([memory]).catch((err) => {
      console.error('[saveMood] Failed to add memory to vector store', err);
    });
  } catch (err) {
    console.error('[saveMood] Unexpected error when preparing memory', err);
  }

  // 重新验证页面缓存，确保 UI 显示最新数据
  revalidatePath('/');
}

// 获取所有心情记录
// Get all mood records
export async function getMoods() {
  const { rows } = await pool.query('SELECT * FROM moods ORDER BY created_at DESC');
  return rows as Mood[];
}

// 获取所有经期记录
// 注意：使用 created_at 排序和作为经期开始日期，避免时区问题
// start_date 字段由于服务器 UTC 时区可能会比实际日期早一天
export async function getPeriods() {
  const { rows } = await pool.query('SELECT * FROM periods ORDER BY created_at DESC');
  return rows as Period[];
}

// AI 调用的心情记录函数
// 如果当天已有记录，则更新现有记录；否则创建新记录
export async function logMoodFromAI({ mood, intensity, note }: { mood: string; intensity: number; note?: string }) {
  const now = new Date();
  const datetime = now.toISOString();
  const dateKey = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

  await ensureDateKeyColumn();

  // 先查询当天是否已有记录
  const existingRecords = await pool.query<{ id: number }>(
    'SELECT id FROM moods WHERE date_key = ? ORDER BY created_at DESC LIMIT 1',
    [dateKey]
  );

  const isUpdate = existingRecords.rows && existingRecords.rows.length > 0;

  if (isUpdate) {
    // 更新现有记录
    const moodId = existingRecords.rows[0].id;
    await pool.query(
      'UPDATE moods SET mood = ?, intensity = ?, note = ? WHERE id = ?',
      [mood, intensity, note || '', moodId]
    );
  } else {
    // 插入新记录
    await pool.query(
      'INSERT INTO moods (mood, intensity, note, date_key) VALUES (?, ?, ?, ?)',
      [mood, intensity, note || '', dateKey]
    );
  }

  // Mood alert email
  if (intensity === 3) {
    sendSuperMoodAlert({ mood, note: note || '', isUpdate }).catch((err) => {
      console.error('Failed to send mood alert email', err);
    });
  }

  // Vector Store
  // 注意：如果是更新，我们仍然添加新的记忆，因为向量库中的记忆是只增不减的
  // 这样可以保留历史记录，AI 可以看到心情的变化过程
  try {
    const textParts = [
      `日期：${now.toLocaleString('zh-CN', { hour12: false })}`,
      `心情类型：${mood}`,
      `强烈程度：${intensity}`,
    ];
    if (note) {
      textParts.push(`备注：${note}`);
    }
    const memoryText = textParts.join('\n');

    const memory: MemoryRecord = {
      id: `mood-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: memoryText,
      metadata: {
        type: 'mood',
        author: 'piggy',
        datetime,
      },
    };

    addMemories([memory]).catch((err) => {
      console.error('[logMoodFromAI] Failed to add memory to vector store', err);
    });
  } catch (err) {
    console.error('[logMoodFromAI] Unexpected error when preparing memory', err);
  }
  
  revalidatePath('/');
  return { success: true, isUpdate };
}

// AI 调用的经期记录函数
export async function trackPeriodFromAI({ startDate }: { startDate?: string }) {
  const date = startDate ? new Date(startDate) : new Date();
  await pool.query(
    'INSERT INTO periods (start_date) VALUES (?)',
    [date]
  );
  revalidatePath('/');
  return { success: true, date: date.toISOString() };
}

// ==================== AI 查询/修改/删除功能 ====================

/**
 * 心情名称映射（用于显示给用户）
 */
const MOOD_LABELS: Record<string, string> = {
  happy: '开心',
  blissful: '幸福',
  tired: '累',
  annoyed: '烦躁',
  angry: '生气',
  depressed: '沮丧',
};

/**
 * AI 调用：查询心情记录列表
 */
export async function listMoodsFromAI({ limit = 5, date }: { limit?: number; date?: string }) {
  const safeLimit = Math.min(Math.max(1, limit), 20);
  
  let query = 'SELECT id, mood, intensity, note, date_key, created_at FROM moods';
  const params: any[] = [];
  
  if (date) {
    query += ' WHERE date_key = ?';
    params.push(date);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(safeLimit);
  
  const { rows } = await pool.query<{
    id: number;
    mood: string;
    intensity: number;
    note: string;
    date_key: string;
    created_at: Date;
  }>(query, params);
  
  if (rows.length === 0) {
    return { 
      success: true, 
      message: date ? `${date} 没有心情记录。` : '还没有任何心情记录。',
      moods: [] 
    };
  }
  
  // 格式化记录，方便 AI 展示给用户
  const formattedMoods = rows.map((m, idx) => {
    const dateStr = m.date_key || new Date(m.created_at).toLocaleDateString('zh-CN');
    const moodLabel = MOOD_LABELS[m.mood] || m.mood;
    const intensityLabel = ['', '一点点', '中度', '超级'][m.intensity] || '';
    return {
      index: idx + 1,
      id: m.id,
      date: dateStr,
      mood: moodLabel,
      intensity: intensityLabel,
      note: m.note || '无',
      summary: `${idx + 1}. [ID:${m.id}] ${dateStr} - ${intensityLabel}${moodLabel}${m.note ? `（${m.note}）` : ''}`,
    };
  });
  
  return {
    success: true,
    message: `找到 ${rows.length} 条心情记录：\n${formattedMoods.map(m => m.summary).join('\n')}`,
    moods: formattedMoods,
  };
}

/**
 * AI 调用：修改心情记录
 */
export async function updateMoodFromAI({ 
  id, 
  mood, 
  intensity, 
  note 
}: { 
  id: number; 
  mood?: string; 
  intensity?: number; 
  note?: string;
}) {
  // 先检查记录是否存在
  const { rows: existing } = await pool.query<{ id: number; mood: string; intensity: number; note: string }>(
    'SELECT id, mood, intensity, note FROM moods WHERE id = ?',
    [id]
  );
  
  if (!existing || existing.length === 0) {
    return { success: false, message: `找不到 ID 为 ${id} 的心情记录。` };
  }
  
  const current = existing[0];
  const newMood = mood || current.mood;
  const newIntensity = intensity ?? current.intensity;
  const newNote = note !== undefined ? note : current.note;
  
  await pool.query(
    'UPDATE moods SET mood = ?, intensity = ?, note = ? WHERE id = ?',
    [newMood, newIntensity, newNote, id]
  );
  
  revalidatePath('/');
  
  const moodLabel = MOOD_LABELS[newMood] || newMood;
  const intensityLabel = ['', '一点点', '中度', '超级'][newIntensity] || '';
  
  return { 
    success: true, 
    message: `已将心情记录修改为：${intensityLabel}${moodLabel}${newNote ? `（${newNote}）` : ''}` 
  };
}

/**
 * AI 调用：删除心情记录
 */
export async function deleteMoodFromAI({ id }: { id: number }) {
  // 先检查记录是否存在
  const { rows: existing } = await pool.query<{ id: number; mood: string; date_key: string }>(
    'SELECT id, mood, date_key FROM moods WHERE id = ?',
    [id]
  );
  
  if (!existing || existing.length === 0) {
    return { success: false, message: `找不到 ID 为 ${id} 的心情记录。` };
  }
  
  const record = existing[0];
  const moodLabel = MOOD_LABELS[record.mood] || record.mood;
  
  await pool.query('DELETE FROM moods WHERE id = ?', [id]);
  
  revalidatePath('/');
  
  return { 
    success: true, 
    message: `已删除 ${record.date_key || '该日期'} 的 ${moodLabel} 心情记录。` 
  };
}

/**
 * AI 调用：查询经期记录列表
 */
export async function listPeriodsFromAI({ limit = 5 }: { limit?: number }) {
  const safeLimit = Math.min(Math.max(1, limit), 12);
  
  // 使用 created_at 而非 start_date，避免时区问题
  const { rows } = await pool.query<{
    id: number;
    start_date: Date;
    created_at: Date;
  }>(
    'SELECT id, start_date, created_at FROM periods ORDER BY created_at DESC LIMIT ?',
    [safeLimit]
  );
  
  if (rows.length === 0) {
    return { 
      success: true, 
      message: '还没有任何经期记录。',
      periods: [] 
    };
  }
  
  // 格式化记录
  const formattedPeriods = rows.map((p, idx) => {
    // 使用 created_at 作为实际开始日期
    const dateStr = new Date(p.created_at).toLocaleDateString('zh-CN');
    return {
      index: idx + 1,
      id: p.id,
      date: dateStr,
      summary: `${idx + 1}. [ID:${p.id}] ${dateStr}`,
    };
  });
  
  return {
    success: true,
    message: `找到 ${rows.length} 条经期记录：\n${formattedPeriods.map(p => p.summary).join('\n')}`,
    periods: formattedPeriods,
  };
}

/**
 * AI 调用：修改经期记录
 */
export async function updatePeriodFromAI({ id, startDate }: { id: number; startDate: string }) {
  // 先检查记录是否存在
  const { rows: existing } = await pool.query<{ id: number }>(
    'SELECT id FROM periods WHERE id = ?',
    [id]
  );
  
  if (!existing || existing.length === 0) {
    return { success: false, message: `找不到 ID 为 ${id} 的经期记录。` };
  }
  
  const newDate = new Date(startDate);
  
  // 更新 start_date 和 created_at，保持一致性
  await pool.query(
    'UPDATE periods SET start_date = ?, created_at = ? WHERE id = ?',
    [newDate, newDate, id]
  );
  
  revalidatePath('/');
  
  const dateStr = newDate.toLocaleDateString('zh-CN');
  
  return { 
    success: true, 
    message: `已将经期开始日期修改为 ${dateStr}。` 
  };
}

/**
 * AI 调用：删除经期记录
 */
export async function deletePeriodFromAI({ id }: { id: number }) {
  // 先检查记录是否存在
  const { rows: existing } = await pool.query<{ id: number; created_at: Date }>(
    'SELECT id, created_at FROM periods WHERE id = ?',
    [id]
  );
  
  if (!existing || existing.length === 0) {
    return { success: false, message: `找不到 ID 为 ${id} 的经期记录。` };
  }
  
  const record = existing[0];
  const dateStr = new Date(record.created_at).toLocaleDateString('zh-CN');
  
  await pool.query('DELETE FROM periods WHERE id = ?', [id]);
  
  revalidatePath('/');
  
  return { 
    success: true, 
    message: `已删除 ${dateStr} 的经期记录。` 
  };
}

/**
 * AI 调用：搜索/列出记忆
 * 
 * 使用向量搜索查找相关记忆，返回 ID 和内容，以便修改或删除
 */
export async function listMemoriesFromAI({ query, limit = 5 }: { query: string; limit?: number }) {
  if (!query.trim()) {
    return { success: false, message: '请提供搜索关键词。' };
  }

  const memories = await searchMemories(query, limit);

  if (memories.length === 0) {
    return { success: true, message: '没有找到相关的记忆。', memories: [] };
  }

  // 格式化输出，包含 ID 以便 AI 可以引用
  const formatted = memories.map((m, i) => {
    return `[${i + 1}] ID: ${m.id} (Time: ${m.metadata.datetime})\nContent: ${m.text}\n`;
  }).join('\n');

  return {
    success: true,
    message: `找到以下相关记忆：\n${formatted}\n\n如果要修改或删除，请使用 list 中的 ID。`,
    memories: memories.map(m => ({
      id: m.id,
      text: m.text,
      datetime: m.metadata.datetime
    }))
  };
}

/**
 * AI 调用：修改记忆
 * 
 * 使用 upsert 机制（addMemories 会覆盖相同 ID 的记录）
 */
export async function updateMemoryFromAI({ id, content }: { id: string; content: string }) {
  if (!id || !content) {
    return { success: false, message: 'ID and content are required.' };
  }
  
  const now = new Date();
  const datetime = now.toISOString();
  
  // 构造 MemoryRecord
  const memory: MemoryRecord = {
    id: id,
    text: content,
    metadata: {
      type: 'note', 
      author: 'piggy',
      datetime: datetime,
    },
  };

  try {
    await addMemories([memory]);
    return { success: true, message: '记忆已更新。' };
  } catch (err) {
    console.error('Failed to update memory', err);
    return { success: false, message: '更新失败。' };
  }
}

/**
 * AI 调用：删除记忆
 */
export async function deleteMemoryFromAI({ id }: { id: string }) {
  if (!id) {
    return { success: false, message: 'ID is required.' };
  }

  try {
    await deleteMemories([id]);
    return { success: true, message: '记忆已删除。' };
  } catch (err) {
    console.error('Failed to delete memory', err);
    return { success: false, message: '删除失败。' };
  }
}
