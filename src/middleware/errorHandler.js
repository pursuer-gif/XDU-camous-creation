// 错误处理中间件：统一封装业务错误与兜底异常，影响范围为全局异常返回。
const { failure } = require('../utils/response');

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res) {
  return res.status(404).json(
    failure('请求的接口不存在', {
      path: req.originalUrl
    })
  );
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  const isProduction = process.env.NODE_ENV === 'production';
  const safeDetails = isProduction ? null : (err.details || null);

  console.error('[ErrorHandler]', {
    message,
    statusCode,
    details: err.details || null
  });

  return res.status(statusCode).json(
    failure(message, safeDetails)
  );
}

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler
};
