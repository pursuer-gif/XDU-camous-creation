// 历史控制器：负责返回最近生成记录，影响范围为历史查询接口。
const { getRecentHistory } = require('../services/historyService');
const { success } = require('../utils/response');

function getHistory(req, res) {
  const records = getRecentHistory();

  return res.status(200).json(
    success(records, '历史记录获取成功')
  );
}

module.exports = {
  getHistory
};
