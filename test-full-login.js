const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testFullLoginFlow() {
  try {
    console.log('完整登录流程测试\n');
    console.log('='.repeat(60));

    // 1. 获取验证码
    console.log('\n步骤1: 获取验证码');
    const captchaRes = await axios.get(`${API_BASE}/auth/captcha`);
    const { id: captchaId, code: captchaCode } = captchaRes.data;
    console.log(`验证码: ${captchaCode} (ID: ${captchaId})`);

    // 2. 登录
    console.log('\n步骤2: 执行登录');
    console.log('用户名: 韩冬');
    console.log('密码: 123456');

    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: '韩冬',
      password: '123456',
      captchaId,
      captchaCode
    });

    console.log('\n登录响应:');
    console.log('- 用户ID:', loginRes.data.user.id);
    console.log('- 用户名:', loginRes.data.user.username);
    console.log('- 姓名:', loginRes.data.user.name);
    console.log('- 角色:', loginRes.data.user.role);
    console.log('- 单位:', loginRes.data.user.unit);
    console.log('- 需要修改密码:', loginRes.data.user.mustChangePassword ? '✅ 是' : '❌ 否');
    console.log('- Token:', loginRes.data.token.substring(0, 20) + '...');

    // 3. 模拟前端：使用token调用/auth/me
    console.log('\n步骤3: 使用token获取用户信息 (模拟前端行为)');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginRes.data.token}`
      }
    });

    console.log('\n/auth/me 响应:');
    console.log('- 用户ID:', meRes.data.user.id);
    console.log('- 用户名:', meRes.data.user.username);
    console.log('- 姓名:', meRes.data.user.name);
    console.log('- 角色:', meRes.data.user.role);
    console.log('- 单位:', meRes.data.user.unit);
    console.log('- 需要修改密码:', meRes.data.user.mustChangePassword ? '✅ 是' : '❌ 否');

    // 4. 判断跳转
    console.log('\n步骤4: 判断跳转逻辑');
    if (meRes.data.user.mustChangePassword) {
      console.log('✅ 应该跳转到: /force-change-password');
    } else {
      console.log('❌ 应该跳转到: /dashboard');
    }

    console.log('\n' + '='.repeat(60));
    console.log('测试结论:');
    if (loginRes.data.user.mustChangePassword && meRes.data.user.mustChangePassword) {
      console.log('✅ 后端返回正确，应该会强制修改密码');
    } else {
      console.log('❌ 后端返回有问题，不会强制修改密码');
      console.log('\n问题分析:');
      console.log(`- 登录接口返回 mustChangePassword: ${loginRes.data.user.mustChangePassword}`);
      console.log(`- /auth/me接口返回 mustChangePassword: ${meRes.data.user.mustChangePassword}`);
    }

  } catch (error) {
    console.error('\n❌ 测试失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testFullLoginFlow();
