// 健康检查路由：提供服务存活状态，影响范围仅限 GET /api/health。
const express = require('express');

const { getHealth } = require('../controllers/healthController');

const router = express.Router();

router.get('/health', getHealth);

module.exports = router;
