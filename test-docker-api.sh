#!/bin/bash

echo "=== 检查Docker容器状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== 测试宿主机端口 ==="
echo "测试后端健康检查 (3002端口):"
curl -s http://localhost:3002/api/health || echo "后端3002端口无响应"

echo -e "\n测试前端 (5173端口):"
curl -s -I http://localhost:5173 | head -n 1

echo -e "\n=== 测试验证码接口 ==="
echo "通过宿主机端口3002访问:"
curl -s http://localhost:3002/api/auth/captcha || echo "验证码接口无响应"

echo -e "\n通过前端Nginx代理访问 (5173端口):"
curl -s http://localhost:5173/api/auth/captcha || echo "Nginx代理无响应"

echo -e "\n=== 检查Docker网络连接 ==="
echo "从前端容器访问后端:"
docker exec kaohe-frontend wget -qO- http://backend:3001/api/health 2>&1 || echo "前端无法访问后端"

echo -e "\n=== 检查后端日志 (最后20行) ==="
docker logs --tail=20 kaohe-backend
