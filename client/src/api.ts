import type {
  ApiResponse,
  ChatApiResult,
  ChatMessage,
  FeaturedWorkRecord,
  GenerateApiPayload,
  GenerateApiResult,
  HistoryRecord
} from './types';

// 默认改成同源 /api，配合本地静态服务反向代理，减少浏览器跨端口请求失败。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 统一封装请求逻辑，影响范围仅限前端访问后端 API。
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message || '请求失败');
  }

  return json.data;
}

export function generatePlan(payload: GenerateApiPayload) {
  return request<GenerateApiResult>('/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchHistory() {
  return request<HistoryRecord[]>('/history');
}

export function fetchFeaturedWorks() {
  return request<FeaturedWorkRecord[]>('/featured');
}

export function saveFeaturedWork(payload: Omit<FeaturedWorkRecord, 'id' | 'createdAt'>) {
  return request<FeaturedWorkRecord>('/featured', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 西小电问答接口沿用现有请求封装，影响范围仅限元素图谱页聊天功能。
export function chatWithXiaodian(messages: ChatMessage[]) {
  return request<ChatApiResult>('/chat', {
    method: 'POST',
    body: JSON.stringify({ messages })
  });
}
