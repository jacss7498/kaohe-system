@echo off
chcp 65001 >nul
echo ========================================
echo 项目诊断工具
echo ========================================
echo.

echo [1] 检查后端服务...
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 后端服务运行正常
) else (
    echo ✗ 后端服务未启动或无法连接
    echo   请运行: npm run dev:backend
)
echo.

echo [2] 检查前端服务...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ 前端服务运行正常
) else (
    echo ✗ 前端服务未启动或无法连接
    echo   请运行: npm run dev:frontend
)
echo.

echo [3] 检查端口占用...
netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo ✓ 端口3001已被占用（后端可能正在运行）
) else (
    echo ✗ 端口3001未被占用（后端可能未启动）
)

netstat -ano | findstr ":5173" >nul
if %errorlevel% equ 0 (
    echo ✓ 端口5173已被占用（前端可能正在运行）
) else (
    echo ✗ 端口5173未被占用（前端可能未启动）
)
echo.

echo [4] 检查依赖安装...
if exist "backend\node_modules" (
    echo ✓ 后端依赖已安装
) else (
    echo ✗ 后端依赖未安装，请运行: cd backend ^&^& npm install
)

if exist "frontend\node_modules" (
    echo ✓ 前端依赖已安装
) else (
    echo ✗ 前端依赖未安装，请运行: cd frontend ^&^& npm install
)
echo.

echo ========================================
echo 诊断完成
echo ========================================
echo.
echo 如果服务未启动，请：
echo 1. 打开两个终端窗口
echo 2. 第一个运行: npm run dev:backend
echo 3. 第二个运行: npm run dev:frontend
echo 4. 然后访问: http://localhost:5173
echo.
pause










