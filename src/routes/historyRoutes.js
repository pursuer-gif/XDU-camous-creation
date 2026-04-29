// 历史路由：提供最近生成记录查询，影响范围仅限 GET /api/history。
const express = require('express');

const { getHistory } = require('../controllers/historyController');

const router = express.Router();

router.get('/history', getHistory);

module.exports = router;
