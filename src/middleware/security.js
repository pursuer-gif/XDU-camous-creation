// 安全中间件：统一处理公网部署下的 CORS 白名单、访问令牌和基础限流。
const { AppError } = require('./errorHandler');

function parseAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildCorsOptions() {
  const allowedOrigins = parseAllowedOrigins();
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    origin(origin, callback) {
      // 无 Origin 的请求通常来自本机调试、健康检查或服务端调用，默认放行。
      if (!origin) {
        callback(null, true);
        return;
      }

      // 生产环境必须显式配置白名单，避免“忘配即全开放”。
      if (!allowedOrigins.length) {
        if (isProduction) {
          callback(new AppError('服务端未配置允许访问的前端来源', 503));
          return;
        }

        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError('当前来源未被允许访问', 403));
    }
  };
}

function requireAccessToken(req, res, next) {
  const expectedToken = process.env.DEPLOY_ACCESS_TOKEN;
  const isProduction = process.env.NODE_ENV === 'production';

  // 未配置访问令牌时本地保持兼容，生产环境则提示配置缺失。
  if (!expectedToken) {
    if (isProduction) {
      next(new AppError('服务端未配置部署访问令牌', 503));
      return;
    }

    next();
    return;
  }

  const requestToken = req.headers['x-campus-token'];
  if (requestToken !== expectedToken) {
    next(new AppError('访问令牌无效', 401));
    return;
  }

  next();
}

function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 20,
  message = '请求过于频繁，请稍后再试'
} = {}) {
  const requestStore = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${clientIp}:${req.path}`;
    const current = requestStore.get(key);

    if (!current || now > current.expiresAt) {
      requestStore.set(key, {
        count: 1,
        expiresAt: now + windowMs
      });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      next(new AppError(message, 429, {
        retryAfterMs: current.expiresAt - now
      }));
      return;
    }

    current.count += 1;
    requestStore.set(key, current);
    next();
  };
}

function applySecurityHeaders(req, res, next) {
  // 基础安全响应头，影响范围为所有接口响应。
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

module.exports = {
  buildCorsOptions,
  requireAccessToken,
  createRateLimiter,
  applySecurityHeaders
};
