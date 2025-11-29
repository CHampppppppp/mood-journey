/**
 * AI Tools Definition - AI 工具定义
 * 
 * 这个文件定义了 AI 可以使用的所有 Function Calling 工具。
 * 遵循 OpenAI 的 Tools Schema 格式。
 * 
 * 包含的工具：
 * 1. 心情管理：log_mood, list_moods, update_mood, delete_mood
 * 2. 经期管理：track_period, list_periods, update_period, delete_period
 * 3. 记忆辅助：save_memory (保存重要事项)
 * 4. 交互增强：show_sticker (展示表情包), get_weather (查询天气)
 * 
 * 每个工具都有详细的 description，指导 AI 何时以及如何使用该工具。
 */

import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const TOOLS: ChatCompletionTool[] = [
  // ==================== 心情记录相关工具 ====================
  {
    type: 'function',
    function: {
      name: 'log_mood',
      description: '记录 piggy（用户）当天的心情、情绪状态。**重要规则：1) 只能记录 piggy 的心情，不能记录你自己的感受；2) 只有当 piggy 明确要求记录心情时（如"帮我记一下心情"、"记录我的心情"、"记心情"等）才调用此工具；3) 不要因为 piggy 在聊天中提到了情绪就自动记录，因为一天只能记录一种心情，用户可能只是随口提到，不代表整天的整体心情。** 如果你（Champ）自己有感受或情绪，请用语言表达，不要调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          mood: {
            type: 'string',
            enum: ['happy', 'blissful', 'tired', 'annoyed', 'angry', 'depressed'],
            description: '心情类别: happy(开心), blissful(幸福), tired(累), annoyed(烦躁), angry(生气), depressed(沮丧)',
          },
          intensity: {
            type: 'number',
            description: '心情强度，1-3。1=一点点，2=中度，3=超级。',
            minimum: 1,
            maximum: 3,
          },
          note: {
            type: 'string',
            description: '关于心情的简短备注或原因。**重要：必须用第一人称"我"来写，就像 piggy 自己写的一样。不要用第三人称"piggy说..."或"piggy..."。** 例如："我今天好难过，可能是因为生理期不舒服"而不是"piggy说今天好难过，可能是因为生理期不舒服"。',
          },
        },
        required: ['mood', 'intensity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_moods',
      description: '查询心情记录列表。当用户想要查看、删除或修改之前的心情记录时，先调用此工具获取记录列表，让用户确认要操作的是哪一条。',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: '返回的记录数量，默认 5 条，最多 20 条',
            minimum: 1,
            maximum: 20,
          },
          date: {
            type: 'string',
            format: 'date',
            description: '查询指定日期的记录，格式 YYYY-MM-DD。如果不提供，返回最近的记录。',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_mood',
      description: '修改指定的心情记录。**使用前必须先调用 list_moods 获取记录 ID。** 用户可能会说"修改一下昨天的心情"、"把上次的心情改成开心"等。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: '要修改的心情记录 ID（通过 list_moods 获取）',
          },
          mood: {
            type: 'string',
            enum: ['happy', 'blissful', 'tired', 'annoyed', 'angry', 'depressed'],
            description: '新的心情类别（可选，不提供则保持原值）',
          },
          intensity: {
            type: 'number',
            description: '新的心情强度 1-3（可选，不提供则保持原值）',
            minimum: 1,
            maximum: 3,
          },
          note: {
            type: 'string',
            description: '新的备注内容（可选，不提供则保持原值）',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_mood',
      description: '删除指定的心情记录。**使用前必须先调用 list_moods 获取记录 ID，并向用户确认。** 删除操作不可恢复，请谨慎使用。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: '要删除的心情记录 ID（通过 list_moods 获取）',
          },
        },
        required: ['id'],
      },
    },
  },
  // ==================== 经期记录相关工具 ====================
  {
    type: 'function',
    function: {
      name: 'track_period',
      description: '记录用户生理期（大姨妈）开始。当用户提到大姨妈来了、肚子痛、月经、经期等生理期相关话题时调用。',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            format: 'date',
            description: '生理期开始日期，格式 YYYY-MM-DD，默认为今天',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_periods',
      description: '查询经期记录列表。当用户想要查看、删除或修改之前的经期记录时，先调用此工具获取记录列表。',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: '返回的记录数量，默认 5 条，最多 12 条',
            minimum: 1,
            maximum: 12,
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_period',
      description: '修改指定的经期记录的开始日期。**使用前必须先调用 list_periods 获取记录 ID。** 用户可能会说"经期日期记错了"、"把上次经期改到xx号"等。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: '要修改的经期记录 ID（通过 list_periods 获取）',
          },
          startDate: {
            type: 'string',
            format: 'date',
            description: '新的经期开始日期，格式 YYYY-MM-DD',
          },
        },
        required: ['id', 'startDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_period',
      description: '删除指定的经期记录。**使用前必须先调用 list_periods 获取记录 ID，并向用户确认。** 删除操作不可恢复，请谨慎使用。用户可能会说"删掉上次的经期记录"、"那次经期记错了，删掉吧"等。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: '要删除的经期记录 ID（通过 list_periods 获取）',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: '保存重要的信息或用户明确要求记住的事情。比如未来的计划、重要的日期、或者用户的喜好等。琐碎的小事不用记住，防止向量数据库繁冗。但是有用的小细节，能让她感受到被重视被关心的细节要记住。',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '需要记住的具体内容',
          },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_memories',
      description: '搜索记忆列表。当用户声称你记错了，或者想要修改/删除之前的记忆时，使用此工具搜索相关记忆以获取 ID。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索关键词，例如："吃香菜"、"生日"、"旅游计划"',
          },
          limit: {
            type: 'number',
            description: '返回数量，默认 5',
            minimum: 1,
            maximum: 10,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_memory',
      description: '修改指定的记忆内容。**使用前必须先调用 list_memories 获取记录 ID。**',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '要修改的记忆 ID',
          },
          content: {
            type: 'string',
            description: '新的记忆内容',
          },
        },
        required: ['id', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_memory',
      description: '删除指定的记忆。**使用前必须先调用 list_memories 获取记录 ID，并向用户确认。**',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: '要删除的记忆 ID',
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_sticker',
      description: '在聊天界面展示一张表情包或贴纸来回应用户心情。',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['happy', 'love', 'sad', 'angry', 'tired'],
            description: '表情包类别',
          },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定城市的实时天气信息。当用户询问天气时调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '城市名称，例如：北京、上海、深圳。如果不提供，默认查询用户所在城市或常用城市。',
          },
        },
        required: [],
      },
    },
  },
];

