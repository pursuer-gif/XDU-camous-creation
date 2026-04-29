// 静态预览服务：用于在受限环境下直接托管构建后的前端产物，影响范围仅限本地演示访问。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 5173);
// 默认改为 127.0.0.1，避免部分网络环境下 localhost 被异常解析导致前端代理后端失败。
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:3000';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function resolveFile(requestPath) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.join(DIST_DIR, normalizedPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  return path.join(DIST_DIR, 'index.html');
}

// 本地静态服务顺手代理 /api，请求同源化后浏览器侧会稳定很多。
function proxyApiRequest(req, res) {
  const targetUrl = new URL(req.url || '/', API_TARGET);
  const proxyRequest = http.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host
      }
    },
    (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(res);
    }
  );

  proxyRequest.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      message: '本地前端代理后端失败',
      error: {
        target: API_TARGET
      }
    }));
  });

  req.pipe(proxyRequest);
}

const server = http.createServer((req, res) => {
  if ((req.url || '').startsWith('/api/')) {
    proxyApiRequest(req, res);
    return;
  }

  const filePath = resolveFile(req.url || '/');
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('前端静态资源读取失败');
      return;
    }

    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
});

// 端口占用时给出明确提示，避免双击脚本后误以为前端没有启动。
server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`[XDU CampusMind] Frontend preview port ${PORT} is already in use. Existing frontend may already be running on http://localhost:${PORT}`);
    return;
  }

  console.error('[XDU CampusMind] Frontend preview failed to start:', error);
});

server.listen(PORT, '0.0.0.0', () => {
  // 启动日志同步提示 127.0.0.1，便于本机调试时直接使用稳定地址访问。
  console.log(`[XDU CampusMind] Frontend preview is running on http://127.0.0.1:${PORT}`);
});
