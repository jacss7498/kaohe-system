#!/bin/bash
# 重新构建并启动后端容器

echo "=== 停止后端容器 ==="
docker compose stop backend

echo -e "\n=== 重新构建后端容器 ==="
docker compose build --no-cache backend

echo -e "\n=== 启动后端容器 ==="
docker compose up -d backend

echo -e "\n=== 等待5秒让服务启动 ==="
sleep 5

echo -e "\n=== 检查容器状态 ==="
docker ps | grep kaohe

echo -e "\n=== 测试健康检查 ==="
curl -s http://localhost:3002/api/health

echo -e "\n=== 测试验证码接口 ==="
curl -s http://localhost:3002/api/auth/captcha

echo -e "\n=== 查看后端日志 ==="
docker logs --tail=20 kaohe-backend
