// 文创约束模块集中维护学校文化、风格、产品与元素规则，影响范围为生成内容的一致性与辨识度。
const cultureConstraintPack = {
  academicIdentity: ['电子信息', '通信报国', '科技创新', '厚德求真', '青春校园'],
  schoolSpirit: {
    keywords: ['红色基因', '通信精神', '工程实践', '创新创业', '青年奋进'],
    shortLine: '让科技理想在校园里被看见'
  },
  coreColors: [
    { name: '西电蓝', hex: '#003399' },
    { name: '星电银', hex: '#C9D1E8' },
    { name: '银杏金', hex: '#D8A93A' }
  ],
  patternLibrary: ['电路板走线', '通信波纹', '数字矩阵', '银杏叶脉', '校训印章'],
  designPrinciples: [
    '必须体现西安电子科技大学电子信息学科特征',
    '必须兼顾校园青春气质与文创传播属性',
    '必须考虑印刷、徽章、织物等实体产品的制作可行性',
    '避免使用与学校形象冲突的低辨识度通用符号'
  ]
};

// 风格画像用于控制生成气质，影响范围为标题、标语、配色、元素与落地建议。
const styleProfiles = {
  科技感: {
    name: '科技感',
    titleSuffix: '信号提案',
    sloganTone: '让理想沿着信号向未来发射',
    visualLanguage: '高对比、数字化、信号化、工程秩序感',
    layoutDirection: '网格化排布与中心主视觉聚焦',
    signatureElements: ['发光电路纹理', '信号波束', '科技界面框线'],
    colors: [
      { name: '信号青', hex: '#00C2FF' },
      { name: '科技紫', hex: '#6C3BFF' },
      { name: '深空蓝', hex: '#071B4A' }
    ],
    constraints: ['突出电子信息气质', '避免过度卡通化', '强调未来感与专业度']
  },
  青春活力: {
    name: '青春活力',
    titleSuffix: '青春提案',
    sloganTone: '把热爱装进西电校园的日常',
    visualLanguage: '明快、轻盈、节奏鲜明、具有社交传播感',
    layoutDirection: '大色块与校园剪影穿插布局',
    signatureElements: ['跳跃色块', '手写感标语', '校园剪影拼贴'],
    colors: [
      { name: '晨曦橙', hex: '#FF8A3D' },
      { name: '晴空蓝', hex: '#56B6FF' },
      { name: '银杏黄', hex: '#F4C542' }
    ],
    constraints: ['突出校园记忆', '保留学校科技底色', '适合线上传播']
  },
  纪念收藏: {
    name: '纪念收藏',
    titleSuffix: '典藏提案',
    sloganTone: '把西电荣光做成能珍藏的纪念物',
    visualLanguage: '庄重、精致、层次克制、具有纪念章法',
    layoutDirection: '对称构图与章纹层叠布局',
    signatureElements: ['纪念徽章边框', '时间轴刻度', '烫金纹章'],
    colors: [
      { name: '典藏金', hex: '#C9982F' },
      { name: '墨曜蓝', hex: '#11264D' },
      { name: '瓷白', hex: '#F6F3EA' }
    ],
    constraints: ['强化校史纪念价值', '适合实体收藏', '避免过度花哨']
  },
  极简未来: {
    name: '极简未来',
    titleSuffix: '未来提案',
    sloganTone: '用更克制的语言表达西电气质',
    visualLanguage: '几何、留白、简洁、理性未来感',
    layoutDirection: '少元素高辨识度构图',
    signatureElements: ['几何线框', '极简点阵', '冷静留白'],
    colors: [
      { name: '雾银白', hex: '#EEF2F7' },
      { name: '未来蓝', hex: '#3A7BFF' },
      { name: '碳素黑', hex: '#111827' }
    ],
    constraints: ['控制元素数量', '强调高级感', '兼顾科技与实用']
  },
  国潮纪念: {
    name: '国潮纪念',
    titleSuffix: '华章提案',
    sloganTone: '把校史气韵转成当代校园记忆',
    visualLanguage: '新国潮纹样、章印秩序、传统色与现代图形结合',
    layoutDirection: '中轴构图与题签式版面',
    signatureElements: ['印章边框', '传统纹样重组', '题签字牌'],
    colors: [
      { name: '绛朱红', hex: '#A7373A' },
      { name: '釉金', hex: '#D4A24C' },
      { name: '黛青蓝', hex: '#203A5B' }
    ],
    constraints: ['避免旅游纪念品感', '保留高校学术气质', '适合礼赠与收藏']
  },
  插画叙事: {
    name: '插画叙事',
    titleSuffix: '画境提案',
    sloganTone: '把校园故事画成可带走的风景',
    visualLanguage: '场景化、柔和、有人物和故事感的插画表达',
    layoutDirection: '前中后景分层与故事主角聚焦',
    signatureElements: ['校园场景插画', '角色互动细节', '层次化景深'],
    colors: [
      { name: '云雾蓝', hex: '#79A8D8' },
      { name: '银杏米黄', hex: '#E7C76B' },
      { name: '暮林绿', hex: '#4D7B63' }
    ],
    constraints: ['强化场景记忆点', '避免信息过载', '适合明信片与包袋']
  },
  潮流街头: {
    name: '潮流街头',
    titleSuffix: '潮玩提案',
    sloganTone: '把西电态度穿在身上、背在路上',
    visualLanguage: '强标语、贴纸拼贴、街头图形与周边化表达',
    layoutDirection: '块面碰撞与局部夸张排版',
    signatureElements: ['贴纸标签', '粗体标语', '喷绘纹理'],
    colors: [
      { name: '电光蓝', hex: '#2D6BFF' },
      { name: '高能橙', hex: '#FF6A28' },
      { name: '炭黑', hex: '#191919' }
    ],
    constraints: ['避免低幼化', '保留高校辨识信息', '适合包袋与徽章']
  },
  温暖治愈: {
    name: '温暖治愈',
    titleSuffix: '时光提案',
    sloganTone: '把西电温度放进可陪伴的日常',
    visualLanguage: '柔和配色、轻生活方式、亲和但不失质感',
    layoutDirection: '留白呼吸感与圆角柔性构图',
    signatureElements: ['手账小图标', '柔和色块', '轻纹理背景'],
    colors: [
      { name: '奶杏色', hex: '#F2D7A1' },
      { name: '雾霭蓝', hex: '#9EB8D8' },
      { name: '暖云白', hex: '#F7F3EE' }
    ],
    constraints: ['避免过度甜腻', '适合日常用品', '强调陪伴感与传播感']
  }
};

