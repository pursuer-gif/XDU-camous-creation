// 生成控制器负责接收请求并调用生成服务，影响范围为生成接口的响应格式。
const { generateCampusDesign } = require('../services/generationService');
const { success } = require('../utils/response');

async function generatePlan(req, res, next) {
  try {
    const payload = req.body || {};
    const result = await generateCampusDesign(payload);

    return res.status(200).json(
      success(result, '文创方案生成成功')
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  generatePlan
};
