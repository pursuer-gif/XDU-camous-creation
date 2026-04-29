// Main generation service: validates input, creates a plan, attaches image preview data, and stores history.
const { AppError } = require('../middleware/errorHandler');
const { createRuleBasedPlan } = require('./ruleGenerationService');
const { createLLMPlan } = require('./llmGenerationService');
const { saveHistory } = require('./historyService');
const { generateImage } = require('./imageGenerationService');
const { cleanString, cleanStringArray } = require('../utils/sanitize');

const TEXT = {
  themeRequired: 'theme \u4e3a\u5fc5\u586b\u9879\uff0c\u4e14\u5fc5\u987b\u662f\u975e\u7a7a\u5b57\u7b26\u4e32',
  styleRequired: 'style \u4e3a\u5fc5\u586b\u9879\uff0c\u4e14\u5fc5\u987b\u662f\u5b57\u7b26\u4e32',
  productRequired: 'productType \u4e3a\u5fc5\u586b\u9879\uff0c\u4e14\u5fc5\u987b\u662f\u5b57\u7b26\u4e32',
  elementsRequired: 'campusElements \u5fc5\u987b\u662f\u6570\u7ec4',
  themeTooLong: 'theme \u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7 80 \u4e2a\u5b57\u7b26',
  styleTooLong: 'style \u6216 productType \u957f\u5ea6\u5f02\u5e38',
  tooManyElements: 'campusElements \u6700\u591a\u9009\u62e9 8 \u9879',
  previewSkipped: '\u4e3a\u4fdd\u8bc1\u751f\u6210\u7a33\u5b9a\uff0c\u672c\u6b21\u4ec5\u751f\u6210\u4e3b\u9884\u89c8\u56fe'
};

function validatePayload(payload) {
  const { theme, style, productType, campusElements } = payload;

  if (!theme || typeof theme !== 'string' || !theme.trim()) {
    throw new AppError(TEXT.themeRequired, 400);
  }

  if (!style || typeof style !== 'string') {
    throw new AppError(TEXT.styleRequired, 400);
  }

  if (!productType || typeof productType !== 'string') {
    throw new AppError(TEXT.productRequired, 400);
  }

  if (!Array.isArray(campusElements)) {
    throw new AppError(TEXT.elementsRequired, 400);
  }

  if (theme.trim().length > 80) {
    throw new AppError(TEXT.themeTooLong, 400);
  }

  if (style.trim().length > 30 || productType.trim().length > 30) {
    throw new AppError(TEXT.styleTooLong, 400);
  }

  if (campusElements.length > 8) {
    throw new AppError(TEXT.tooManyElements, 400);
  }
}

function sanitizePayload(payload) {
  return {
    theme: cleanString(payload.theme, 80),
    style: cleanString(payload.style, 30),
    productType: cleanString(payload.productType, 30),
    campusElements: cleanStringArray(payload.campusElements, {
      maxItems: 8,
      itemMaxLength: 30
    })
  };
}

function buildPreviewImages(previewPrompts, imageResult) {
  return (previewPrompts || []).slice(0, 3).map((item, index) => ({
    key: item.key,
    label: item.label,
    description: item.description,
    prompt: item.prompt,
    enabled: index === 0 ? imageResult.enabled : false,
    imageUrl: index === 0 ? imageResult.imageUrl : '',
    reason: index === 0 ? imageResult.reason : TEXT.previewSkipped
  }));
}

async function generateCampusDesign(payload) {
  validatePayload(payload);
  const sanitizedPayload = sanitizePayload(payload);

  const generationMode = (process.env.GENERATION_MODE || 'rule').toLowerCase();
  const generator = generationMode === 'llm' ? createLLMPlan : createRuleBasedPlan;

  const generated = await generator(sanitizedPayload);
  const mainPrompt = generated.previewPrompts?.[0]?.prompt || generated.posterPrompt;
  const imageResult = await generateImage({
    prompt: mainPrompt,
    productType: sanitizedPayload.productType
  });

  const output = {
    ...generated,
    generatedImage: imageResult,
    generatedPreviews: buildPreviewImages(generated.previewPrompts, imageResult)
  };
  const record = saveHistory({
    input: sanitizedPayload,
    output,
    mode: generationMode
  });

  return {
    ...output,
    meta: {
      recordId: record.id,
      generationMode,
      createdAt: record.createdAt
    }
  };
}

module.exports = {
  generateCampusDesign
};
