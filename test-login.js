const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testLogin() {
  try {
    console.log('1. 获取验证码...');
    const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
    console.log('验证码响应:', captchaRes.data);

    const { id: captchaId, code: captchaCode } = captchaRes.data;

    console.log('\n2. 尝试登录...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123',
      captchaId,
      captchaCode
    });

    console.log('✅ 登录成功!');
    console.log('响应:', loginRes.data);

  } catch (error) {
    console.error('❌ 登录失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testLogin();
