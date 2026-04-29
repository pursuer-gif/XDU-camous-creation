// 应用装配入口：集中注册中间件、路由和错误处理，影响范围为全局请求处理链路。
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { applySecurityHeaders, buildCorsOptions } = require('./middleware/security');

const app = express();
app.disable('x-powered-by');

// CORS 改为支持域名白名单，影响范围为公网部署时的来源访问控制。
app.use(cors(buildCorsOptions()));
app.use(applySecurityHeaders);
app.use(express.json({ limit: '1mb' }));

// 明确声明 API 响应使用 UTF-8，避免演示环境下中文出现编码歧义。
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// 请求日志保持轻量，方便演示时观察接口调用。
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
