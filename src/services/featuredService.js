// 精选作品服务：把公开展示的作品持久化到本地文件，影响范围为作品库展示与保存功能。
const fs = require('fs');
const path = require('path');

const MAX_FEATURED_SIZE = 12;
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FEATURED_FILE_PATH = path.join(DATA_DIR, 'featured.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(FEATURED_FILE_PATH)) {
    fs.writeFileSync(FEATURED_FILE_PATH, '[]', 'utf8');
  }
}

function loadFeatured() {
  ensureStorage();

  try {
    const content = fs.readFileSync(FEATURED_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[FeaturedService] failed to read featured file:', error.message);
    return [];
  }
}

function saveFeatured(record) {
  const featuredStore = loadFeatured();
  const data = {
    id: `featured_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...record
  };

  featuredStore.unshift(data);

  if (featuredStore.length > MAX_FEATURED_SIZE) {
    featuredStore.length = MAX_FEATURED_SIZE;
  }

  ensureStorage();
  fs.writeFileSync(
    FEATURED_FILE_PATH,
    JSON.stringify(featuredStore, null, 2),
    'utf8'
  );

  return data;
}

function getFeaturedWorks() {
  return loadFeatured();
}

module.exports = {
  saveFeatured,
  getFeaturedWorks
};
