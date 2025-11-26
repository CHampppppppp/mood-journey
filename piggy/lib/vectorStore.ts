import { ChromaClient, IncludeEnum } from "chromadb";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 对于简单个人项目，可以直接用默认的 ChromaClient 配置（内嵌/本地存储）。
// 如果你本机起了 Chroma Server，可以把这里改成 new ChromaClient({ path: "http://localhost:8000" })
const chromaClient = new ChromaClient();

const COLLECTION_NAME = "user-memories";

async function getOrCreateCollection() {
  return chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { description: "Personal memory base for Piggy" },
  });
}

export type MemoryItem = {
  id: string;
  text: string;
  meta?: Record<string, unknown>;
};

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "[vectorStore] Missing OPENAI_API_KEY. Please set it in your env."
    );
  }

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return res.data.map((d) => d.embedding);
}

export async function addMemories(
  userId: string,
  items: MemoryItem[]
): Promise<void> {
  const collection = await getOrCreateCollection();
  const texts = items.map((i) => i.text);
  const embeddings = await embedTexts(texts);

  await collection.add({
    ids: items.map((i) => `${userId}-${i.id}`),
    documents: texts,
    metadatas: items.map((i) => ({
      userId,
      ...(i.meta ?? {}),
    })),
    embeddings,
  });
}

export type SearchResult = {
  documents: string[];
  metadatas: Record<string, unknown>[];
  distances: number[];
};

export async function searchMemories(
  userId: string,
  query: string,
  k = 5
): Promise<SearchResult> {
  const collection = await getOrCreateCollection();
  const [queryEmbedding] = await embedTexts([query]);

  const res = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: k,
    where: { userId },
    include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances],
  });

  return {
    documents: res.documents?.[0] ?? [],
    metadatas: (res.metadatas?.[0] as Record<string, unknown>[]) ?? [],
    distances: res.distances?.[0] ?? [],
  };
}


