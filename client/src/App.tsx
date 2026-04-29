import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChevronRight,
  Cpu,
  History,
  Image as ImageIcon,
  Layers,
  Loader2,
  MessageCircle,
  Palette,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
  X
} from 'lucide-react';

import { chatWithXiaodian, fetchFeaturedWorks, fetchHistory, generatePlan, saveFeaturedWork } from './api';
import type {
  ChatMessage,
  FeaturedWorkRecord,
  GeneratedPreview,
  GenerateApiResult,
  GenerationResult,
  HistoryRecord,
  PreviewPrompt,
  ProductType,
  StyleType
} from './types';

type PreviewItem = PreviewPrompt | GeneratedPreview;
type ViewMode = 'home' | 'workspace' | 'atlas';

// 页面静态选项只服务当前前端展示层，影响范围限于首页与工作台交互。
const XDU_ELEMENTS = ['半部电台起家', '银杏大道', '西电图书馆', '通信天线', '集成电路', '厚德求真'];
const STYLES: StyleType[] = ['科技感', '青春活力', '纪念收藏', '极简未来', '国潮纪念', '插画叙事', '潮流街头', '温暖治愈'];
const PRODUCTS: ProductType[] = ['海报', '徽章', '帆布袋', '明信片', 'IP形象'];

// 校史谱线继续作为“西电独有性”的时间母题，影响范围仅限元素图谱页。
const MELODY_LINES = [
  {
    year: '1931',
    title: '瑞金建校',
    description:
      '学校前身中央革命军事委员会无线电学校诞生于江西瑞金，成为我党我军第一所工程技术学校，也是“半部电台起家”这条精神线索的源头。',
    note: '红色根脉的起点'
  },
  {
    year: '1958',
    title: '迁址西安',
    description:
      '学校由瑞金、延安、获鹿、张家口等地一路办学后迁址西安，西电与城市、国防工业和西部科技版图的关系从这里真正建立起来。',
    note: '扎根西安的重要转折'
  },
  {
    year: '1960',
    title: '“西军电”时期',
    description:
      '学校更名为中国人民解放军军事电信工程学院，“西军电”成为几代人最熟悉的称呼，也强化了通信、电子、雷达等学科的硬核气质。',
    note: '学科辨识度快速形成'
  },
  {
    year: '1966',
    title: '转为地方建制',
    description:
      '学校转为地方建制，更名为西北电讯工程学院，办学重心进一步从军队体系走向面向国家产业与社会发展的电子信息人才培养。',
    note: '从军工底色走向广域服务'
  },
  {
    year: '1988',
    title: '定名西安电子科技大学',
    description:
      '学校正式定名为“西安电子科技大学”，西电的当代品牌由此稳定下来，电子与信息特色也在这一名称中被清晰确立。',
    note: '现代校名正式确立'
  },
  {
    year: '1998 - 2022',
    title: '迈向一流建设',
    description:
      '1998年进入“211工程”，2000年划转教育部直属管理，2017年与2022年连续两轮入选国家“双一流”建设高校名单，学校发展进入新的综合提升阶段。',
    note: '从重点大学走向双一流'
  }
];

// 元素资料卡负责把西电符号解释成可复用的品牌组件，影响范围仅限图谱页。
const ELEMENT_ATLAS = [
  {
    title: '半部电台起家',
    tag: '精神源点',
    summary: '对应西电最核心的校史记忆，代表通信报国、技术救国与艰苦创业的起点。',
    detail: '适合转译为电波、刻度、旧式设备轮廓、信号轨迹等视觉语言，用来承接产品的叙事开场。'
  },
  {
    title: '银杏大道',
    tag: '校园记忆',
    summary: '最容易被感知到季节感、青春感与归属感的校园场景，天然带有温度。',
    detail: '适合与冷色科技元素形成对比，用作海报背景、纪念物料纹样或场景叙事的情绪层。'
  },
  {
    title: '集成电路',
    tag: '学科语言',
    summary: '西电电子与信息特色最稳定的一种结构隐喻，适合承担画面的秩序感。',
    detail: '不必直接画成芯片，可以抽象为线路、网格、节点和界面骨架，让产品更像“西电”而不是泛科技。'
  },
  {
    title: '通信天线',
    tag: '信号意象',
    summary: '象征连接、发送、接收与远距离传播，是“看不见的通信”最容易视觉化的元素。',
    detail: '适合与波束、流线、轨迹线组合，形成统一母题里的“信号源”和“传播感”。'
  },
  {
    title: '厚德求真',
    tag: '价值内核',
    summary: '比起装饰性口号，它更适合作为整套产品文案与叙事节奏的稳定轴心。',
    detail: '可拆解成短句节奏、章节标题或页面导语，让表达更克制，也更有学校精神辨识度。'
  },
  {
    title: '西电图书馆',
    tag: '知识场景',
    summary: '代表知识沉淀、校史延续与校园空间秩序，是非常适合作为稳定背景的对象。',
    detail: '适合与书页、目录、检索、灯光等细节结合，转成资料卡、知识页与内容导览页的基底。'
  }
];

// 转译路径专门说明统一母题如何落到物料，影响范围仅限图谱页。
const CULTURE_PATHS = [
  { label: '先压缩成校史母题', desc: '从“半部电台起家”到当代西电，把时间线收成统一叙事骨架。' },
  { label: '再翻译成品牌图形', desc: '把电波、刻度、线路、叶脉与建筑轮廓变成一套稳定视觉语汇。' },
  { label: '再叠加校园温度', desc: '用银杏大道、图书馆和校园日常，让表达不只硬核，也有记忆点。' },
  { label: '最后延展到交付物', desc: '让主图、说明、亮点、展板与答辩页都共用同一条母题。' }
];

// 品牌母题卡用于强化首页记忆点，影响范围仅限首页品牌说明区。
const BRAND_SIGNAL_SYSTEM = [
  {
    title: '红色通信源点',
    eyebrow: 'Spirit Kernel',
    description: '从“半部电台起家”提取信号源、刻度感与工程纪律，把西电的独有起点变成视觉开场。'
  },
  {
    title: '银杏信号层',
    eyebrow: 'Campus Warmth',
    description: '让银杏叶脉与步道透视进入冷色科技结构，形成只有西电校园记忆才能撑起的温度层。'
  },
  {
    title: '电路秩序骨架',
    eyebrow: 'Discipline Grid',
    description: '用集成电路、通信天线和信息网格承担版式秩序，让画面从“泛科技”变成“电子信息高校”。'
  },
  {
    title: '建筑识别锚点',
    eyebrow: 'XDU Landmark',
    description: '用图书馆与校园建筑剪影做最终落点，让整套方案在第一眼就能挂回西电本体。'
  }
];

