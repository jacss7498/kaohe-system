const axios = require('axios');

const API_BASE = 'http://localhost:5173/api'; // 通过Nginx代理

async function testLoginFlow() {
  try {
    console.log('=== 测试完整登录流程 ===\n');

    // 1. 获取验证码
    console.log('1. 获取验证码...');
    const captchaResponse = await axios.get(`${API_BASE}/auth/captcha`);
    console.log('✓ 验证码获取成功:', captchaResponse.data);

    const { id: captchaId, code: captchaCode } = captchaResponse.data;

    // 2. 模拟登录（使用错误的验证码测试）
    console.log('\n2. 测试错误验证码...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'admin123',
        captchaId: captchaId,
        captchaCode: '0000' // 错误验证码
      });
    } catch (error) {
      console.log('✓ 正确拒绝错误验证码:', error.response?.data?.error || error.message);
    }

    // 3. 获取新验证码并使用正确的验证码登录
    console.log('\n3. 重新获取验证码并登录...');
    const newCaptchaResponse = await axios.get(`${API_BASE}/auth/captcha`);
    const { id: newCaptchaId, code: newCaptchaCode } = newCaptchaResponse.data;
    console.log('✓ 新验证码:', newCaptchaResponse.data);

    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'admin123',
        captchaId: newCaptchaId,
        captchaCode: newCaptchaCode
      });
      console.log('✓ 登录成功!');
      console.log('  用户信息:', loginResponse.data.user);
      console.log('  Token已获取:', loginResponse.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.log('✗ 登录失败:', error.response?.data?.error || error.message);
    }

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试出错:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

testLoginFlow();
