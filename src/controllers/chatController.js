// 聊天控制器：负责接收西小电问答请求并返回统一响应结构，影响范围仅限聊天接口。
const { createCampusChatReply } = require('../services/chatService');
const { success } = require('../utils/response');

async function chatWithAssistant(req, res, next) {
  try {
    const payload = req.body || {};
    const result = await createCampusChatReply(payload.messages);

    return res.status(200).json(
      success(result, '西小电回复成功')
    );
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  chatWithAssistant
};
