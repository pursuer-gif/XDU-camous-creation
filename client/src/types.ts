// 统一前端数据结构，影响范围仅限接口请求、结果映射与页面展示。
export type StyleType =
  | '科技感'
  | '青春活力'
  | '纪念收藏'
  | '极简未来'
  | '国潮纪念'
  | '插画叙事'
  | '潮流街头'
  | '温暖治愈';

// 统一产品类型枚举，确保表单选择与接口字段保持一致。
export type ProductType = '海报' | '徽章' | '帆布袋' | '明信片' | 'IP形象';

export interface ColorToken {
  name: string;
  hex: string;
}

export interface PreviewPrompt {
  key: string;
  label: string;
  description: string;
  prompt: string;
}

export interface GeneratedPreview extends PreviewPrompt {
  enabled: boolean;
  imageUrl: string;
  reason: string;
}

// 西小电聊天消息结构独立建模，影响范围仅限前端聊天面板与接口传输。
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatApiResult {
  reply: string;
  meta?: {
    model?: string;
    createdAt?: string;
  };
}

// 文化约束信息用于把 AI 生成逻辑前置展示，影响范围仅限前端说明面板。
export interface CultureConstraintSummary {
  schoolIdentity: string[];
  schoolSpirit: string[];
  selectedElements: string[];
  designPrinciples: string[];
}

// 页面内部统一结果结构，便于当前方案、历史记录与精选库复用。
export interface GenerationResult {
  title: string;
  slogan: string;
  concept: string;
  elements: string[];
  colors: ColorToken[];
  scenarios: string[];
  designDescription?: string;
  ipImagePrompt?: string;
  posterPrompt?: string;
  previewPrompts?: PreviewPrompt[];
  generatedPreviews?: GeneratedPreview[];
  style?: StyleType;
  productType?: ProductType;
  createdAt?: string;
  generatedImageUrl?: string;
  generatedImageEnabled?: boolean;
  promptPreview?: string;
  cultureConstraints?: CultureConstraintSummary;
  generationMode?: string;
  recordId?: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  error?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface GenerateApiPayload {
  theme: string;
  style: StyleType;
  productType: ProductType;
  campusElements: string[];
}

export interface GenerateApiResult {
  title: string;
  slogan: string;
  concept: string;
  visualElements: string[];
  colors: ColorToken[];
  applicationScenes: string[];
  designDescription: string;
  ipImagePrompt: string;
  posterPrompt: string;
  previewPrompts?: PreviewPrompt[];
  generatedPreviews?: GeneratedPreview[];
  promptPreview?: string;
  cultureConstraints?: CultureConstraintSummary;
  generatedImage?: {
    enabled: boolean;
    imageUrl: string;
    reason: string;
  };
  meta?: {
    recordId: string;
    generationMode: string;
    createdAt: string;
  };
}

export interface HistoryRecord {
  id: string;
  createdAt: string;
  mode: string;
  input: GenerateApiPayload;
  output: GenerateApiResult;
}

export interface FeaturedWorkRecord {
  id: string;
  createdAt: string;
  title: string;
  slogan: string;
  concept: string;
  elements: string[];
  colors: ColorToken[];
  scenarios: string[];
  designDescription?: string;
  style?: StyleType;
  productType?: ProductType;
  generatedImageUrl?: string;
  generatedImageEnabled?: boolean;
}
