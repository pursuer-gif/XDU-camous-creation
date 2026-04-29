// 精选作品控制器：负责保存和返回公开展示作品，影响范围为作品库接口。
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');
const { getFeaturedWorks, saveFeatured } = require('../services/featuredService');
const { cleanColorArray, cleanString, cleanStringArray } = require('../utils/sanitize');

function isAllowedFeaturedImageUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return false;
    }

    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

function sanitizeFeaturedPayload(payload) {
  return {
    title: cleanString(payload.title, 80),
    slogan: cleanString(payload.slogan, 120),
    concept: cleanString(payload.concept, 800),
    elements: cleanStringArray(payload.elements, {
      maxItems: 8,
      itemMaxLength: 40
    }),
    colors: cleanColorArray(payload.colors, 6),
    scenarios: cleanStringArray(payload.scenarios, {
      maxItems: 6,
      itemMaxLength: 80
    }),
    designDescription: cleanString(payload.designDescription, 500),
    style: cleanString(payload.style, 30),
    productType: cleanString(payload.productType, 30),
    generatedImageUrl: cleanString(payload.generatedImageUrl, 400),
    generatedImageEnabled: Boolean(payload.generatedImageEnabled)
  };
}

function getFeatured(req, res) {
  const works = getFeaturedWorks();

  return res.status(200).json(
    success(works, '精选作品获取成功')
  );
}

function createFeatured(req, res, next) {
  try {
    const payload = sanitizeFeaturedPayload(req.body || {});

    if (!payload.title || !payload.slogan || !payload.concept) {
      throw new AppError('保存精选作品时缺少必要字段', 400);
    }

    if (!payload.generatedImageUrl || !isAllowedFeaturedImageUrl(payload.generatedImageUrl)) {
      throw new AppError('精选作品图片地址无效', 400);
    }

    if (!payload.elements.length || !payload.colors.length) {
      throw new AppError('精选作品的元素或配色数据不完整', 400);
    }

    const saved = saveFeatured(payload);

    return res.status(201).json(
      success(saved, '作品已保存到精选作品库')
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFeatured,
  createFeatured
};