// AI 能力链路直接回应“AI 是成立关键能力”，影响范围仅限首页与工作台说明区。
const AI_ENGINE_STEPS = [
  {
    title: '先把约束喂进去',
    description: '主题、风格、载体、西电元素和工艺边界先被结构化，AI 不是直接出图，而是先理解任务。'
  },
  {
    title: '再把文化骨架拼起来',
    description: '校史、学科、品牌与竞赛要求被压进同一条提示链路，保证结果不只是好看，而是有出处。'
  },
  {
    title: '主图和方向一起生成',
    description: '系统不只给一张图，还会给多方向预览，帮助快速比较主视觉、叙事版和系统版。'
  },
  {
    title: '最后沉淀成答辩资产',
    description: '生成结果进入历史与画廊，网页本身就开始变成展示板、说明板和方案库。'
  }
];

// 交付物模板专门补齐比赛闭环，影响范围仅限首页与工作台的交付板块。
const DELIVERY_TEMPLATES = [
  {
    title: '主视觉',
    badge: '先看结果',
    description: '先把最完整的一张主图放出来，方便快速判断整体感觉。'
  },
  {
    title: '设计说明',
    badge: '说明清楚',
    description: '把当前方案为什么这样做，用更容易理解的话讲清楚。'
  },
  {
    title: '核心亮点',
    badge: '快速提炼',
    description: '把最值得保留的三到四个点单独列出来，方便继续挑选。'
  },
  {
    title: '内容延展',
    badge: '继续展开',
    description: '可以顺着当前结果继续扩展成介绍页、说明页或更多展示内容。'
  },
  {
    title: '生成过程',
    badge: '方便回看',
    description: '把当前生成方式和过程保留下来，后面继续修改会更顺。'
  }
];

const INITIAL_RESULT: GenerationResult = {
  title: '电波归来，银杏成像',
  slogan: '把西电的红色根脉、电子信息气质与校园日常整理成一套可持续延展的内容表达。',
  concept:
    '方案围绕“半部电台起家”的历史线索与“银杏大道”的校园记忆展开，用电波轨迹、线路骨架和建筑轮廓形成统一视觉母题，让西电独有性贯穿主图、说明与延展物料。',
  elements: ['电波轨迹', '银杏叶脉', '集成电路线框', '西电建筑剪影'],
  colors: [
    { name: '西电蓝', hex: '#123C8D' },
    { name: '信号青', hex: '#2BC7D9' },
    { name: '银杏金', hex: '#D7A73D' }
  ],
  scenarios: ['主题海报', '资料卡页', '纪念物料延展'],
  designDescription:
    '建议先建立一张主视觉，再向明信片、徽章和说明页延展，让电波语言和银杏校园记忆在不同内容里保持一致。',
  posterPrompt:
    '为西安电子科技大学设计一套兼具红色通信精神与校园记忆的主视觉，突出电波轨迹、银杏大道、线路骨架与建筑剪影。',
  previewPrompts: [
    {
      key: 'hero',
      label: '主视觉方向',
      description: '更适合作为首页主图与核心海报的方向。',
      prompt: '围绕西电红色根脉与通信精神生成一张完整主视觉海报，兼具历史感、科技感与校园温度。'
    },
    {
      key: 'memory',
      label: '校园记忆方向',
      description: '更适合往明信片、资料页和纪念物料延展。',
      prompt: '围绕西电银杏大道、图书馆与日常校园空间生成更有温度的视觉表达。'
    },
    {
      key: 'system',
      label: '品牌系统方向',
      description: '更适合做说明页、系列页面和统一版式系统。',
      prompt: '围绕西电信号母题生成更强调网格、线路、建筑剪影与标题系统的品牌化版面。'
    }
  ],
  style: '科技感',
  productType: '海报',
  generatedImageUrl: '/xdu-showcase/badge-hero.png',
  generatedImageEnabled: true,
  promptPreview:
    '项目名称：XDU CampusMind；主题：西电红色通信精神与银杏校园记忆；核心要求：将半部电台起家、电子信息学科和银杏校园温度整理成统一表达；输出：主视觉、设计说明、亮点与说明页面。',
  cultureConstraints: {
    schoolIdentity: ['电子信息', '通信报国', '科技创新'],
    schoolSpirit: ['红色基因', '工程实践', '青年奋进'],
    selectedElements: ['半部电台起家', '银杏大道', '集成电路'],
    designPrinciples: ['必须像西电，而不是泛校园', '必须同时支持主图与内容延展', '必须兼顾真实物料与日常展示']
  },
  generationMode: 'demo',
  recordId: 'seed-demo'
};

// 首屏与画廊复用示意成品图，影响范围仅限前端展示层。
const CURATED_WORKS: GenerationResult[] = [
  {
    ...INITIAL_RESULT,
    title: '电波之徽',
    slogan: '以通信塔、电波同心圆、校园建筑与银杏语言组成的核心纪念徽章。',
    productType: '徽章',
    generatedImageUrl: '/xdu-showcase/badge-hero.png'
  },
  {
    ...INITIAL_RESULT,
    title: '星空电波',
    slogan: '单张明信片主卡，将通信精神、校园建筑与银杏记忆组织成更完整的产品画面。',
    productType: '明信片',
    generatedImageUrl: '/xdu-showcase/postcard-hero.png'
  },
  {
    ...INITIAL_RESULT,
    title: '电波校园明信片系列',
    slogan: '以一张主卡带动系列延展，把校史、银杏大道、图书馆与建筑线索放进同一组明信片语言里。',
    productType: '明信片',
    generatedImageUrl: '/xdu-showcase/postcard-series.png'
  }
];

// 西小电预设开场与快捷提问用于降低首次使用门槛，影响范围仅限元素图谱聊天入口。
const XIAODIAN_WELCOME_MESSAGE =
  '你好，我是西小电。你可以问我西电元素怎么转成设计语言，也可以让我帮你梳理校史、校园意象和页面表达。';
