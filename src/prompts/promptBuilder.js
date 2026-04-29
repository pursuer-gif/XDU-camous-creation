// Prompt Builder 负责拼装主题、风格、物料与校园约束，影响范围为 LLM 提示词预览与后续生成一致性。
function buildGenerationPrompt(payload, context) {
  const { theme, style, productType, campusElements } = payload;
  const { culturePack, styleProfile, productProfile, elementProfiles } = context;
  const selectedElementsText = campusElements.length
    ? campusElements.join('、')
    : '本次未强制指定校园元素，可按主题自由融入西电校园气质';
  const elementText = elementProfiles.length
    ? elementProfiles.map((item) => `${item.name}：${item.symbolism}`).join('；')
    : '校园元素以整体气质轻量融入，不强制出现明确地标';
  const schoolBadgeGuideline = campusElements.includes('校徽标识')
    ? '若使用西电校徽或相关标识设计，必须严格参考西安电子科技大学官方 VIS 样例页面 https://news.xidian.edu.cn/VIS.htm 中的校徽应用样式，不得自行臆造、变形、错绘或替换核心结构。'
    : '如方案后续涉及西电校徽或相关标识，必须严格参考西安电子科技大学官方 VIS 样例页面 https://news.xidian.edu.cn/VIS.htm，不得自行臆造或变形。';

  return [
    '你是一名面向高校文创竞赛的资深品牌策划与视觉创意顾问。',
    '请围绕西安电子科技大学校园文创场景，输出兼具比赛展示效果与真实落地可行性的设计方案。',
    `项目名称：XDU CampusMind`,
    `学校背景：西安电子科技大学，强调 ${culturePack.academicIdentity.join('、')}`,
    `设计主题：${theme}`,
    `视觉风格：${style}，对应风格语言为 ${styleProfile.visualLanguage}`,
    `产品类型：${productType}，重点关注 ${productProfile.constraints.join('、')}`,
    `用户选择的校园元素：${selectedElementsText}`,
    `必须体现的校园文化关键词：${culturePack.schoolSpirit.keywords.join('、')}`,
    `推荐融入的纹样与符号：${culturePack.patternLibrary.join('、')}`,
    `风格约束：${styleProfile.constraints.join('、')}`,
    `产品落地约束：${productProfile.constraints.join('、')}`,
    `元素语义：${elementText}`,
    `校徽规范：${schoolBadgeGuideline}`,
    '输出必须是结构化 JSON，字段包括 title、slogan、concept、visualElements、colors、applicationScenes、designDescription、ipImagePrompt、posterPrompt。',
    '结果要兼顾竞赛展示效果、校园传播属性与工艺落地性，避免空泛口号，避免做成换个校名也成立的泛校园方案。'
  ].join('\n');
}

module.exports = {
  buildGenerationPrompt
};
