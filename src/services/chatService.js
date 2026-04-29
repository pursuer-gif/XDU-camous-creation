// 千帆聊天服务：统一封装西小电问答调用，影响范围仅限 /api/chat 接口链路。
const { fetch, ProxyAgent } = require('undici');

const { AppError } = require('../middleware/errorHandler');

const REQUEST_TIMEOUT_MS = Number(process.env.QIANFAN_CHAT_TIMEOUT_MS) || 25000;
const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRYABLE_HTTP_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const XIAODIAN_SYSTEM_PROMPT = `
你是“西小电”，服务于西安电子科技大学元素图谱页面的校园智能助理。
你的回答目标：
1. 优先回答和西电校园文化、校史脉络、电子信息学科气质、视觉元素提炼、展陈表达、页面内容组织相关的问题。
2. 语气要亲切、简洁，像校园里的智能讲解员，避免官腔。
3. 你可以帮助用户把“半部电台起家、银杏大道、图书馆、通信天线、集成电路、厚德求真”等元素转成设计语言。
4. 涉及学校事实时，只陈述高置信信息；不确定时明确说“我建议再核对官方资料”。
5. 不要自称官方授权吉祥物，可将自己描述为“以西电科技气质为灵感的校园智能助理形象”。
你已经知道的稳定背景：
- 西安电子科技大学以电子与信息学科见长。
- 学校前身可追溯到 1931 年诞生于江西瑞金的中央军委无线电学校。
- 学校 1958 年迁址西安，1988 年定名为“西安电子科技大学”。
- 典型校园元素包括半部电台起家、银杏大道、图书馆、通信与信号、电路与网格结构。
输出要求：
- 默认使用中文。
- 回答尽量 2 到 5 段，必要时给出 3 条以内建议。
- 如果用户问设计落地，优先给“元素含义 + 可视化方式 + 页面放置建议”。
`.trim();

function getQianfanConfig() {
  // 默认优先走吞吐更高的 4.5 turbo，x1 留作后备，降低校园问答场景的偶发回落概率。
  const primaryModel = process.env.QIANFAN_MODEL || 'ernie-4.5-turbo-32k';
  const fallbackModel = process.env.QIANFAN_FALLBACK_MODEL || 'ernie-x1-turbo-32k';

  return {
    apiKey: process.env.QIANFAN_API_KEY || process.env.LLM_API_KEY || '',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    modelCandidates: [primaryModel, fallbackModel].filter((item, index, list) => item && list.indexOf(item) === index),
    appId: process.env.QIANFAN_APP_ID || '',
    proxyUrl: ''
  };
}

// 消息清洗负责控制长度与角色范围，避免前端透传异常数据影响模型调用。
function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    throw new AppError('聊天消息不能为空', 400);
  }

  const allowedRoles = new Set(['user', 'assistant']);
  const sanitized = messages
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: typeof item.role === 'string' ? item.role.trim() : '',
      content: typeof item.content === 'string' ? item.content.trim() : ''
    }))
    .filter((item) => allowedRoles.has(item.role) && item.content);

  if (!sanitized.length) {
    throw new AppError('聊天消息格式不正确', 400);
  }

  const limitedMessages = sanitized.slice(-12).map((item) => ({
    ...item,
    content: item.content.slice(0, 2000)
  }));

  const lastMessage = limitedMessages[limitedMessages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new AppError('最后一条消息必须由用户发起', 400);
  }

  return limitedMessages;
}

