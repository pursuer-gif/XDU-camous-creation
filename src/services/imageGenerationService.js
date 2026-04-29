// Image generation service for main and preview images.
const { fetch: undiciFetch, EnvHttpProxyAgent } = require('undici');

const IMAGE_API_URL = 'https://qianfan.baidubce.com/v2/images/generations';
const IMAGE_TIMEOUT_MS = Number(process.env.QIANFAN_IMAGE_TIMEOUT_MS) || 120000;
const IMAGE_MAX_ATTEMPTS = Number(process.env.QIANFAN_IMAGE_MAX_ATTEMPTS) || 1;
const RETRYABLE_HTTP_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const TEXT = {
  missingInput: '\u672a\u914d\u7f6e\u5343\u5e06\u751f\u56fe\u5bc6\u94a5\u6216\u63d0\u793a\u8bcd\u4e3a\u7a7a',
  success: '\u751f\u6210\u6210\u529f',
  requestFailed: '\u5343\u5e06\u751f\u56fe\u8bf7\u6c42\u5931\u8d25',
  requestException: '\u8c03\u7528\u5343\u5e06\u751f\u56fe\u63a5\u53e3\u5f02\u5e38',
  invalidJson: '\u5343\u5e06\u751f\u56fe\u8fd4\u56de\u5185\u5bb9\u89e3\u6790\u5931\u8d25',
  rateLimited: '\u5343\u5e06\u751f\u56fe\u670d\u52a1\u5f53\u524d\u9650\u6d41\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  emptyUrl: '\u63a5\u53e3\u8fd4\u56de\u6210\u529f\u4f46\u672a\u5305\u542b\u56fe\u7247\u5730\u5740',
  missingKey: '\u672a\u914d\u7f6e\u5343\u5e06\u751f\u56fe\u5bc6\u94a5'
};

const PRODUCT_SIZE_MAP = {
  '\u6d77\u62a5': '1536x2048',
  '\u5fbd\u7ae0': '1024x1024',
  '\u5e06\u5e03\u888b': '1024x1024',
  '\u660e\u4fe1\u7247': '1024x1536',
  'IP\u5f62\u8c61': '1328x1328'
};

function getImageSize(productType) {
  return PRODUCT_SIZE_MAP[productType] || '1328x1328';
}

function getApiKey() {
  return process.env.QIANFAN_API_KEY;
}

function getDisabledResult(reason) {
  return {
    enabled: false,
    imageUrl: '',
    reason
  };
}

function shouldExposeProviderError() {
  return process.env.NODE_ENV !== 'production';
}

function getProxyDispatcher() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return proxyUrl ? new EnvHttpProxyAgent() : undefined;
}

function shouldRetryStatus(status) {
  return RETRYABLE_HTTP_STATUS.has(status);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestImageOnce({ prompt, productType, apiKey, dispatcher }) {
  let response;
  let result = null;

  try {
    response = await undiciFetch(IMAGE_API_URL, {
      method: 'POST',
      dispatcher,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.QIANFAN_IMAGE_MODEL || 'qwen-image',
        prompt,
        size: getImageSize(productType),
        n: 1,
        steps: 30,
        guidance: 4,
        negative_prompt: '\u4f4e\u8d28\u91cf\u3001\u6a21\u7cca\u3001\u53d8\u5f62\u3001\u6742\u4e71\u6587\u5b57\u3001\u6c34\u5370\u3001\u7834\u635f\u8fb9\u7f18\u3001\u9519\u8bef\u900f\u89c6',
        prompt_extend: true
      }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS)
    });
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      reason: TEXT.requestException,
      debug: error.message || 'unknown'
    };
  }

  try {
    result = await response.json();
  } catch (error) {
    return {
      ok: false,
      retryable: shouldRetryStatus(response.status),
      reason: TEXT.invalidJson,
      debug: error.message || `http_${response.status}`
    };
  }

  if (!response.ok) {
    const providerCode = result?.error?.code || result?.code || '';
    const providerMessage = result?.error?.message || result?.message || TEXT.requestFailed;

    return {
      ok: false,
      retryable: shouldRetryStatus(response.status),
      reason: response.status === 429 ? TEXT.rateLimited : providerMessage,
      debug: `${response.status}${providerCode ? `:${providerCode}` : ''}`
    };
  }

  const imageUrl = result?.data?.[0]?.url || '';
  if (!imageUrl) {
    return {
      ok: false,
      retryable: true,
      reason: TEXT.emptyUrl,
      debug: result?.id || 'empty_url'
    };
  }

  return {
    ok: true,
    imageUrl,
    raw: {
      id: result.id,
      created: result.created
    }
  };
}

async function generateImage({ prompt, productType }) {
  const apiKey = getApiKey();
  const dispatcher = getProxyDispatcher();

  if (!apiKey || !prompt) {
    return getDisabledResult(TEXT.missingInput);
  }

  const failureReasons = [];

  for (let attempt = 1; attempt <= IMAGE_MAX_ATTEMPTS; attempt += 1) {
    const result = await requestImageOnce({
      prompt,
      productType,
      apiKey,
      dispatcher
    });

    if (result.ok) {
      return {
        enabled: true,
        imageUrl: result.imageUrl,
        reason: TEXT.success,
        raw: result.raw
      };
    }

    failureReasons.push(result.debug ? `${result.reason} (${result.debug})` : result.reason);

    if (!result.retryable || attempt >= IMAGE_MAX_ATTEMPTS) {
      return {
        enabled: false,
        imageUrl: '',
        reason: result.reason,
        error: shouldExposeProviderError() ? failureReasons.join(' | ') : undefined
      };
    }

    await sleep(700 * attempt);
  }

  return {
    enabled: false,
    imageUrl: '',
    reason: TEXT.requestFailed,
    error: shouldExposeProviderError() ? failureReasons.join(' | ') : undefined
  };
}

async function generatePreviewImages({ previewPrompts = [], productType }) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return previewPrompts.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
      prompt: item.prompt,
      enabled: false,
      imageUrl: '',
      reason: TEXT.missingKey
    }));
  }

  const images = [];
  for (const item of previewPrompts.slice(0, 3)) {
    const generated = await generateImage({
      prompt: item.prompt,
      productType
    });

    images.push({
      key: item.key,
      label: item.label,
      description: item.description,
      prompt: item.prompt,
      enabled: generated.enabled,
      imageUrl: generated.imageUrl,
      reason: generated.reason
    });
  }

  return images;
}

module.exports = {
  generateImage,
  generatePreviewImages
};
