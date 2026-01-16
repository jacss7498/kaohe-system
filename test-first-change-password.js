const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testCorrectPassword() {
  try {
    console.log('使用正确的密码测试韩冬账号登录...\n');

    // 获取验证码
    const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
    const { id: captchaId, code: captchaCode } = captchaRes.data;
    console.log(`验证码: ${captchaCode}`);

    // 使用正确的密码登录
    console.log('\n尝试登录:');
    console.log('用户名: 韩冬');
    console.log('密码: 123456');

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: '韩冬',
      password: '123456',
      captchaId,
      captchaCode
    });

    console.log('\n✅ 登录成功!');
    console.log('用户信息:', loginRes.data.user);
    console.log('必须修改密码:', loginRes.data.user.mustChangePassword);

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

testCorrectPassword();