const XIAODIAN_QUICK_QUESTIONS = [
  '半部电台起家适合怎么做成视觉元素？',
  '帮我解释银杏大道为什么适合放进元素图谱。',
  '如果做首页入口，西小电应该放在哪个位置更自然？'
];
const XIAODIAN_BUILD_TAG = '2026-04-23-chat-fix';

// 前端本地兜底回复用于彻底消除“点了却不能聊”的断点体验。
const buildClientFallbackReply = (question: string) => {
  const normalized = question.trim();

  if (normalized.includes('半部电台') || normalized.includes('电台起家')) {
    return '我先用本地模式回答你：半部电台起家最适合转成电波轨迹、刻度盘和旧式通信设备轮廓，建议放在元素图谱首屏或校史时间线附近，承担整页叙事起点。';
  }

  if (normalized.includes('银杏')) {
    return '我先用本地模式回答你：银杏大道适合承担校园温度层，可以放在资料卡背景、情绪过渡区或页面纹样里，和冷色科技结构形成对比。';
  }

  return `我先用本地模式陪你继续聊：你这句“${normalized || '这个问题'}”可以先拆成“它代表什么、可以画成什么、适合放在哪”。你继续问，我会按这个结构帮你往下理。`;
};

// 聊天请求失败时先短暂重试一次，减少浏览器偶发网络抖动对体验的影响。
const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'));
const buildItemKey = (item: GenerationResult, index: number) => `${item.title}-${item.createdAt || index}`;
const getModeLabel = (mode?: string) => {
  if (mode === 'llm') return 'LLM 生成';
  if (mode === 'rule') return '规则生成';
  if (mode === 'demo') return '演示底稿';
  return '生成链路';
};
const truncateText = (value?: string, maxLength = 220) => {
  if (!value) return '生成后这里会显示当前方案的提示词骨架，用来证明 AI 不是附属工具，而是这套方案的压缩引擎。';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

// 方向项可能来自纯提示词或带图片的生成结果，这里统一做前端判断。
const isGeneratedPreview = (item: PreviewItem | null | undefined): item is GeneratedPreview => Boolean(item && 'imageUrl' in item);

// 页面展示时把偏比赛/答辩口径的词替换成普通用户更容易理解的说法。
const toUserFacingText = (value?: string) => {
  if (!value) return value || '';

  return value
    .replace(/参赛交付闭环/g, '内容整理')
    .replace(/比赛不会只看一个网页/g, '除了当前页面，还可以继续整理更多内容')
    .replace(/比赛展示需求/g, '展示需求')
    .replace(/比赛展示效果/g, '展示效果')
    .replace(/比赛答辩/g, '内容展示')
    .replace(/答辩页/g, '说明页')
    .replace(/答辩表达/g, '内容说明')
    .replace(/答辩资产/g, '展示内容')
    .replace(/展示板/g, '说明页')
    .replace(/展板/g, '页面')
    .replace(/评委会第一眼会看到的内容/g, '使用者第一眼会看到的内容')
    .replace(/评委/g, '使用者')
    .replace(/视频脚本/g, '过程记录');
};

// 接口结果继续统一映射到页面模型，影响范围仅限前端渲染与说明面板。
const mapGenerateResult = (apiResult: GenerateApiResult, style: StyleType, productType: ProductType): GenerationResult => ({
  title: apiResult.title,
  slogan: apiResult.slogan,
  concept: apiResult.concept,
  elements: apiResult.visualElements,
  colors: apiResult.colors,
  scenarios: apiResult.applicationScenes,
  designDescription: apiResult.designDescription,
  ipImagePrompt: apiResult.ipImagePrompt,
  posterPrompt: apiResult.posterPrompt,
  previewPrompts: apiResult.previewPrompts,
  generatedPreviews: apiResult.generatedPreviews,
  style,
  productType,
  createdAt: apiResult.meta?.createdAt,
  generatedImageUrl: apiResult.generatedImage?.imageUrl || '',
  generatedImageEnabled: apiResult.generatedImage?.enabled || false,
  promptPreview: apiResult.promptPreview,
  cultureConstraints: apiResult.cultureConstraints,
  generationMode: apiResult.meta?.generationMode,
  recordId: apiResult.meta?.recordId
});

// 历史记录映射补齐 AI 说明字段，影响范围仅限历史回看与答辩追溯。
const mapHistoryRecord = (record: HistoryRecord): GenerationResult => ({
  title: record.output.title,
  slogan: record.output.slogan,
  concept: record.output.concept,
  elements: record.output.visualElements,
  colors: record.output.colors,
  scenarios: record.output.applicationScenes,
  designDescription: record.output.designDescription,
  ipImagePrompt: record.output.ipImagePrompt,
  posterPrompt: record.output.posterPrompt,
  previewPrompts: record.output.previewPrompts,
  generatedPreviews: record.output.generatedPreviews,
  style: record.input.style,
  productType: record.input.productType,
  createdAt: record.createdAt,
  generatedImageUrl: record.output.generatedImage?.imageUrl || '',
  generatedImageEnabled: record.output.generatedImage?.enabled || false,
  promptPreview: record.output.promptPreview,
  cultureConstraints: record.output.cultureConstraints,
  generationMode: record.mode,
  recordId: record.id
});

// 精选作品只保留展示所需字段，影响范围仅限首页画廊。
const mapFeaturedRecord = (record: FeaturedWorkRecord): GenerationResult => ({
  title: record.title,
  slogan: record.slogan,
  concept: record.concept,
  elements: record.elements,
  colors: record.colors,
  scenarios: record.scenarios,
  designDescription: record.designDescription,
  style: record.style,
  productType: record.productType,
  createdAt: record.createdAt,
  generatedImageUrl: record.generatedImageUrl || '',
  generatedImageEnabled: record.generatedImageEnabled || false
});

function SectionTitle({
  eyebrow,
  title,
  desc
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="spec-label">{eyebrow}</p>
      <h2 className="display-title text-3xl font-bold text-white md:text-4xl">{title}</h2>
      {desc ? <p className="max-w-3xl text-sm leading-7 text-slate-300">{desc}</p> : null}
    </div>
  );
}

function SummaryCards({ items }: { items: Array<{ title: string; content: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="glass-panel signal-card rounded-[1.75rem] p-5">
          <p className="spec-label">{item.title}</p>
          <p className="mt-4 text-base leading-7 text-slate-100">{item.content}</p>
        </div>
      ))}
    </div>
  );
}

