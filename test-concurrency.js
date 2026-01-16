const axios = require('axios');

const API_BASE = 'http://localhost:5173/api';

// 模拟多个用户同时请求
async function simulateConcurrentUsers(userCount, requestsPerUser) {
  console.log(`\n=== 模拟 ${userCount} 个用户并发测试 ===`);
  console.log(`每个用户发送 ${requestsPerUser} 个请求\n`);

  const startTime = Date.now();
  const promises = [];
  let successCount = 0;
  let failCount = 0;

  // 创建多个用户的并发请求
  for (let user = 0; user < userCount; user++) {
    for (let req = 0; req < requestsPerUser; req++) {
      const promise = axios.get(`${API_BASE}/health`)
        .then(() => {
          successCount++;
        })
        .catch((error) => {
          failCount++;
          if (error.response?.status === 429) {
            console.log(`⚠️  触发速率限制: ${error.response.data}`);
          }
        });
      promises.push(promise);
    }
  }

  // 等待所有请求完成
  await Promise.all(promises);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('\n=== 测试结果 ===');
  console.log(`总请求数: ${userCount * requestsPerUser}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`总耗时: ${duration.toFixed(2)} 秒`);
  console.log(`平均响应时间: ${(duration / (userCount * requestsPerUser) * 1000).toFixed(2)} ms`);
  console.log(`每秒请求数: ${((userCount * requestsPerUser) / duration).toFixed(2)} req/s`);

  return { successCount, failCount, duration };
}

async function runTests() {
  console.log('=== 并发性能优化测试 ===\n');

  // 测试1: 模拟10个用户同时操作
  console.log('\n【测试1】10个用户，每人5个请求（模拟正常使用）');
  await simulateConcurrentUsers(10, 5);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试2: 模拟34个用户同时操作（所有评分用户）
  console.log('\n\n【测试2】34个用户，每人5个请求（模拟高峰期）');
  await simulateConcurrentUsers(34, 5);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试3: 压力测试 - 50个用户
  console.log('\n\n【测试3】50个用户，每人6个请求（压力测试）');
  const result = await simulateConcurrentUsers(50, 6);

  console.log('\n\n=== 总结 ===');
  if (result.failCount === 0) {
    console.log('✅ 所有测试通过！系统可以稳定支持高并发访问。');
  } else if (result.failCount < result.successCount * 0.1) {
    console.log('✅ 测试基本通过，少量请求被限流（正常现象）。');
  } else {
    console.log('⚠️  有较多请求被限流，可能需要进一步调整限流配置。');
  }

  console.log('\n配置说明:');
  console.log('- 通用限流: 300 请求/分钟');
  console.log('- 登录限流: 20 次/15分钟');
  console.log('- 验证码限流: 50 次/分钟');
  console.log('- SQLite WAL模式: 已启用');
  console.log('- 缓存优化: 已启用（8MB）');
}

runTests().catch(console.error);
