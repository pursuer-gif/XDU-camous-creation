// 路由总入口：统一挂载业务路由，影响范围仅限 /api 命名空间。
const express = require('express');

const chatRoutes = require('./chatRoutes');
const generateRoutes = require('./generateRoutes');
const historyRoutes = require('./historyRoutes');
const healthRoutes = require('./healthRoutes');
const featuredRoutes = require('./featuredRoutes');

const router = express.Router();

router.use('/', healthRoutes);
router.use('/', historyRoutes);
router.use('/', featuredRoutes);
router.use('/', generateRoutes);
router.use('/', chatRoutes);

module.exports = router;
