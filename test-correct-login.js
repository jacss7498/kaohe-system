const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testCorrectLogin() {
  try {
    console.log('使用正确的用户名和密码登录...\n');

    // 获取验证码
    const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
    const { id: captchaId, code: captchaCode } = captchaRes.data;
    console.log(`验证码: ${captchaCode}`);

    // 使用正确的用户名和密码登录
    console.log('\n登录信息:');
    console.log('用户名: 15339906679');
    console.log('密码: 15339906679');

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: '15339906679',
      password: '15339906679',
      captchaId,
      captchaCode
    });

    console.log('\n✅ 登录成功!');
    console.log('用户信息:', JSON.stringify(loginRes.data.user, null, 2));

  } catch (error) {
    console.error('\n❌ 登录失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testCorrectLogin();
