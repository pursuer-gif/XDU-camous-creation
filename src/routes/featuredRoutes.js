// 精选作品路由：提供作品库读取与保存能力，影响范围仅限 /api/featured。
const express = require('express');

const { getFeatured, createFeatured } = require('../controllers/featuredController');
const { createRateLimiter } = require('../middleware/security');

const router = express.Router();
const featuredWriteRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 6,
  message: '精选作品写入过于频繁，请稍后再试'
});

router.get('/featured', getFeatured);
// 精选作品写入走更严格限流，避免公网下被任意刷库。
router.post('/featured', featuredWriteRateLimiter, createFeatured);

module.exports = router;
