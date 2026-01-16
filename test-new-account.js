const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testNewAccount() {
  try {
    console.log('测试韩冬新账号登录...\n');

    // 获取验证码
    const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
    const { id: captchaId, code: captchaCode } = captchaRes.data;
    console.log(`验证码: ${captchaCode}`);

    // 使用新的账号密码登录
    console.log('\n登录信息:');
    console.log('用户名: 韩冬');
    console.log('密码: 123456');

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: '韩冬',
      password: '123456',
      captchaId,
      captchaCode
    });

    console.log('\n✅ 登录成功!');
    console.log('用户信息:', JSON.stringify(loginRes.data.user, null, 2));
    console.log('\n是否需要修改密码:', loginRes.data.user.mustChangePassword ? '是 ✓' : '否');

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

testNewAccount();
