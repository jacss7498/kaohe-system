@echo off
chcp 65001 >nul
echo ========================================
echo 修复前端问题
echo ========================================
echo.

echo [1] 清除缓存...
cd frontend
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ 已清除 Vite 缓存
)
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ 已清除构建文件
)
echo.

echo [2] 重新安装依赖...
call npm install
echo.

echo [3] 检查 TypeScript 编译...
call npm run build
if %errorlevel% equ 0 (
    echo ✓ TypeScript 编译成功
) else (
    echo ✗ TypeScript 编译失败，请查看上面的错误信息
    pause
    exit /b 1
)
echo.

echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 现在可以运行: npm run dev
echo.
pause










