// 生成路由对外暴露文创方案生成接口，影响范围仅限 POST /api/generate。
const express = require('express');

const { generatePlan } = require('../controllers/generateController');
const { createRateLimiter } = require('../middleware/security');

const router = express.Router();
const generateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 12,
  message: '生成请求过于频繁，请 1 分钟后再试'
});

// 生成接口使用限流保护，避免浏览器侧固定令牌带来额外风险。
router.post('/generate', generateRateLimiter, generatePlan);

module.exports = router;
