// 规则生成服务在没有外部大模型时提供稳定输出，影响范围为核心方案文案与预览提示词。
const {
  getCultureConstraintPack,
  getStyleProfile,
  getProductProfile,
  getElementProfiles
} = require('../utils/cultureConstraints');
const { buildGenerationPrompt } = require('../prompts/promptBuilder');

function pickUnique(list, limit) {
  return [...new Set(list)].slice(0, limit);
}

function buildTitle(theme, styleProfile, productProfile) {
  const themeKeywords = theme
    .replace(/[，。、“”‘’：；！？!?]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const primaryWord = themeKeywords[0] || '西电';
  return `${primaryWord} · ${styleProfile.titleSuffix}${productProfile.titleSuffix}`;
}

function buildSlogan(theme, culturePack, styleProfile) {
  const themeCore = theme.includes('青春') ? '青春' : '西电';
  return `${themeCore}主题下，${styleProfile.sloganTone}，回应${culturePack.schoolSpirit.shortLine}`;
}

function buildElementNarrative(elementProfiles) {
  if (!elementProfiles.length) {
    return '以西电整体校园气质和电子信息学科精神作为隐性氛围，不强制绑定具体地标';
  }

  return elementProfiles.map((item) => `${item.name}承载${item.symbolism}`).join('，');
}

function buildConcept(theme, styleProfile, productProfile, elementProfiles, culturePack) {
  return `方案围绕“${theme}”展开，以${culturePack.academicIdentity.join('、')}作为文化骨架，融入${buildElementNarrative(
    elementProfiles
  )}，并采用${styleProfile.visualLanguage}的设计语言，形成适合${productProfile.name}落地展示的校园文创提案。整体强调${culturePack.schoolSpirit.keywords.join(
    '、'
  )}，既有比赛展示张力，也兼顾校园传播与后续打样可能。`;
}

function buildVisualElements(elementProfiles, styleProfile, productProfile) {
  const dynamicElements = elementProfiles.flatMap((item) => item.visualHints);
  const productElements = productProfile.visualFocus;
  const styleElements = styleProfile.signatureElements;

  return pickUnique([...dynamicElements, ...styleElements, ...productElements], 6);
}

function buildColors(styleProfile, culturePack) {
  return pickUnique([...styleProfile.colors, ...culturePack.coreColors], 4);
}

function buildApplicationScenes(productType, styleProfile) {
  const baseScenes = [
    `${productType}用于校园文化节与创新创业成果展示`,
    `${productType}用于迎新季、毕业季与校友返校纪念传播`,
    `${productType}用于学院活动、实验室开放日与学术论坛配套物料`
  ];

  if (styleProfile.name === '纪念收藏' || styleProfile.name === '国潮纪念') {
    baseScenes.unshift(`${productType}适合校庆纪念套装与收藏型限量发售`);
  }

  return pickUnique(baseScenes, 4);
}

function buildDesignDescription(styleProfile, productProfile, elementProfiles, culturePack) {
  const materialSuggestion = productProfile.materialSuggestion.join('、');
  const selectedElementNames = elementProfiles.length
    ? elementProfiles.map((item) => item.name).join('、')
    : '西电校园气质、学科精神与品牌识别符号';

  return `建议以${styleProfile.layoutDirection}组织画面，主视觉突出${selectedElementNames}，再用${culturePack.patternLibrary.join(
    '、'
  )}构成辅助信息层级。工艺上优先考虑${materialSuggestion}，在确保展示效果的同时兼顾真实生产成本和打样可行性。`;
}

function buildImagePrompt(theme, styleProfile, productProfile, elementProfiles, culturePack) {
  const elementText = elementProfiles.length
    ? elementProfiles.map((item) => item.promptTag).join('、')
    : '校园青春氛围、电子信息气质、低密度西电识别符号';
  const colors = buildColors(styleProfile, culturePack)
    .map((color) => `${color.name}(${color.hex})`)
    .join('、');

  return `以“${theme}”为核心，设计一组适合西安电子科技大学校园文创的${productProfile.name}主视觉或 IP 形象，突出${culturePack.academicIdentity.join(
    '、'
  )}，融入${elementText}，风格为${styleProfile.name}，色彩以${colors}为主，画面强调校园青春、电子信息、科技创新与真实文创落地感。`;
}

function buildPosterPrompt(theme, styleProfile, productProfile, elementProfiles, culturePack) {
  const keyVisuals = buildVisualElements(elementProfiles, styleProfile, productProfile).join('、');

  return `生成一张用于西安电子科技大学校园文创展示的${productProfile.name}主视觉，主题是“${theme}”，核心视觉包含${keyVisuals}，体现${culturePack.schoolSpirit.keywords.join(
    '、'
  )}，整体气质为${styleProfile.visualLanguage}，适合比赛答辩展示、校内宣传和线上传播。`;
}

function buildPromptBase(theme, styleProfile, productProfile, elementProfiles, culturePack) {
  const colorText = buildColors(styleProfile, culturePack)
    .map((item) => item.name)
    .join('、');
  const elementText = elementProfiles.length
    ? elementProfiles.map((item) => item.promptTag).join('、')
    : '弱化具体地标，强调西电校园气质与电子信息学科特征';
  const includesSchoolBadge = elementProfiles.some((item) => item.name === '校徽标识');
  const schoolBadgeClause = includesSchoolBadge
    ? '若使用西电校徽，必须严格参考官方 VIS 样例，不得自行变形或替换核心图形'
    : '若画面涉及西电校徽或相关标识，必须严格参考官方 VIS 样例，不得自行生成变形版本';

  return [
    `${productProfile.name}文创产品设计预览`,
    `主题“${theme}”`,
    `风格 ${styleProfile.name}`,
    `画面融入 ${elementText}`,
    `突出 ${culturePack.schoolSpirit.keywords.join('、')}`,
    `主色使用 ${colorText}`,
    schoolBadgeClause,
    '高质量商业产品渲染',
    '材质真实',
    '构图完整',
    '无水印',
    '无错字'
  ].join('，');
}

function buildProductRenderClauses(productProfile) {
  const renderMap = {
    海报: ['竖版海报比例', '适合展板展示', '版式完整', '主标题区清晰', '避免旅游纪念品感'],
    徽章: ['小尺寸可识别', '轮廓清晰', '金属与珐琅质感', '避免细碎纹理', '适合实物打样'],
    帆布袋: ['帆布织物纹理真实', '图案适合丝网印刷', '大色块与清晰线条', '适合肩背场景展示'],
    明信片: ['卡片边界完整', '适合系列化设计', '保留留白区', '强调纪念品质感'],
    IP形象: ['角色设定清晰', '主体突出', '便于挂件贴纸盲盒衍生', '背景不能喧宾夺主']
  };

  return renderMap[productProfile.name] || ['材质真实', '适合打样', '结构清晰'];
}

function buildShotClause(productProfile) {
  const shotMap = {
    海报: '正视角展示，适合答辩展板与宣传海报预览',
    徽章: '微距产品摄影风格，纯净背景，聚焦徽章本体',
    帆布袋: '电商级产品图或校园生活方式场景图，包身完整可见',
    明信片: '桌面平铺或轻透视陈列图，强调卡片实体质感',
    IP形象: '角色设定图或衍生展示图，主体居中清晰'
  };

  return shotMap[productProfile.name] || '产品主体清晰展示';
}

function buildProductPreviewPrompts(theme, styleProfile, productProfile, elementProfiles, culturePack) {
  const promptBase = buildPromptBase(theme, styleProfile, productProfile, elementProfiles, culturePack);
  const renderClauses = buildProductRenderClauses(productProfile).join('、');
  const shotClause = buildShotClause(productProfile);

  const directionMap = {
    海报: [
      ['hero', '主视觉方向', '适合比赛答辩和展板展示的核心海报', '大标题与中心主视觉形成强冲击力'],
      ['scene', '场景叙事方向', '强调校园记忆与故事氛围的叙事版面', '校园场景、人物活动与主题符号形成连续叙事'],
      ['graphic', '图形系统方向', '强调品牌化图形语言与现代设计感', '通过网格、几何图形和符号系统组织视觉']
    ],
    徽章: [
      ['commemorative', '纪念徽章方向', '适合校庆、纪念收藏和限量发售', '金属徽章、珐琅填色、中心图腾与外圈文字结构'],
      ['totem', '学科图腾方向', '突出通信、电路与校徽符号重组', '几何图腾、强轮廓和电子信息符号融合'],
      ['minimal', '极简识别方向', '适合日常佩戴和系列化延展', '高识别的小尺寸轮廓与克制配色']
    ],
    帆布袋: [
      ['statement', '标语主图方向', '突出一句话口号与大面积主图', '适合丝网印刷的大图形和简短标语'],
      ['badge', '贴章拼贴方向', '强调校徽、贴纸和元素拼贴', '布面贴章、徽章和标签组合形成街头感'],
      ['illustration', '插画场景方向', '强调温暖校园插画与生活方式气质', '肩背场景配合轻松校园插画']
    ],
    明信片: [
      ['landmark', '校园地标方向', '突出建筑与景观的纪念感', '地标画面配合纪念品摄影质感'],
      ['season', '四季系列方向', '突出季节变化和系列化收藏属性', '四季校园色彩与统一版式语言'],
      ['story', '故事文案方向', '强调叙事与寄语感', '保留书写区和更强的情绪表达']
    ],
    IP形象: [
      ['mascot', '吉祥物方向', '突出亲和力与校园辨识度', '适合校园 IP 吉祥物与角色设定卡'],
      ['mecha', '科技伙伴方向', '突出电子信息和未来感', '科技角色、机械配件和信号光效'],
      ['lifestyle', '生活陪伴方向', '突出日常衍生与陪伴属性', '角色与周边展示形成完整生活方式场景']
    ]
  };

  const directions = directionMap[productProfile.name] || directionMap.海报;

  // 多方向提示词用于拉开预览差异，影响范围仅限图像生成体验与右侧预览区。
  return directions.map(([key, label, description, extraPrompt]) => ({
    key,
    label,
    description,
    prompt: `${promptBase}，${extraPrompt}，工艺与落地要求包括${renderClauses}，拍摄或渲染方式为${shotClause}，禁止乱码文字、禁止低质纪念品风格、适合${productProfile.name}真实打样预览`
  }));
}

async function createRuleBasedPlan(payload) {
  const { theme, style, productType, campusElements } = payload;
  const culturePack = getCultureConstraintPack();
  const styleProfile = getStyleProfile(style);
  const productProfile = getProductProfile(productType);
  const elementProfiles = getElementProfiles(campusElements);
  const prompt = buildGenerationPrompt(payload, {
    culturePack,
    styleProfile,
    productProfile,
    elementProfiles
  });
  const previewPrompts = buildProductPreviewPrompts(
    theme,
    styleProfile,
    productProfile,
    elementProfiles,
    culturePack
  );

  return {
    title: buildTitle(theme, styleProfile, productProfile),
    slogan: buildSlogan(theme, culturePack, styleProfile),
    concept: buildConcept(theme, styleProfile, productProfile, elementProfiles, culturePack),
    visualElements: buildVisualElements(elementProfiles, styleProfile, productProfile),
    colors: buildColors(styleProfile, culturePack),
    applicationScenes: buildApplicationScenes(productType, styleProfile),
    designDescription: buildDesignDescription(styleProfile, productProfile, elementProfiles, culturePack),
    ipImagePrompt: buildImagePrompt(theme, styleProfile, productProfile, elementProfiles, culturePack),
    posterPrompt: buildPosterPrompt(theme, styleProfile, productProfile, elementProfiles, culturePack),
    previewPrompts,
    cultureConstraints: {
      schoolIdentity: culturePack.academicIdentity,
      schoolSpirit: culturePack.schoolSpirit.keywords,
      selectedElements: elementProfiles.map((item) => item.name),
      designPrinciples: culturePack.designPrinciples
    },
    promptPreview: prompt
  };
}

module.exports = {
  createRuleBasedPlan
};