// 产品画像用于控制输出物料的展示形式与工艺建议，影响范围为应用场景与提示词。
const productProfiles = {
  海报: {
    name: '海报',
    titleSuffix: '海报方向',
    visualFocus: ['主标题版式', '比赛展板视觉', '主题口号区'],
    materialSuggestion: ['高克重铜版纸', '局部UV', '冷烫工艺'],
    constraints: ['适合大幅面展示', '信息层级清晰', '适合答辩展板与线上传播']
  },
  徽章: {
    name: '徽章',
    titleSuffix: '徽章方向',
    visualFocus: ['中心图腾', '边框纹章', '高识别轮廓'],
    materialSuggestion: ['金属压铸', '珐琅填色', '局部磨砂'],
    constraints: ['图形需适配小尺寸', '轮廓清晰', '适合实体打样']
  },
  帆布袋: {
    name: '帆布袋',
    titleSuffix: '包袋方向',
    visualFocus: ['大面积主图', '低色数印刷适配', '标语可读性'],
    materialSuggestion: ['丝网印刷', '环保帆布', '刺绣贴章'],
    constraints: ['适合织物印刷', '图案不能过细碎', '兼顾日常使用']
  },
  明信片: {
    name: '明信片',
    titleSuffix: '明信片方向',
    visualFocus: ['校园地标画面', '故事性文案', '系列收藏感'],
    materialSuggestion: ['触感纸', '烫银', '局部压纹'],
    constraints: ['强调纪念传播属性', '适合系列化设计', '兼顾邮寄与收藏']
  },
  IP形象: {
    name: 'IP形象',
    titleSuffix: 'IP方向',
    visualFocus: ['角色设定', '动作表情', '配件与世界观'],
    materialSuggestion: ['毛绒挂件', '盲盒涂装', '贴纸套装'],
    constraints: ['角色设定需可延展', '造型必须有西电辨识度', '适合跨媒介衍生']
  }
};

// 校园元素画像用于绑定西电识别符号，影响范围为概念文案、视觉元素与图像提示词。
const elementProfiles = {
  西电图书馆: {
    name: '西电图书馆',
    symbolism: '知识积累与学术精神',
    visualHints: ['图书馆几何立面', '书页层叠线条'],
    promptTag: '西电图书馆建筑'
  },
  银杏大道: {
    name: '银杏大道',
    symbolism: '青春记忆与校园季节感',
    visualHints: ['银杏叶脉纹理', '林荫步道透视'],
    promptTag: '银杏大道'
  },
  集成电路: {
    name: '集成电路',
    symbolism: '电子信息学科底色与工程秩序',
    visualHints: ['芯片纹理', 'PCB走线'],
    promptTag: '电路板图形'
  },
  厚德求真: {
    name: '厚德求真',
    symbolism: '校训精神与治学态度',
    visualHints: ['校训书法线条', '纪念印记'],
    promptTag: '厚德求真校训元素'
  },
  通信天线: {
    name: '通信天线',
    symbolism: '通信报国与信号连接',
    visualHints: ['天线塔剪影', '信号扩散波纹'],
    promptTag: '通信天线'
  },
  校徽标识: {
    name: '校徽标识',
    symbolism: '学校品牌归属与官方识别感',
    visualHints: ['校徽轮廓', '标识徽章'],
    promptTag: '校徽图腾'
  },
  操场跑道: {
    name: '操场跑道',
    symbolism: '青年能量与集体记忆',
    visualHints: ['跑道弧线', '运动节奏纹'],
    promptTag: '校园操场跑道'
  },
  教学楼: {
    name: '教学楼',
    symbolism: '学习场景与日常校园气息',
    visualHints: ['教学楼立面', '窗格几何节奏'],
    promptTag: '校园教学楼'
  }
};

function getCultureConstraintPack() {
  return cultureConstraintPack;
}

function getStyleProfile(style) {
  return styleProfiles[style] || styleProfiles.科技感;
}

function getStyleNames() {
  return Object.keys(styleProfiles);
}

function getProductProfile(productType) {
  return productProfiles[productType] || productProfiles.海报;
}

function getElementProfiles(selectedElements = []) {
  // 校园元素改为真正可选，未选择时不强制塞入默认元素，避免压缩主题发挥空间。
  if (!selectedElements.length) {
    return [];
  }

  return selectedElements.map((item) => elementProfiles[item] || {
    name: item,
    symbolism: '校园文化与主题表达',
    visualHints: [`${item}图形符号`, `${item}抽象纹理`],
    promptTag: item
  });
}

module.exports = {
  getCultureConstraintPack,
  getStyleProfile,
  getStyleNames,
  getProductProfile,
  getElementProfiles
};
