import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

export type MemoryMetadata = {
  type: 'mood' | 'file' | 'note';
  author: 'piggy' | 'champ';
  datetime: string;
  sourceId?: string;
  sourceFilename?: string;
};

export type MemoryRecord = {
  id: string;
  text: string;
  metadata: MemoryMetadata;
};

const PINECONE_INDEX_NAME =
  process.env.PINECONE_INDEX || 'piggy-memories';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

let pineconeClient: Pinecone | null = null;

function getPineconeIndex() {
  if (!PINECONE_API_KEY) {
    console.warn(
      '[vectorStore] PINECONE_API_KEY is not set. RAG will be disabled.'
    );
    return null;
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
  }

  return pineconeClient.index(PINECONE_INDEX_NAME);
}

// OpenAI 向量模型，用于生成向量写入 Pinecone
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openaiEmbedClient = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE,
      timeout: 5000, // 5s 超时时间，避免请求卡太久影响用户体验
    })
  : null;

/**
 * 将文本转换为向量（embedding）
 * 
 * 这个函数使用 OpenAI 的 embedding 模型将文本转换为高维向量
 * 向量可以用于语义搜索：相似的文本会有相似的向量
 * 
 * @param texts - 需要转换的文本数组
 * @returns 向量数组，每个文本对应一个向量（数字数组）
 * 
 * 错误处理：
 * - 如果 API Key 未设置，返回空向量数组（RAG 功能禁用）
 * - 如果 API 调用失败，返回空向量数组（这次请求不使用 RAG，但聊天正常）
 * - 这样设计可以确保即使向量服务不可用，聊天功能仍然可用
 */
async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  if (!openaiEmbedClient) {
    console.warn(
      '[vectorStore] OPENAI_API_KEY is not set. Embedding will be skipped and RAG will be disabled.'
    );
    return texts.map(() => []);
  }

  try {
    const res = await openaiEmbedClient.embeddings.create({
      model: 'text-embedding-3-small', // 使用小型模型，平衡性能和成本
      input: texts,
    });

    return res.data.map((item) => item.embedding as number[]);
  } catch (err) {
    console.error(
      '[vectorStore] Failed to create embeddings from OpenAI, RAG will be skipped for this request',
      err
    );
    // 返回空向量：后续查询会得到空结果，相当于这次对话不使用 RAG，但聊天正常
    return texts.map(() => []);
  }
}

/**
 * 将记忆添加到向量数据库
 * 
 * 处理流程：
 * 1. 将文本转换为向量（embedding）
 * 2. 将向量和元数据一起存储到 Pinecone
 * 3. 使用 upsert 操作，如果 ID 已存在则更新，否则插入
 * 
 * @param records - 记忆记录数组，包含文本和元数据
 * 
 * 注意：
 * - 如果向量生成失败（返回空向量），该记录会被跳过
 * - 使用 'piggy' namespace 存储所有记忆，后续可以根据用户拆分
 * - 这是一个异步操作，不会阻塞调用者
 */
export async function addMemories(records: MemoryRecord[]): Promise<void> {
  if (!records.length) return;

  // Index，类似于数据库
  const index = getPineconeIndex();
  if (!index) return;

  // 提取所有文本并转换为向量
  const texts = records.map((r) => r.text);
  const embeddings = await embedTexts(texts);

  // 构建向量对象，包含 ID、向量值和元数据
  const vectors = [];
  for (let i = 0; i < records.length; i += 1) {
    const emb = embeddings[i];
    // 跳过生成失败的向量（空向量）
    if (!emb || emb.length === 0) continue;

    vectors.push({
      id: records[i].id,
      values: emb,
      metadata: {
        text: records[i].text, // 保存原始文本，方便后续检索和显示
        ...records[i].metadata,
      },
    });
  }

  if (!vectors.length) return;

  // 找”数据库”中的“piggy表”
  // 使用 upsert 操作：如果 ID 已存在则更新，否则插入
  await index.namespace('piggy').upsert(vectors);
}

export type RetrievedMemory = {
  text: string;
  metadata: MemoryMetadata;
  distance?: number;//相似度分数
};

