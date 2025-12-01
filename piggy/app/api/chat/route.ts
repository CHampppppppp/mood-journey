import { NextRequest, NextResponse } from 'next/server';
import {
  callDeepseekChat,
  type ChatMessage,
  getSystemPrompt,
  classifyQuery,
  getCurrentInfo,
} from '@/lib/llm';
import { searchMemories, addMemories, type MemoryRecord } from '@/lib/vectorStore';
import { TOOLS } from '@/lib/tools';
import { logMoodFromAI, trackPeriodFromAI } from '@/lib/actions';

/**
 * 获取天气信息
 * 支持多种天气API（按优先级）：
 * 1. 和风天气API (需要 QWEATHER_API_KEY 和 QWEATHER_API_HOST，推荐，最适合中国城市)
 * 2. 高德地图API (需要 AMAP_API_KEY，适合中国城市)
 * 3. OpenWeatherMap (需要 OPENWEATHER_API_KEY，国际通用)
 * 
 * 和风天气API配置说明：
 * - QWEATHER_API_KEY: API密钥（在控制台获取）
 * - QWEATHER_API_HOST: API Host（在控制台-设置中查看，格式如：abcxyz.qweatherapi.com）
 *   如果不配置，将使用默认的 devapi.qweather.com（免费版）或 api.qweather.com（商业版）
 */
