// 服务启动入口：负责加载环境变量并启动 Express 应用，影响范围仅限服务启动流程。
require('dotenv').config();

const app = require('./src/app');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  // 启动日志用于比赛演示时快速确认服务状态。
  console.log(`[XDU CampusMind] Backend is running on http://localhost:${PORT}`);
});
