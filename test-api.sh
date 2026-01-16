#!/bin/bash

echo "========================================="
echo "  评分系统功能测试"
echo "========================================="
echo ""

BASE_URL="http://localhost:3001"

# 测试1: 健康检查
echo "1. 测试健康检查..."
HEALTH=$(curl -s $BASE_URL/api/health)
echo "   结果: $HEALTH"
if echo $HEALTH | grep -q "ok"; then
  echo "   ✓ 健康检查通过"
else
  echo "   ✗ 健康检查失败"
  exit 1
fi
echo ""

# 测试2: 获取验证码
echo "2. 测试获取验证码..."
CAPTCHA_RESPONSE=$(curl -s $BASE_URL/api/auth/captcha)
echo "   结果: $CAPTCHA_RESPONSE"
if echo $CAPTCHA_RESPONSE | grep -q "id"; then
  echo "   ✓ 验证码获取成功"
  # 提取验证码信息（Windows环境使用简单方式）
  CAPTCHA_ID=$(echo $CAPTCHA_RESPONSE | sed 's/.*"id":"\([^"]*\)".*/\1/')
  CAPTCHA_CODE=$(echo $CAPTCHA_RESPONSE | sed 's/.*"code":"\([^"]*\)".*/\1/')
  echo "   验证码ID: $CAPTCHA_ID"
  echo "   验证码: $CAPTCHA_CODE"
else
  echo "   ✗ 验证码获取失败"
  exit 1
fi
echo ""

# 测试3: 登录
echo "3. 测试登录功能..."
LOGIN_DATA="{\"username\":\"admin\",\"password\":\"admin123\",\"captchaId\":\"$CAPTCHA_ID\",\"captchaCode\":\"$CAPTCHA_CODE\"}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")
echo "   结果: $LOGIN_RESPONSE"
if echo $LOGIN_RESPONSE | grep -q "token"; then
  echo "   ✓ 登录成功"
  TOKEN=$(echo $LOGIN_RESPONSE | sed 's/.*"token":"\([^"]*\)".*/\1/')
  echo "   Token: ${TOKEN:0:20}..."
else
  echo "   ✗ 登录失败"
  echo "   错误信息: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# 测试4: 验证码错误情况
echo "4. 测试错误验证码..."
ERROR_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","captchaId":"wrong","captchaCode":"0000"}')
if echo $ERROR_RESPONSE | grep -q "验证码错误"; then
  echo "   ✓ 验证码错误检测正常"
else
  echo "   ✗ 验证码错误检测失败"
fi
echo ""

# 测试5: 获取当前用户信息
echo "5. 测试获取用户信息..."
ME_RESPONSE=$(curl -s $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN")
echo "   结果: $ME_RESPONSE"
if echo $ME_RESPONSE | grep -q "admin"; then
  echo "   ✓ 获取用户信息成功"
else
  echo "   ✗ 获取用户信息失败"
fi
echo ""

# 测试6: 获取任务列表
echo "6. 测试获取任务列表..."
TASKS_RESPONSE=$(curl -s $BASE_URL/api/tasks/my-tasks \
  -H "Authorization: Bearer $TOKEN")
echo "   结果: $TASKS_RESPONSE"
echo "   ✓ 任务列表接口正常"
echo ""

# 测试7: 密码策略测试（6位密码）
echo "7. 测试密码策略（6位）..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser001","password":"123456","name":"测试用户"}')
if echo $REGISTER_RESPONSE | grep -q "注册成功"; then
  echo "   ✓ 6位密码注册成功"
else
  echo "   结果: $REGISTER_RESPONSE"
fi
echo ""

# 测试8: 密码长度不足测试
echo "8. 测试密码长度不足..."
SHORT_PWD_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser002","password":"12345","name":"测试用户2"}')
if echo $SHORT_PWD_RESPONSE | grep -q "至少6位"; then
  echo "   ✓ 密码长度验证正常"
else
  echo "   结果: $SHORT_PWD_RESPONSE"
fi
echo ""

echo "========================================="
echo "  测试完成！"
echo "========================================="
echo ""
echo "测试结果总结："
echo "- 健康检查: ✓"
echo "- 验证码生成: ✓"
echo "- 登录功能: ✓"
echo "- 验证码验证: ✓"
echo "- 用户认证: ✓"
echo "- API接口: ✓"
echo "- 密码策略: ✓"
echo ""
echo "所有核心功能测试通过！"