async function getWeatherInfo(city: string): Promise<string> {
  // 优先使用和风天气API（最适合中国城市）
  const qweatherKey = process.env.QWEATHER_API_KEY;
  const qweatherHost = process.env.QWEATHER_API_HOST; // 自定义API Host
  
  if (qweatherKey) {
    try {
      // 确定API Host：优先使用自定义Host，否则使用默认免费版
      const apiHost = qweatherHost || 'devapi.qweather.com';
      
      // 和风天气API支持直接使用城市名称查询
      // 先尝试通过城市搜索获取location ID（更准确）
      const searchUrl = `https://${apiHost}/v2/city/lookup?location=${encodeURIComponent(city)}&number=1`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'X-QW-Api-Key': qweatherKey,
        },
      });
      
      let locationId = city; // 默认使用城市名
      let locationName = city;
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (searchData.code === '200' && searchData.location && searchData.location.length > 0) {
          locationId = searchData.location[0].id; // 使用找到的城市ID
          locationName = searchData.location[0].name;
          console.log(`[getWeatherInfo] 和风天气找到城市: ${locationName} (ID: ${locationId})`);
        } else {
          const errorCode = searchData.code || '未知';
          console.warn(`[getWeatherInfo] 和风天气城市搜索未找到: ${city} (错误码: ${errorCode})，将使用城市名直接查询`);
        }
      } else {
        const errorText = await searchResponse.text().catch(() => '');
        console.warn(`[getWeatherInfo] 和风天气城市搜索失败: ${searchResponse.status} ${searchResponse.statusText}`);
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            console.warn(`[getWeatherInfo] 错误详情:`, errorData);
          } catch {
            console.warn(`[getWeatherInfo] 错误详情: ${errorText.substring(0, 200)}`);
          }
        }
      }
      
      // 获取实时天气（使用location ID或城市名）
      const weatherUrl = `https://${apiHost}/v7/weather/now?location=${locationId}`;
      const weatherResponse = await fetch(weatherUrl, {
        headers: {
          'X-QW-Api-Key': qweatherKey,
        },
      });
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        
        if (weatherData.code === '200' && weatherData.now) {
          const now = weatherData.now;
          return `【${locationName}天气】\n天气：${now.text}\n温度：${now.temp}℃\n体感温度：${now.feelsLike}℃\n风向：${now.windDir}\n风力：${now.windScale}级\n风速：${now.windSpeed} km/h\n湿度：${now.humidity}%\n能见度：${now.vis} km\n气压：${now.pressure} hPa\n更新时间：${now.obsTime}`;
        } else {
          const errorMsg = weatherData.code || '未知错误';
          const errorText = weatherData.message || '';
          console.error(`[getWeatherInfo] 和风天气API返回错误: ${errorMsg} ${errorText}`, JSON.stringify(weatherData));
        }
      } else {
        const errorText = await weatherResponse.text().catch(() => '');
        console.error(`[getWeatherInfo] 和风天气API HTTP错误: ${weatherResponse.status} ${weatherResponse.statusText}`);
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            console.error(`[getWeatherInfo] 错误详情:`, errorData);
          } catch {
            console.error(`[getWeatherInfo] 错误详情: ${errorText.substring(0, 200)}`);
          }
        }
        
        // 如果使用默认Host失败，且没有配置自定义Host，尝试商业版端点
        if (!qweatherHost && weatherResponse.status === 403) {
          console.warn('[getWeatherInfo] 免费版API返回403，尝试使用商业版API端点...');
          const commercialUrl = `https://api.qweather.com/v7/weather/now?location=${locationId}`;
          const commercialResponse = await fetch(commercialUrl, {
            headers: {
              'X-QW-Api-Key': qweatherKey,
            },
          });
          if (commercialResponse.ok) {
            const commercialData = await commercialResponse.json();
            if (commercialData.code === '200' && commercialData.now) {
              const now = commercialData.now;
              return `【${locationName}天气】\n天气：${now.text}\n温度：${now.temp}℃\n体感温度：${now.feelsLike}℃\n风向：${now.windDir}\n风力：${now.windScale}级\n风速：${now.windSpeed} km/h\n湿度：${now.humidity}%\n能见度：${now.vis} km\n气压：${now.pressure} hPa\n更新时间：${now.obsTime}`;
            }
          }
        }
      }
    } catch (error) {
      console.error('[getWeatherInfo] 和风天气API调用失败:', error);
    }
  }

  // 备用1：使用高德地图API（适合中国城市）
  const amapKey = process.env.AMAP_API_KEY;
  if (amapKey) {
    try {
      // 高德地图API可能需要城市名称带"市"后缀，尝试两种格式
      let cityName = city;
      if (!city.endsWith('市') && !city.endsWith('县') && !city.endsWith('区')) {
        cityName = `${city}市`; // 尝试添加"市"后缀
      }
      
      const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${amapKey}&city=${encodeURIComponent(cityName)}&extensions=base&output=json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[getWeatherInfo] 高德地图API HTTP错误: ${response.status} ${response.statusText}`);
        // 如果带"市"失败，尝试原始城市名
        if (cityName !== city) {
          const url2 = `https://restapi.amap.com/v3/weather/weatherInfo?key=${amapKey}&city=${encodeURIComponent(city)}&extensions=base&output=json`;
          const response2 = await fetch(url2);
          if (response2.ok) {
            const data2 = await response2.json();
            if (data2.status === '1' && data2.lives && data2.lives.length > 0) {
              const weather = data2.lives[0];
              return `【${weather.city}天气】\n天气：${weather.weather}\n温度：${weather.temperature}℃\n风向：${weather.winddirection}\n风力：${weather.windpower}级\n湿度：${weather.humidity}%\n发布时间：${weather.reporttime}`;
            }
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && data.lives && data.lives.length > 0) {
        const weather = data.lives[0];
        return `【${weather.city}天气】\n天气：${weather.weather}\n温度：${weather.temperature}℃\n风向：${weather.winddirection}\n风力：${weather.windpower}级\n湿度：${weather.humidity}%\n发布时间：${weather.reporttime}`;
      } else {
        // 记录详细的错误信息
        const errorMsg = data.infocode ? `错误码: ${data.infocode}, 信息: ${data.info || '未知错误'}` : '未知错误';
        console.error(`[getWeatherInfo] 高德地图API返回错误: ${errorMsg}`, JSON.stringify(data));
        
        // 如果是平台不匹配错误，提供更明确的提示
        if (data.infocode === '10009' || data.info === 'USERKEY_PLAT_NOMATCH') {
          console.error('[getWeatherInfo] 高德地图API密钥平台不匹配，请检查：1) 是否使用了Web服务(JS API)密钥而非服务端密钥；2) 是否需要在控制台设置IP白名单或服务器域名白名单');
        }
        
        // 如果带"市"失败，尝试原始城市名
        if (cityName !== city) {
          const url2 = `https://restapi.amap.com/v3/weather/weatherInfo?key=${amapKey}&city=${encodeURIComponent(city)}&extensions=base&output=json`;
          const response2 = await fetch(url2);
          if (response2.ok) {
            const data2 = await response2.json();
            if (data2.status === '1' && data2.lives && data2.lives.length > 0) {
              const weather = data2.lives[0];
              return `【${weather.city}天气】\n天气：${weather.weather}\n温度：${weather.temperature}℃\n风向：${weather.winddirection}\n风力：${weather.windpower}级\n湿度：${weather.humidity}%\n发布时间：${weather.reporttime}`;
            }
          }
        }
        // 继续尝试备用API
      }
    } catch (error) {
      console.error('[getWeatherInfo] 高德地图API调用失败:', error);
      // 继续尝试备用API
    }
  }

  // 备用：使用 OpenWeatherMap API
  const openWeatherKey = process.env.OPENWEATHER_API_KEY;
  if (openWeatherKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${openWeatherKey}&units=metric&lang=zh_cn`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[getWeatherInfo] OpenWeatherMap API HTTP错误: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.cod === 200) {
        return `【${data.name}天气】\n天气：${data.weather[0].description}\n温度：${Math.round(data.main.temp)}℃\n体感温度：${Math.round(data.main.feels_like)}℃\n最高温度：${Math.round(data.main.temp_max)}℃\n最低温度：${Math.round(data.main.temp_min)}℃\n湿度：${data.main.humidity}%\n风速：${data.wind?.speed || 0} m/s`;
      } else {
        const errorMsg = data.message || '未知错误';
        console.error(`[getWeatherInfo] OpenWeatherMap API返回错误: ${errorMsg}`, JSON.stringify(data));
        // 404通常表示城市未找到，尝试使用英文城市名或拼音
        if (response.status === 404) {
          console.warn(`[getWeatherInfo] 城市"${city}"未找到，OpenWeatherMap可能需要英文城市名`);
        }
        return `抱歉，无法获取 ${city} 的天气信息：${errorMsg}`;
      }
    } catch (error) {
      console.error('[getWeatherInfo] OpenWeatherMap API调用失败:', error);
    }
  }

  // 如果所有API都不可用
  if (!qweatherKey && !amapKey && !openWeatherKey) {
    return `抱歉，天气服务暂时不可用。请确保已配置天气API密钥（推荐：QWEATHER_API_KEY，或使用 AMAP_API_KEY / OPENWEATHER_API_KEY）。`;
  }
  
  return `抱歉，无法获取 ${city} 的天气信息。请检查API密钥配置是否正确，或稍后再试。`;
}

type ApiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// 日志收集器，用于将后端日志传递到前端
const logCollector: string[] = [];

function addLog(message: string, requestId: string) {
  const logMessage = `[api/chat:${requestId}] ${message}`;
  console.log(logMessage);
  logCollector.push(logMessage);
  // 只保留最近100条日志，避免内存泄漏
  if (logCollector.length > 100) {
    logCollector.shift();
  }
}

export async function POST(req: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startTime = Date.now();
  // 清空当前请求的日志收集器
  const currentLogs: string[] = [];
  
  try {
    const body = await req.json();
    const messages = (body?.messages || []) as ApiChatMessage[];
    const isStreaming = body?.stream === true;

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error(`[api/chat:${requestId}] 错误: messages 为空或格式错误`);
      return NextResponse.json(
        { error: 'messages is required' },
        { status: 400 }
      );
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUserMessage?.content || '';
    
    // 1. 用户发送的消息
    const userLog = `用户消息: "${query}"`;
    console.log(`[api/chat:${requestId}] ${userLog}`);
    currentLogs.push(userLog);

    // 1. 构建上下文 (Context)
    let context = '';
    if (query.trim()) {
      // 只有在第一轮查询时进行分类和记忆检索
      // 如果后续在 Function Calling 循环中，上下文保持不变
      const queryType = await classifyQuery(query);
      
      const currentInfo = getCurrentInfo();
      // 4. 当前时间
      const timeLog = `当前时间: ${currentInfo.currentTime}`;
      console.log(`[api/chat:${requestId}] ${timeLog}`);
      currentLogs.push(timeLog);
      
      let realtimeContext = `当前时间信息：
- 现在是：${currentInfo.currentTime}
- 今天是：${currentInfo.currentDate}
- 时区：${currentInfo.timeZone}`;

      if (queryType === 'realtime') {
        context = realtimeContext;
      } else {
        // memory or mixed
        const k = queryType === 'mixed' ? 4 : 6;
        const memories = await searchMemories(query, k);
        
        if (memories.length > 0) {
          // 7. 检索到的记忆摘要
          const memoryLog = `检索到的记忆摘要: ${memories.length} 条`;
          console.log(`[api/chat:${requestId}] ${memoryLog}`);
          currentLogs.push(memoryLog);
          memories.forEach((m, i) => {
            // 将换行符替换为空格，避免日志格式混乱
            const textPreview = m.text.replace(/\n/g, ' ').substring(0, 100) + (m.text.length > 100 ? '...' : '');
            const memoryDetail = `  [${i + 1}] ${m.metadata.type} (${m.metadata.datetime}): ${textPreview}`;
            console.log(`[api/chat:${requestId}] ${memoryDetail}`);
            currentLogs.push(memoryDetail);
          });
          
          const formatted = memories
            .map((m) => {
              const when = m.metadata.datetime;
              const type = m.metadata.type;
              const author = m.metadata.author;
              return `【时间】${when}  【类型】${type}  【来自】${author}\n${m.text}`;
            })
            .join('\n\n---\n\n');

          context = `${realtimeContext}\n\n下面是你们之前的部分记忆，请在合适的时候自然地引用或参考：\n\n${formatted}`;
        } else {
          context = realtimeContext;
        }
      }
    }

    // 2. 准备初始消息列表
    let llmMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) as ChatMessage[];

    // 3. 循环执行 LLM 和 Tools
    // 我们使用"同步执行工具，最后返回结果"的策略
    // 这样可以支持 Function Calling，同时兼容前端的接口
    let finalReply = '';
    let finished = false;
    let loopCount = 0;
    const MAX_LOOPS = 5; // 防止死循环
    let needsRefresh = false; // 标记是否需要刷新页面（数据库更新时）

    while (!finished && loopCount < MAX_LOOPS) {
      loopCount++;
      
      // 调用 LLM
      const response = await callDeepseekChat({
        messages: llmMessages,
        context: loopCount === 1 ? context : undefined,
        tools: TOOLS,
      });

      if (typeof response === 'string') {
        // LLM 返回了文本回复，流程结束
        finalReply = response;
        finished = true;
      } else {
        // LLM 返回了工具调用请求 (response 是 ChatMessage 对象)
        const toolCalls = response.tool_calls;
        if (!toolCalls || toolCalls.length === 0) {
           // 理论上不应该发生，如果发生则结束
           finalReply = response.content || '';
           finished = true;
           continue;
        }

        // 5. 调用了哪些工具
        const toolNames = toolCalls.map((t: any) => t.function.name);
        const toolLog = `调用工具: ${toolNames.join(', ')}`;
        console.log(`[api/chat:${requestId}] ${toolLog}`);
        currentLogs.push(toolLog);

        // 将 assistant 的 tool_calls 消息追加到历史
        llmMessages.push(response);

        // 执行所有工具调用
        for (const toolCall of toolCalls) {
          const fnName = toolCall.function.name;
          const argsString = toolCall.function.arguments;
          
          let args = {};
          try {
            args = JSON.parse(argsString);
          } catch (e) {
            console.error(`[api/chat:${requestId}] 参数解析失败:`, e);
          }

          // 6. 提供给工具的参数
          const paramLog = `工具参数 [${fnName}]: ${JSON.stringify(args)}`;
          console.log(`[api/chat:${requestId}] ${paramLog}`);
          currentLogs.push(paramLog);

          let result = { success: true, message: 'Tool executed successfully.' };

          try {
            if (fnName === 'log_mood') {
              await logMoodFromAI(args as any);
              result = { success: true, message: '心情已记录。' };
              needsRefresh = true; // 标记需要刷新页面
            } else if (fnName === 'track_period') {
              await trackPeriodFromAI(args as any);
              result = { success: true, message: '经期已记录。' };
              needsRefresh = true; // 标记需要刷新页面
            } else if (fnName === 'save_memory') {
              const content = (args as any).content;
              if (content) {
                const now = new Date();
                const memoryId = `chat-${now.getTime()}-${Math.random().toString(36).slice(2)}`;
                const memory: MemoryRecord = {
                  id: memoryId,
                  text: `聊天提醒：${content}`,
                  metadata: {
                    type: 'note',
                    author: 'piggy',
                    datetime: now.toISOString(),
                    sourceId: memoryId,
                  },
                };
                await addMemories([memory]);
                result = { success: true, message: '记忆已保存。' };
              } else {
                result = { success: false, message: 'Content is required.' };
              }
            } else if (fnName === 'show_sticker') {
              const category = (args as any).category;
              result = { 
                success: true, 
                message: `Sticker [${category}] displayed. Please mention it in your response and append [STICKER:${category}] at the end.` 
              };
            } else if (fnName === 'get_weather') {
              const city = (args as any).city || '北京'; // 默认城市
              try {
                const weatherInfo = await getWeatherInfo(city);
                const isSuccess = !weatherInfo.includes('抱歉') && !weatherInfo.includes('不可用') && !weatherInfo.includes('失败');
                result = { 
                  success: isSuccess, 
                  message: weatherInfo 
                };
                // 记录天气查询日志
                const weatherLog = `天气查询 [${city}]: ${isSuccess ? '成功' : '失败'}`;
                console.log(`[api/chat:${requestId}] ${weatherLog}`);
                currentLogs.push(weatherLog);
                if (!isSuccess) {
                  // 如果查询失败，记录详细错误信息（但只记录简短版本，避免日志过长）
                  const shortError = weatherInfo.length > 50 ? weatherInfo.substring(0, 50) + '...' : weatherInfo;
                  currentLogs.push(`  错误: ${shortError}`);
                }
              } catch (error: any) {
                const errorMsg = error?.message || String(error);
                console.error(`[api/chat:${requestId}] 天气查询异常:`, errorMsg);
                result = { 
                  success: false, 
                  message: `天气查询失败: ${errorMsg}` 
                };
                currentLogs.push(`天气查询 [${city}]: 异常 - ${errorMsg}`);
              }
            } else {
              result = { success: false, message: 'Unknown tool.' };
            }
          } catch (err: any) {
            const errorMessage = err?.message || String(err);
            console.error(`[api/chat:${requestId}] ✗ 工具执行失败 [${fnName}]:`, errorMessage);
            result = { success: false, message: `Error: ${errorMessage}` };
          }

          // 将工具执行结果追加到消息历史
          llmMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
            name: fnName,
          } as any);
        }
      }
    }

    if (loopCount >= MAX_LOOPS) {
      console.warn(`[api/chat:${requestId}] ⚠️ 达到最大循环次数 (${MAX_LOOPS})，强制结束`);
    }

    // 4. 返回最终响应
    // 无论前端是否请求 stream，我们都模拟流式返回（因为我们已经拿到了完整的 finalReply）
    // 这样前端代码不需要修改
    if (body?.stream) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        start(controller) {
          // 先发送日志信息（前端会解析并输出到浏览器控制台，但不显示在消息中）
          currentLogs.forEach(log => {
            controller.enqueue(encoder.encode(`[LOG]${log}[END_LOG]`));
          });
          if (needsRefresh) {
            controller.enqueue(encoder.encode(`[LOG]数据库已更新，需要刷新页面[END_LOG]`));
          }
          
          // 将完整回复一次性作为一个 chunk 发送
          // 虽然不是真正的流式（逐字），但兼容前端的 reader 逻辑
          controller.enqueue(encoder.encode(finalReply));
          // 如果需要刷新，在流末尾添加特殊标记
          if (needsRefresh) {
            controller.enqueue(encoder.encode('\n\n[REFRESH_PAGE]'));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          ...(needsRefresh ? { 'X-Refresh-Page': 'true' } : {}),
        },
      });
    }

    // 非流式回退
    return NextResponse.json({
      reply: finalReply,
      systemPrompt: getSystemPrompt(),
    });

  } catch (error) {
    console.error(`[api/chat:${requestId}] 请求失败:`, error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}

