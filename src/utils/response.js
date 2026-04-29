// 统一响应工具：规范接口返回结构，影响范围为所有 API 的响应格式。
function success(data, message = 'success') {
  return {
    success: true,
    message,
    data
  };
}

function failure(message = 'error', error = null) {
  return {
    success: false,
    message,
    error
  };
}

module.exports = {
  success,
  failure
};
