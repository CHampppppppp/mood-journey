import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const TOOLS: ChatCompletionTool[] = [
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

