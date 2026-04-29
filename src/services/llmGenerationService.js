// LLM 生成服务预留真实大模型接入点，当前未配置时自动回退到规则生成。
const { createRuleBasedPlan } = require('./ruleGenerationService');
const { buildGenerationPrompt } = require('../prompts/promptBuilder');
const {
  getCultureConstraintPack,
  getStyleProfile,
  getProductProfile,
  getElementProfiles
} = require('../utils/cultureConstraints');

async function createLLMPlan(payload) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const culturePack = getCultureConstraintPack();
  const styleProfile = getStyleProfile(payload.style);
  const productProfile = getProductProfile(payload.productType);
  const elementProfiles = getElementProfiles(payload.campusElements);
  const prompt = buildGenerationPrompt(payload, {
    culturePack,
    styleProfile,
    productProfile,
    elementProfiles
  });

  if (!apiKey) {
    const fallbackResult = await createRuleBasedPlan(payload);

    return {
      ...fallbackResult,
      llmFallback: {
        enabled: false,
        reason: '未检测到 LLM API Key，已自动回退到规则生成模式',
        promptPreview: prompt
      }
    };
  }

  // 这里保留标准化接入点，后续可替换为真实 OpenAI 或其他模型 SDK 调用。
  const llmStubResult = await createRuleBasedPlan(payload);

  return {
    ...llmStubResult,
    llmFallback: {
      enabled: true,
      reason: '当前处于 LLM 模式占位实现，为保证演示稳定性仍以规则结果作为输出底座',
      promptPreview: prompt
    }
  };
}

module.exports = {
  createLLMPlan
};