// 千帆不可达时提供本地兜底回复，保证元素图谱页仍可完成基础讲解与导览。
function buildOfflineReply(question) {
  const normalized = (question || '').trim();

  if (!normalized) {
    return '我现在先用本地讲解模式陪你看元素图谱。你可以继续问我校史线索、元素含义，或者页面里应该怎么放这些内容。';
  }

  if (normalized.includes('半部电台') || normalized.includes('电台起家')) {
    return [
      '“半部电台起家”最适合承担西电识别度最高的精神母题。',
      '做视觉时可以把它转成电波轨迹、刻度盘、旧式通信设备轮廓，重点不是复刻器材，而是把“通信报国、技术起家”的气质做出来。',
      '如果放在元素图谱页，建议用在第一屏或校史时间线附近，作为整页叙事的起点。'
    ].join('\n');
  }

  if (normalized.includes('银杏')) {
    return [
      '银杏大道代表的是西电校园里的季节感、青春感和归属感。',
      '它适合和偏冷的电子信息视觉形成对比，让页面不只硬核，也更有校园记忆。',
      '页面上可以把它放在资料卡、背景纹样或第二屏情绪过渡区。'
    ].join('\n');
  }

  if (normalized.includes('图谱') || normalized.includes('页面') || normalized.includes('放在哪')) {
    return [
      '元素图谱页最适合的结构是“校史起点 -> 元素卡片 -> 转译路径 -> 问答入口”。',
      '西小电入口建议固定在右下角，保持随时可问，但不要抢第一屏主标题。',
      '如果你想更自然一点，可以在图谱首屏右侧说明卡里再放一个“打开西小电问答”的次按钮。'
    ].join('\n');
  }

  return [
    '我现在处于本地讲解模式，可以继续帮你解释元素图谱。',
    '如果你问的是校史、元素含义、视觉转译或页面布局，我都可以先给你一个可落地的方向。',
    `你刚才这句“${normalized}”如果要落到页面里，我建议先拆成“它代表什么 + 可以画成什么 + 放在页面哪里”这三步。`
  ].join('\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryStatus(status) {
  return RETRYABLE_HTTP_STATUS.has(status);
}

function buildFetchOptions(proxyUrl) {
  if (!proxyUrl) {
    return {};
  }

  return {
    dispatcher: new ProxyAgent(proxyUrl)
  };
}

// 单次千帆调用负责处理超时、状态码与回复提取，供上层做重试与模型回退。
async function requestQianfanChat({ apiKey, appId, baseUrl, model, messages, proxyUrl }) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };

  if (appId) {
    headers.appid = appId;
  }

  let response;
  let completion = null;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: XIAODIAN_SYSTEM_PROMPT }, ...messages]
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...buildFetchOptions(proxyUrl)
    });
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      reason: `qianfan_unreachable:${error.message || 'unknown'}`,
      status: 0
    };
  }

  try {
    completion = await response.json();
  } catch (error) {
    return {
      ok: false,
      retryable: shouldRetryStatus(response.status),
      reason: `qianfan_invalid_json:${response.status}`,
      status: response.status
    };
  }

  if (!response.ok) {
    const providerReason = completion?.error?.code || completion?.error?.message || completion?.message || `http_${response.status}`;
    return {
      ok: false,
      retryable: shouldRetryStatus(response.status),
      reason: `qianfan_http_${response.status}:${providerReason}`,
      status: response.status
    };
  }

  const reply = completion?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return {
      ok: false,
      retryable: true,
      reason: 'qianfan_empty_reply',
      status: response.status
    };
  }

  return {
    ok: true,
    reply,
    model: completion.model || model
  };
}

async function createCampusChatReply(messages) {
  const sanitizedMessages = sanitizeMessages(messages);
  const { apiKey, baseUrl, modelCandidates, appId, proxyUrl } = getQianfanConfig();
  const latestQuestion = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';

  const buildFallbackResult = (reason) => ({
    reply: buildOfflineReply(latestQuestion),
    meta: {
      model: 'offline-fallback',
      createdAt: new Date().toISOString(),
      reason
    }
  });

  if (!apiKey) {
    return buildFallbackResult('missing_qianfan_api_key');
  }

  const failureReasons = [];

  // 先做同模型重试，再在需要时切到备用模型，尽量把偶发网络抖动拦在后端。
  for (const model of modelCandidates) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      const result = await requestQianfanChat({
        apiKey,
        appId,
        baseUrl,
        model,
        messages: sanitizedMessages,
        proxyUrl
      });

      if (result.ok) {
        return {
          reply: result.reply,
          meta: {
            model: result.model,
            createdAt: new Date().toISOString()
          }
        };
      }

      failureReasons.push(`${model}#${attempt}:${result.reason}`);

      if (!result.retryable) {
        break;
      }

      if (attempt < MAX_ATTEMPTS_PER_MODEL) {
        await sleep(600 * attempt);
      }
    }
  }

  return buildFallbackResult(failureReasons.join(' | ').slice(0, 500));
}

module.exports = {
  createCampusChatReply
};
