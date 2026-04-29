// 数据清洗工具：统一裁剪字符串、过滤控制字符并限制集合长度，影响范围为入参与持久化安全性。
function cleanString(value, maxLength = 200) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanStringArray(value, { maxItems = 8, itemMaxLength = 60 } = {}) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => cleanString(item, itemMaxLength)).filter(Boolean))].slice(0, maxItems);
}

function cleanColorArray(value, maxItems = 6) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      name: cleanString(item?.name, 40),
      hex: cleanString(item?.hex, 16)
    }))
    .filter((item) => item.name && /^#[0-9A-Fa-f]{6}$/.test(item.hex))
    .slice(0, maxItems);
}

module.exports = {
  cleanString,
  cleanStringArray,
  cleanColorArray
};