function ResultPreview({
  result,
  preview,
  tag
}: {
  result: GenerationResult | null;
  preview?: PreviewItem | null;
  tag?: string;
}) {
  // 当前预览优先展示选中的方向图，其次再退回主图，避免多方向预览只剩文字切换。
  const currentImageUrl = isGeneratedPreview(preview) && preview.imageUrl ? preview.imageUrl : result?.generatedImageUrl;
  const currentLabel = preview?.label || tag || '当前预览';
  const currentDesc = preview?.description || result?.slogan || '';
  const currentTitle = result?.title || '当前方案';
  const currentProductType = result?.productType || '海报';

  if (!currentImageUrl) {
    return (
      <div className="signal-frame flex min-h-[440px] flex-col items-center justify-center p-8 text-center">
        <div className="signal-orbit signal-orbit--one" />
        <div className="signal-orbit signal-orbit--two" />
        <ImageIcon size={44} className="text-slate-500" />
        <p className="mt-5 text-lg font-semibold text-white">当前还没有真实预览图</p>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">生成后如果后端开启生图能力，这里会显示当前方案对应的图像预览。</p>
      </div>
    );
  }

  return (
    <div className="signal-frame min-h-[440px]">
      <div className="signal-orbit signal-orbit--one" />
      <div className="signal-orbit signal-orbit--two" />
      <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
        <div className="signal-chip">{currentLabel}</div>
        <div className="signal-chip">{currentProductType}</div>
      </div>
      <img src={currentImageUrl} alt={currentTitle} className="h-[440px] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,transparent_0%,rgba(4,10,20,0.92)_100%)] p-6">
        <p className="text-xl font-bold text-white">{currentTitle}</p>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">{currentDesc}</p>
      </div>
    </div>
  );
}

