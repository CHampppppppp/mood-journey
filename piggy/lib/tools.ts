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
            description: '关于 piggy 心情的简短备注或原因（从 piggy 的角度描述，不要包含你自己的感受）',
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
      description: '记录用户生理期（大姨妈）开始。当用户提到大姨妈来了、肚子痛等生理期相关话题时调用。',
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
      description: '保存重要的信息或用户明确要求记住的事情。比如未来的计划、重要的日期、或者用户的喜好等。',
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
];

