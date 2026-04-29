// 健康控制器：返回服务运行状态与基础元信息，影响范围为健康检查接口。
const { success } = require('../utils/response');

function getHealth(req, res) {
  return res.status(200).json(
    success(
      {
        service: 'XDU CampusMind Backend',
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      '服务运行正常'
    )
  );
}

module.exports = {
  getHealth
};
