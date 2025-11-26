import { NextRequest, NextResponse } from 'next/server';
import { callDeepseekChat, type ChatMessage, getSystemPrompt } from '@/lib/llm';
import { searchMemories } from '@/lib/vectorStore';

type ApiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body?.messages || []) as ApiChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages is required' },
        { status: 400 }
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    const query = lastUserMessage?.content || '';

    // RAG 检索记忆
    let context = '';
    if (query.trim()) {
      const memories = await searchMemories(query, 6);
      if (memories.length > 0) {
        const formatted = memories
          .map((m) => {
            const when = m.metadata.datetime;
            const type = m.metadata.type;
            const author = m.metadata.author;
            return `【时间】${when}  【类型】${type}  【来自】${author}\n${m.text}`;
          })
          .join('\n\n---\n\n');

        context = `下面是你们之前的部分记忆，请在合适的时候自然地引用或参考：\n\n${formatted}`;
      }
    }

    const llmMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) as ChatMessage[];

    const reply = await callDeepseekChat({
      messages: llmMessages,
      context,
    });

    return NextResponse.json({
      reply,
      systemPrompt: getSystemPrompt(),
    });
  } catch (error) {
    console.error('[api/chat] error', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}


