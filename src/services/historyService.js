// 历史服务：把生成记录持久化到本地文件，影响范围为历史查询与重启后的记录保留。
const fs = require('fs');
const path = require('path');

// 历史记录上限保持为最近 20 条，影响范围为本地持久化与历史接口返回数量。
const MAX_HISTORY_SIZE = 20;
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const HISTORY_FILE_PATH = path.join(DATA_DIR, 'history.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(HISTORY_FILE_PATH)) {
    fs.writeFileSync(HISTORY_FILE_PATH, '[]', 'utf8');
  }
}

function loadHistory() {
  ensureStorage();

  try {
    // 读取时顺手去掉 UTF-8 BOM，避免外部工具改写文件后导致 JSON 解析失败。
    const content = fs.readFileSync(HISTORY_FILE_PATH, 'utf8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[HistoryService] failed to read history file:', error.message);
    return [];
  }
}

function saveHistory(record) {
  const historyStore = loadHistory();
  const data = {
    id: `record_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...record
  };

  historyStore.unshift(data);

  if (historyStore.length > MAX_HISTORY_SIZE) {
    historyStore.length = MAX_HISTORY_SIZE;
  }

  ensureStorage();
  fs.writeFileSync(
    HISTORY_FILE_PATH,
    JSON.stringify(historyStore, null, 2),
    'utf8'
  );
  return data;
}

function getRecentHistory() {
  const historyStore = loadHistory();

  // 历史记录接口只返回前端展示所需字段，避免把完整提示词与内部约束长期暴露给公网。
  return historyStore.slice(0, MAX_HISTORY_SIZE).map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    mode: item.mode,
    input: item.input,
    output: {
      title: item.output?.title,
      slogan: item.output?.slogan,
      concept: item.output?.concept,
      visualElements: item.output?.visualElements || [],
      colors: item.output?.colors || [],
      applicationScenes: item.output?.applicationScenes || [],
      designDescription: item.output?.designDescription || '',
      ipImagePrompt: item.output?.ipImagePrompt || '',
      posterPrompt: item.output?.posterPrompt || '',
      previewPrompts: item.output?.previewPrompts || [],
      generatedPreviews: item.output?.generatedPreviews || [],
      cultureConstraints: item.output?.cultureConstraints,
      promptPreview: item.output?.promptPreview || '',
      generatedImage: item.output?.generatedImage || {
        enabled: false,
        imageUrl: '',
        reason: ''
      }
    }
  }));
}

module.exports = {
  saveHistory,
  getRecentHistory
};
