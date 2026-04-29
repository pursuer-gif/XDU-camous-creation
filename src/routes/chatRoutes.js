// 聊天路由：对外暴露西小电问答接口，影响范围仅限 POST /api/chat。
const express = require('express');

const { chatWithAssistant } = require('../controllers/chatController');
const { createRateLimiter } = require('../middleware/security');

const router = express.Router();
const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: '聊天请求过于频繁，请稍后再试'
});

// 聊天接口单独限流，避免连续追问在演示环境下造成接口抖动。
router.post('/chat', chatRateLimiter, chatWithAssistant);

module.exports = router;
