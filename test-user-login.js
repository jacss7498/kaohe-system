const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testUserLogin() {
  try {
    console.log('测试韩冬账号登录...\n');

    // 1. 获取验证码
    console.log('1. 获取验证码...');
    const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
    const { id: captchaId, code: captchaCode } = captchaRes.data;
    console.log(`验证码: ${captchaCode} (ID: ${captchaId})`);

    // 2. 尝试用韩冬账号登录
    console.log('\n2. 尝试登录韩冬账号...');
    console.log('用户名: 韩冬');
    console.log('密码: 15339906679');

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: '韩冬',
      password: '15339906679',
      captchaId,
      captchaCode
    });

    console.log('\n✅ 登录成功!');
    console.log('响应:', JSON.stringify(loginRes.data, null, 2));

  } catch (error) {
    console.error('\n❌ 登录失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }

    // 尝试其他可能的用户名
    console.log('\n尝试使用不同的用户名格式...');
    const usernames = ['handong', 'hd', '韩冬'];

    for (const username of usernames) {
      try {
        const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
        const { id: captchaId, code: captchaCode } = captchaRes.data;

        console.log(`\n测试用户名: ${username}`);
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
          username: username,
          password: '15339906679',
          captchaId,
          captchaCode
        });

        console.log(`✅ 成功! 正确的用户名是: ${username}`);
        console.log('用户信息:', loginRes.data.user);
        break;
      } catch (e) {
        console.log(`❌ ${username} 失败: ${e.response?.data || e.message}`);
      }
    }
  }
}

testUserLogin();