/**
 * 在向量数据库中搜索相关记忆
 * 
 * 使用语义搜索：将查询转换为向量，然后在向量空间中查找最相似的记忆
 * 
 * @param query - 搜索查询文本
 * @param k - 返回的最相似记忆数量（默认 5）
 * @returns 检索到的记忆数组，按相似度排序
 * 
 * 工作原理：
 * 1. 将查询文本转换为向量
 * 2. 在 Pinecone 中搜索最相似的 k 个向量
 * 3. 返回对应的记忆文本和元数据
 * 
 * 相似度计算：
 * - Pinecone 返回的是相似度分数（score），范围 0-1
 * - 转换为距离：distance = 1 - score（距离越小越相似）
 * 
 * 错误处理：
 * - 如果查询为空，返回空数组
 * - 如果向量生成失败，返回空数组
 * - 如果 Pinecone 查询失败，返回空数组（不影响聊天功能）
 */
export async function searchMemories(query: string,k: number = 5): Promise<RetrievedMemory[]> {
  if (!query.trim()) {
    console.log('[vectorStore] 查询为空，跳过记忆检索');
    return [];
  }

  const index = getPineconeIndex();
  if (!index) {
    console.warn('[vectorStore] Pinecone 索引不可用，跳过记忆检索');
    return [];
  }

  console.log(`[vectorStore] 开始记忆检索: query="${query.substring(0, 50)}${query.length > 50 ? '...' : ''}", topK=${k}`);
  
  // 将查询转换为向量
  // query是单个字符串，需要包装成数组，[query]
  // 只传入一个字符串，返回的二维数组只有一个向量，解构后得到该向量queryEmbedding（一维数组）
  const embedStartTime = Date.now();
  const [queryEmbedding] = await embedTexts([query]);
  const embedDuration = Date.now() - embedStartTime;
  
  if (!queryEmbedding || queryEmbedding.length === 0) {
    console.warn('[vectorStore] 向量化失败，跳过记忆检索');
    return [];
  }
  
  console.log(`[vectorStore] 向量化完成 (耗时: ${embedDuration}ms, 维度: ${queryEmbedding.length})`);

  try {
    // 在向量空间中搜索最相似的 k 个向量
    const searchStartTime = Date.now();
    const result = await index.namespace('piggy').query({
      vector: queryEmbedding,
      topK: k, // 返回最相似的 k 个结果
      includeMetadata: true, // 包含元数据，方便后续处理
    });
    const searchDuration = Date.now() - searchStartTime;

    const matches = result.matches || [];//result.matches才是pinecone返回的结果
    console.log(`[vectorStore] Pinecone 查询完成 (耗时: ${searchDuration}ms, 匹配数: ${matches.length})`);
    
    // 将 Pinecone 返回的结果转换为我们的格式
    const items: RetrievedMemory[] = matches
      .map((m, i) => {
        const md = (m.metadata || {}) as any;
        const text = (md.text as string) || '';
        if (!text) return null; // 跳过没有文本的结果
        const metadata: MemoryMetadata = {
          type: md.type,
          author: md.author,
          datetime: md.datetime,
          sourceId: md.sourceId,
          sourceFilename: md.sourceFilename,
        };
        const distance = typeof m.score === 'number' ? 1 - m.score : undefined;
        const similarity = typeof m.score === 'number' ? m.score : undefined;
        
        console.log(`[vectorStore]   [${i + 1}] ${metadata.type} (${metadata.datetime}): 相似度=${similarity?.toFixed(3)}, 距离=${distance?.toFixed(3)}`);
        
        return {
          text,
          metadata,
          // 将相似度分数转换为距离（距离越小越相似）
          distance,
        };
      })
      .filter(Boolean) as RetrievedMemory[];

    console.log(`[vectorStore] 记忆检索完成: 返回 ${items.length} 条有效结果`);
    return items;
  } catch (err) {
    console.error('[vectorStore] Pinecone 查询失败:', err);
    return []; // 查询失败时返回空数组，不影响聊天功能
  }
}