function DeliveryBoard({
  result,
  activePreview,
  theme,
  selectedStyle,
  selectedProduct
}: {
  result: GenerationResult | null;
  activePreview: PreviewItem | null;
  theme: string;
  selectedStyle: StyleType;
  selectedProduct: ProductType;
}) {
  // 内容看板用于把当前结果往下展开，影响范围仅限展示层。
  const deliveryItems = [
    {
      ...DELIVERY_TEMPLATES[0],
      content: result?.title ? `${result.title} / ${activePreview?.label || '主视觉方向'}` : '等待生成结果'
    },
    {
      ...DELIVERY_TEMPLATES[1],
      content: result?.designDescription || '生成后这里会自动带出设计说明。'
    },
    {
      ...DELIVERY_TEMPLATES[2],
      content: result?.elements.slice(0, 3).join(' / ') || '等待提炼亮点'
    },
    {
      ...DELIVERY_TEMPLATES[3],
      content: `围绕“${theme || '当前主题'}”继续整理说明、场景和产品延展。`
    },
    {
      ...DELIVERY_TEMPLATES[4],
      content: `${getModeLabel(result?.generationMode)} + ${selectedStyle} + ${selectedProduct} 的生成过程可直接回放。`
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <SectionTitle
        eyebrow="继续完善"
        title="当前结果还能继续往下展开"
        desc="除了直接看主图，你也可以顺着这套结果继续整理说明、亮点、页面内容和生成过程。"
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {deliveryItems.map((item) => (
          <div key={item.title} className="glass-panel signal-card rounded-[1.75rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="spec-label">{item.title}</p>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">{item.badge}</div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-100">{item.content}</p>
            <p className="mt-4 text-xs leading-6 text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ElementAtlasPage({
  onOpenWorkspace,
  onOpenChat
}: {
  onOpenWorkspace: () => void;
  onOpenChat: () => void;
}) {
  return (
    <>
      <section id="atlas-hero" className="px-6 pb-8 pt-28">
        <div className="glass-panel mx-auto max-w-7xl rounded-[2rem] p-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-semibold text-sky-200">
                <Sparkles size={14} />
                西电元素图谱
              </div>
              <div>
                <p className="spec-label">元素来源</p>
                <h1 className="display-title mt-4 text-4xl font-black leading-tight text-white md:text-6xl">
                  西电元素图谱
                  <span className="block bg-gradient-to-r from-sky-300 via-white to-amber-300 bg-clip-text text-transparent">
                    从校史到画面线索
                  </span>
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                  这页把西电的校史、校园记忆和学科特征拆开整理，方便你更快理解每个元素可以怎么用。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {XDU_ELEMENTS.map((item) => (
                  <div key={item} className="signal-chip">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-6">
              <p className="spec-label">查看顺序</p>
              <div className="mt-6 space-y-4">
                {[
                  '先看“旋律谱线”，理解西电的独有气质从哪里来。',
                  '再看“元素资料卡”，确认每个符号更适合承担什么角色。',
                  '最后回到工作台，把真正适合产品表达的母题组合起来。'
                ].map((item, index) => (
                  <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="spec-label">0{index + 1}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
              <div className="noise-line mt-6" />
              <button
                className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300"
                onClick={onOpenWorkspace}
              >
                回到工作区继续生成
                <ChevronRight size={16} />
              </button>
              <button
                className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                onClick={onOpenChat}
              >
                打开西小电问答
                <MessageCircle size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="melody-line" className="mx-auto max-w-7xl px-6 py-8">
        <SectionTitle eyebrow="校史时间线" title="旋律谱线" desc="这里先把校史节点理顺，方便理解这些元素为什么会出现在画面里。"/>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {MELODY_LINES.map((item) => (
            <div key={item.year} className="glass-panel signal-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="spec-label">{item.year}</p>
                <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-200">{item.note}</div>
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="element-cards" className="mx-auto max-w-7xl px-6 py-8">
        <SectionTitle
          eyebrow="元素说明"
          title="元素资料卡"
          desc="这些卡片不是说明词堆砌，而是在告诉你每个元素更适合承接什么情绪、结构与叙事任务。"
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ELEMENT_ATLAS.map((item) => (
            <div key={item.title} className="glass-panel signal-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="spec-label">{item.tag}</p>
                  <h3 className="mt-3 text-2xl font-bold text-white">{item.title}</h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#08131f] p-3 text-sky-300">
                  <Layers size={18} />
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-200">{item.summary}</p>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                <p className="spec-label">如何转成产品语言</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="translation-path" className="mx-auto max-w-7xl px-6 py-8">
        <div className="glass-panel rounded-[2rem] p-8">
          <SectionTitle eyebrow="使用步骤" title="从资料到画面的整理路径" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CULTURE_PATHS.map((item, index) => (
              <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-[#08131f] p-5">
                <p className="spec-label">0{index + 1}</p>
                <h3 className="mt-3 text-lg font-bold text-white">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function XiaodianChat({
  visible,
  messages,
  draft,
  onDraftChange,
  onSubmit,
  onQuickAsk,
  onToggle,
  isSending,
  errorMessage
}: {
  visible: boolean;
  messages: ChatMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onQuickAsk: (question: string) => void;
  onToggle: () => void;
  isSending: boolean;
  errorMessage: string;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      {visible ? (
        <div className="mb-4 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111f]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-cyan-500 text-slate-950">
                <Bot size={20} />
              </div>
                <div>
                  <p className="text-sm font-semibold text-white">西小电智能助理</p>
                  <p className="text-xs leading-5 text-slate-400">以西电科技气质为灵感的校园问答入口</p>
                  <p className="text-[11px] leading-5 text-sky-300">版本 {XIAODIAN_BUILD_TAG}</p>
                </div>
              </div>
            <button
              className="rounded-full border border-white/10 p-2 text-slate-300 transition-colors hover:bg-white/10"
              onClick={onToggle}
            >
              <X size={16} />
            </button>
          </div>

          {/* 聊天内容区负责展示上下文与快捷提问，避免首屏只有空输入框。 */}
          <div className="max-h-[26rem] space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`rounded-[1.25rem] px-4 py-3 text-sm leading-7 ${
                  item.role === 'assistant'
                    ? 'border border-sky-300/15 bg-sky-300/10 text-slate-100'
                    : 'ml-8 border border-white/10 bg-white/5 text-white'
                }`}
              >
                {item.content}
              </div>
            ))}

            <div className="space-y-2">
              <p className="spec-label">快捷提问</p>
              <div className="flex flex-wrap gap-2">
                {XIAODIAN_QUICK_QUESTIONS.map((item) => (
                  <button
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition-colors hover:bg-white/10"
                    onClick={() => onQuickAsk(item)}
                    disabled={isSending}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-[1.25rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-7 text-rose-100">
                {errorMessage}
              </div>
            ) : null}
          </div>

          {/* 输入区只做最小问答闭环，影响范围仅限西小电对话交互。 */}
          <div className="border-t border-white/10 px-5 py-4">
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              className="min-h-[88px] w-full rounded-[1.25rem] border border-white/10 bg-[#08131f] p-4 text-sm leading-7 text-white outline-none transition-colors focus:border-sky-300/40"
              placeholder="问我：这个元素适合放在哪里？"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">回车发送，Shift + 回车换行</p>
              <button
                className="flex items-center gap-2 rounded-2xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onSubmit}
                disabled={isSending || !draft.trim()}
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSending ? '思考中' : '发送'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 西小电悬浮按钮固定在右下角，作用是给元素图谱页补一个低打扰入口。 */}
      <button
        className="group flex items-center gap-3 rounded-full border border-sky-300/20 bg-[#08131f]/90 px-4 py-3 text-white shadow-xl shadow-sky-500/10 backdrop-blur-xl transition-transform hover:-translate-y-0.5"
        onClick={onToggle}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/20">
          <Bot size={20} />
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold">西小电</div>
          <div className="text-xs text-slate-400">{visible ? '收起问答' : '点我聊聊元素图谱'}</div>
        </div>
        <MessageCircle size={18} className="text-sky-300 transition-transform group-hover:scale-110" />
      </button>
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [theme, setTheme] = useState('西电红色通信精神与银杏校园记忆');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('科技感');
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('海报');
  const [selectedElements, setSelectedElements] = useState<string[]>(['半部电台起家', '银杏大道', '集成电路']);
  const [result, setResult] = useState<GenerationResult | null>(INITIAL_RESULT);
  const [historyList, setHistoryList] = useState<GenerationResult[]>([]);
  const [featuredList, setFeaturedList] = useState<GenerationResult[]>([]);
  const [activePreviewKey, setActivePreviewKey] = useState('hero');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: XIAODIAN_WELCOME_MESSAGE }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatErrorMessage, setChatErrorMessage] = useState('');
  const workspaceSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let mounted = true;

    // 初始化加载历史与精选数据，影响范围仅限页面首屏内容。
    Promise.allSettled([fetchHistory(), fetchFeaturedWorks()]).then(([historyRes, featuredRes]) => {
      if (!mounted) return;

      if (historyRes.status === 'fulfilled') {
        setHistoryList(historyRes.value.map(mapHistoryRecord));
      }

      if (featuredRes.status === 'fulfilled') {
        setFeaturedList(featuredRes.value.map(mapFeaturedRecord));
      }

      setIsLoadingHistory(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const previewList = useMemo<PreviewItem[]>(() => result?.generatedPreviews || result?.previewPrompts || [], [result]);
  const activePreview = useMemo(() => previewList.find((item) => item.key === activePreviewKey) || previewList[0] || null, [activePreviewKey, previewList]);
  const featuredWorks = useMemo(() => [...CURATED_WORKS, ...featuredList].slice(0, 6), [featuredList]);

  // 首页摘要改成更面向使用者的表达，避免展示层文案过于内部化。
  const summaryItems = useMemo(
    () => [
      {
        title: '方案风格',
        content: `${result?.elements.slice(0, 3).join(' / ') || '等待生成结果'}，整体会更偏西电、科技和校园记忆并存的感觉。`
      },
      {
        title: 'AI 帮你做什么',
        content: `${getModeLabel(result?.generationMode)}会把主题、元素、载体和预览方向一起整理出来，省掉来回试错。`
      },
      {
        title: '更像西电的地方',
        content: '半部电台起家、银杏校园、电子信息和通信气质会一起出现在结果里。'
      },
      {
        title: '适合怎么用',
        content: '主图、说明、亮点和展示内容都能顺着当前结果继续往下展开。'
      }
    ],
    [result]
  );

  const heroPills = useMemo(
    () => [
      `主题：${theme}`,
      `风格：${selectedStyle}`,
      `载体：${selectedProduct}`,
      `AI：${getModeLabel(result?.generationMode)}`,
      `元素：${selectedElements.length} 项`
    ],
    [result?.generationMode, selectedElements.length, selectedProduct, selectedStyle, theme]
  );

  const aiHighlights = useMemo(
    () => [
      {
        title: '当前模式',
        content: getModeLabel(result?.generationMode)
      },
      {
        title: '可看方向',
        content: `${previewList.length || 0} 个方向`
      },
      {
        title: '当前元素',
        content: result?.cultureConstraints?.selectedElements.join(' / ') || selectedElements.join(' / ')
      }
    ],
    [previewList.length, result?.cultureConstraints?.selectedElements, result?.generationMode, selectedElements]
  );

  // 点击历史记录后自动回到工作区上方，方便直接看当前结果和方向图。
  const focusWorkspaceSection = () => {
    window.requestAnimationFrame(() => {
      workspaceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 进入元素图谱页时保留西小电入口，避免聊天能力在多页切换中丢失上下文。
  const openChatPanel = () => {
    setIsChatOpen(true);
    setChatErrorMessage('');
  };

  const toggleChatPanel = () => {
    setIsChatOpen((prev) => !prev);
    setChatErrorMessage('');
  };

  // 表单元素选择逻辑只影响工作区参数，避免过多耦合到其他模块。
  const toggleElement = (item: string) => {
    setSelectedElements((prev) => {
      if (prev.includes(item)) {
        return prev.filter((current) => current !== item);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const handleGenerate = async () => {
    if (!theme.trim()) {
      setErrorMessage('请先写清主题，再生成内容。');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const generated = await generatePlan({
        theme,
        style: selectedStyle,
        productType: selectedProduct,
        campusElements: selectedElements
      });

      const mapped = mapGenerateResult(generated, selectedStyle, selectedProduct);
      setResult(mapped);
      setActivePreviewKey(mapped.generatedPreviews?.[0]?.key || mapped.previewPrompts?.[0]?.key || 'hero');
      setHistoryList((prev) => [mapped, ...prev].slice(0, 12));
      setViewMode('workspace');
      focusWorkspaceSection();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '生成失败，请稍后再试。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFeatured = async () => {
    if (!result) return;

    setIsSavingFeatured(true);
    setErrorMessage('');

    try {
      const saved = await saveFeaturedWork({
        title: result.title,
        slogan: result.slogan,
        concept: result.concept,
        elements: result.elements,
        colors: result.colors,
        scenarios: result.scenarios,
        designDescription: result.designDescription,
        style: result.style,
        productType: result.productType,
        generatedImageUrl: result.generatedImageUrl,
        generatedImageEnabled: result.generatedImageEnabled
      });
      setFeaturedList((prev) => [mapFeaturedRecord(saved), ...prev].slice(0, 12));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '加入画廊失败，请稍后再试。');
    } finally {
      setIsSavingFeatured(false);
    }
  };

  const submitChat = async (question?: string) => {
    const nextQuestion = (question || chatDraft).trim();
    if (!nextQuestion || isChatSending) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: nextQuestion }];
    setChatMessages(nextMessages);
    setChatDraft('');
    // 每次重新提问先清空上一次状态提示，避免旧失败信息残留到新请求里。
    setChatErrorMessage('');
    setIsChatSending(true);
    setIsChatOpen(true);

    try {
      let response;

      try {
        response = await chatWithXiaodian(nextMessages);
      } catch (firstError) {
        await delay(500);
        response = await chatWithXiaodian(nextMessages);
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      // 仅在本次回复实际走了后端本地兜底时才提示，避免把旧状态误显示成当前状态。
      setChatErrorMessage(response.meta?.model === 'offline-fallback' ? '本次回复使用本地讲解模式，继续提问会自动重试联网问答。' : '');
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: buildClientFallbackReply(nextQuestion)
        }
      ]);
      // 当前端请求层失败时明确提示这是本次请求结果，避免误解成服务始终不可用。
      setChatErrorMessage('本次请求没连上联网问答，已切到本地讲解模式；继续提问会自动重试。');
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-sky-400/30">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(0,98,255,0.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(216,169,58,0.14),transparent_20%),linear-gradient(180deg,#07111f_0%,#081523_45%,#050a12_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-15" />

      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#07111f]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-sky-500/10">
              <Cpu size={18} className="text-sky-300" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[0.3em] text-sky-300">XDU CAMPUSMIND</div>
              <div className="text-xs text-slate-400">{viewMode === 'home' ? '首页' : viewMode === 'workspace' ? '创意工作台' : '元素图谱'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                viewMode === 'home' ? 'border-sky-300/30 bg-sky-300/10 text-sky-100' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              }`}
              onClick={() => switchView('home')}
            >
              首页
            </button>
            <button
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                viewMode === 'atlas' ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              }`}
              onClick={() => switchView('atlas')}
            >
              元素图谱
            </button>
            <button
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                viewMode === 'workspace' ? 'border-sky-300/30 bg-sky-300/10 text-sky-100' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              }`}
              onClick={() => switchView('workspace')}
            >
              工作台
            </button>
          </div>
        </div>
      </nav>

      {viewMode === 'atlas' ? (
        <>
          <ElementAtlasPage
            onOpenWorkspace={() => switchView('workspace')}
            onOpenChat={openChatPanel}
          />
        </>
      ) : null}

      {viewMode === 'home' ? (
        <>
          <section className="px-6 pb-14 pt-28">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-semibold text-sky-200">
                  <Sparkles size={14} />
                  西电校园创意生成与展示
                </div>

                <div className="space-y-5">
                  <p className="spec-label">创意生成器</p>
                  <h1 className="display-title text-5xl font-black leading-tight text-white md:text-7xl">
                    让西电校园元素
                    <span className="block bg-gradient-to-r from-sky-300 via-white to-amber-300 bg-clip-text text-transparent">
                      更快变成能直接看的创意方案
                    </span>
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-slate-300">
                    你可以先选主题、风格、载体和西电元素，系统会直接给出主图、不同方向预览和后续展示内容，方便继续挑选和细化。
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {heroPills.map((item) => (
                    <div key={item} className="signal-chip">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {aiHighlights.map((item) => (
                    <div key={item.title} className="glass-panel signal-card rounded-[1.5rem] p-4">
                      <p className="spec-label">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-100">{item.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    className="group flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                    onClick={() => switchView('workspace')}
                  >
                    打开工作台
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-semibold text-white transition-colors hover:bg-white/10"
                    onClick={() => switchView('atlas')}
                  >
                    先看元素图谱
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <ResultPreview result={result} preview={activePreview} tag="当前主图" />
                <div className="glass-panel rounded-[1.75rem] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="spec-label">使用说明</p>
                    <div className="signal-chip">先选再看</div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-100">
                    首页先帮你看当前结果，想继续细调可以进工作台；想了解元素来源，再去看元素图谱。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-8">
            <SectionTitle eyebrow="当前结果" title="当前核心方案" desc="这里先把现在最值得看的结果直接放出来，方便你快速判断方向。" />
            <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="glass-panel signal-card rounded-[2rem] p-7">
                <p className="spec-label">当前输出</p>
                <h3 className="display-title mt-5 text-3xl font-bold text-white">{result?.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300">{result?.slogan}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {result?.colors.map((item) => (
                    <div key={item.hex} className="rounded-2xl border border-white/10 bg-[#08131f] p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full border border-white/10" style={{ background: item.hex }} />
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.hex}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <SummaryCards items={summaryItems} />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-8">
            <SectionTitle
              eyebrow="西电识别点"
              title="为什么这套结果会更像西电"
              desc="从这些识别点出发，可以更直观地看懂这套方案为什么更像西电。"
            />
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {BRAND_SIGNAL_SYSTEM.map((item) => (
                <div key={item.title} className="glass-panel signal-card rounded-[2rem] p-6">
                  <p className="spec-label">{item.eyebrow}</p>
                  <h3 className="mt-4 text-2xl font-bold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="glass-panel signal-card rounded-[2rem] p-8">
                <SectionTitle
                  eyebrow="AI 帮助"
                  title="AI 会帮你更快看到不同结果"
                  desc="它会把主题、元素和载体一起整理，再给出不同方向，方便你直接比较，而不是只拿到一段文字。"
                />
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {AI_ENGINE_STEPS.map((item) => (
                    <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-5">
                      <p className="spec-label">{item.title}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="spec-label">生成依据</p>
                      <h3 className="mt-3 text-2xl font-bold text-white">当前生成依据</h3>
                    </div>
                    <div className="signal-chip">{getModeLabel(result?.generationMode)}</div>
                  </div>
                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-code text-xs leading-7 text-slate-300">{truncateText(toUserFacingText(result?.promptPreview), 280)}</p>
                  </div>
                </div>

                <div className="glass-panel rounded-[2rem] p-6">
                  <p className="spec-label">参考规则</p>
                  <h3 className="mt-3 text-2xl font-bold text-white">结果会优先参考这些西电元素和规则</h3>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {(result?.cultureConstraints?.schoolIdentity || ['电子信息', '通信报国', '校园青春']).map((item) => (
                      <div key={item} className="signal-chip">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    {(result?.cultureConstraints?.designPrinciples || ['必须有西电辨识度', '必须能继续展开内容', '必须能落到真实物料']).map((item) => (
                      <div key={item} className="rounded-[1.25rem] border border-white/10 bg-[#08131f] px-4 py-3 text-sm leading-7 text-slate-300">
                        {toUserFacingText(item)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <DeliveryBoard
            result={result}
            activePreview={activePreview}
            theme={theme}
            selectedStyle={selectedStyle}
            selectedProduct={selectedProduct}
          />

          <section className="mx-auto max-w-7xl px-6 py-8">
            <SectionTitle eyebrow="精选方案" title="灵感画廊" desc="这里放的是当前比较完整、值得继续往下细化的方案。" />
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredWorks.map((item, index) => (
                <article key={buildItemKey(item, index)} className="glass-panel overflow-hidden rounded-[2rem]">
                  <div className="aspect-[4/3] bg-[#08131f]">
                    {item.generatedImageUrl ? (
                      <img src={item.generatedImageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">
                        <ImageIcon size={36} />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="spec-label">{item.productType || '海报'} / {item.style || '科技感'}</p>
                    <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.slogan}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {viewMode === 'workspace' ? (
        <main className="mx-auto max-w-7xl px-6 pb-16 pt-28">
          <section ref={workspaceSectionRef} className="grid gap-8 xl:grid-cols-[0.94fr_1.06fr]">
            <div className="glass-panel rounded-[2rem] p-7">
              <SectionTitle eyebrow="工作台" title="生成与调整内容" desc="先把主题收窄，再决定风格、载体与元素，这样输出会更稳。" />

              <div className="mt-8 space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-200">主题</label>
                  <textarea
                    value={theme}
                    onChange={(event) => setTheme(event.target.value)}
                    className="min-h-[128px] w-full rounded-2xl border border-white/10 bg-[#08131f] p-4 text-sm leading-7 text-white outline-none transition-colors focus:border-sky-300/40"
                    placeholder="例如：围绕半部电台起家与银杏大道，生成一套兼具红色根脉与校园温度的海报方案。"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <Palette size={16} />
                      风格
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {STYLES.map((item) => (
                        <button
                          key={item}
                          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                            selectedStyle === item ? 'border-sky-300/30 bg-sky-300/10 text-sky-100' : 'border-white/10 bg-[#08131f] text-slate-300 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedStyle(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <Layers size={16} />
                      载体
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {PRODUCTS.map((item) => (
                        <button
                          key={item}
                          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                            selectedProduct === item ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-[#08131f] text-slate-300 hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedProduct(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Wand2 size={16} />
                    西电元素
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {XDU_ELEMENTS.map((item) => (
                      <button
                        key={item}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedElements.includes(item) ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 bg-[#08131f] text-slate-300 hover:bg-white/10'
                        }`}
                        onClick={() => toggleElement(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-500">建议控制在 3 到 5 个元素内，画面会更集中。</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isGenerating ? '正在生成' : '生成方案'}
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSaveFeatured}
                    disabled={isSavingFeatured || !result}
                  >
                    {isSavingFeatured ? <Loader2 size={18} className="animate-spin" /> : <History size={18} />}
                    加入画廊
                  </button>
                </div>

                {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">{errorMessage}</div> : null}
              </div>
            </div>

            <div className="space-y-6">
              <ResultPreview result={result} preview={activePreview} tag={activePreview?.label || '当前主图'} />

              <div className="glass-panel rounded-[2rem] p-6">
                <SectionTitle eyebrow="当前信息" title="当前片段" />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-label">题目</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{result?.title || '等待生成结果'}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-label">线索</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{result?.elements.slice(0, 2).join(' / ') || '等待生成结果'}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-label">气质</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{selectedStyle}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-label">载体</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{selectedProduct}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-label">配色</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{result?.colors.map((item) => item.name).join(' / ') || '等待生成结果'}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-4">
                    <p className="spec-label">AI 方式</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">{getModeLabel(result?.generationMode)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="glass-panel rounded-[2rem] p-7">
              <SectionTitle eyebrow="结果说明" title="当前核心方案" />
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="display-title text-2xl font-bold text-white">{result?.title || '等待生成结果'}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-300">{result?.concept || '生成后这里会显示完整概念说明。'}</p>
                </div>

                <SummaryCards
                  items={[
                    { title: '主张', content: result?.slogan || '等待生成结果' },
                    { title: '应用场景', content: result?.scenarios.join(' / ') || '等待生成结果' },
                    { title: '视觉元素', content: result?.elements.join(' / ') || '等待生成结果' },
                    { title: '设计说明', content: result?.designDescription || '等待生成结果' }
                  ]}
                />
              </div>
            </div>

            <aside className="space-y-6">
              <div className="glass-panel rounded-[2rem] p-7">
                <SectionTitle eyebrow="方向切换" title="方向预览" />
                <div className="mt-6 space-y-4">
                  {previewList.length ? (
                    previewList.map((item) => (
                      <button
                        key={item.key}
                        className={`w-full rounded-[1.5rem] border p-4 text-left transition-colors ${
                          activePreview?.key === item.key ? 'border-sky-300/30 bg-sky-300/10' : 'border-white/10 bg-[#08131f] hover:bg-white/10'
                        }`}
                        onClick={() => setActivePreviewKey(item.key)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{item.label}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-400">{item.description}</p>
                          </div>
                          {isGeneratedPreview(item) && item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.label}
                              className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                            />
                          ) : null}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-[#08131f] p-5 text-sm leading-7 text-slate-400">
                      生成后这里会出现可切换的方向预览。
                    </div>
                  )}
                </div>

                {activePreview ? (
                  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[#08131f] p-5">
                    <p className="spec-label">当前提示语</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{toUserFacingText(activePreview.prompt)}</p>
                    {isGeneratedPreview(activePreview) ? (
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        {activePreview.enabled ? '当前方向已生成预览图，左侧主图会跟着切换。' : activePreview.reason || '当前方向暂未生成图片。'}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="glass-panel rounded-[2rem] p-7">
                <SectionTitle eyebrow="生成说明" title="AI 关键能力说明" />
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[#08131f] p-5">
                  <p className="spec-label">生成依据</p>
                  <p className="spec-code mt-3 text-xs leading-7 text-slate-300">{truncateText(toUserFacingText(result?.promptPreview), 320)}</p>
                </div>
                <div className="mt-4 space-y-3">
                  {(result?.cultureConstraints?.designPrinciples || ['生成后这里会显示当前方案采用的参考规则。']).map((item) => (
                    <div key={item} className="rounded-[1.25rem] border border-white/10 bg-[#08131f] px-4 py-3 text-sm leading-7 text-slate-300">
                      {toUserFacingText(item)}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <DeliveryBoard
            result={result}
            activePreview={activePreview}
            theme={theme}
            selectedStyle={selectedStyle}
            selectedProduct={selectedProduct}
          />

          <section className="mt-8 rounded-[2rem] glass-panel p-7">
            <SectionTitle eyebrow="历史记录" title="最近记录" desc="这里保留最近一批生成记录，方便你快速回看和切换。" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isLoadingHistory ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-5 text-sm text-slate-400">正在加载历史记录...</div>
              ) : historyList.length ? (
                historyList.map((item, index) => (
                  <button
                    key={buildItemKey(item, index)}
                    className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-5 text-left transition-colors hover:bg-white/10"
                    onClick={() => {
                      setResult(item);
                      setActivePreviewKey(item.generatedPreviews?.[0]?.key || item.previewPrompts?.[0]?.key || 'hero');
                      focusWorkspaceSection();
                    }}
                  >
                    <p className="spec-label">{formatDate(item.createdAt)}</p>
                    <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.slogan}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-[#08131f] p-5 text-sm text-slate-400">当前还没有历史记录。</div>
              )}
            </div>
          </section>
        </main>
      ) : null}

      {/* 全局挂载西小电浮窗，修复首页和工作台下聊天入口缺失导致的“不可用”体验，影响范围仅限聊天入口展示。 */}
      <XiaodianChat
        visible={isChatOpen}
        messages={chatMessages}
        draft={chatDraft}
        onDraftChange={setChatDraft}
        onSubmit={() => submitChat()}
        onQuickAsk={(question) => submitChat(question)}
        onToggle={toggleChatPanel}
        isSending={isChatSending}
        errorMessage={chatErrorMessage}
      />

      <footer className="mx-auto flex max-w-7xl items-center justify-between px-6 pb-10 pt-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} />
          当前页面仅展示本地生成内容，不主动对外公开。
        </div>
        <button className="transition-colors hover:text-white" onClick={() => setIsPrivacyOpen(true)}>
          查看说明
        </button>
      </footer>

      {isPrivacyOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#08131f] p-7 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="spec-label">Notice</p>
                <h3 className="mt-3 text-2xl font-bold text-white">使用说明</h3>
              </div>
              <button className="rounded-full border border-white/10 p-2 text-slate-300 transition-colors hover:bg-white/10" onClick={() => setIsPrivacyOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              <p>这个前端页面用于整理校园文化元素、生成方案并沉淀当前内容，不直接承担公开发布职责。</p>
              <p>“旋律谱线”时间线依据西安电子科技大学官网学校简介与学校章程整理，用来帮助理解元素来源，而不是替代正式校史材料。</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
