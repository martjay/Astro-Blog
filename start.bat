@echo off
chcp 65001
title 博客系统启动脚本

echo =================================
echo 博客系统启动脚本
echo =================================

:MENU
echo.
echo 请选择操作：
echo [1] 启动开发服务器
echo [2] 查看数据库 (命令行)
echo [3] 查看数据库 (Web界面)
echo [4] 退出
echo.
set /p choice=请输入选项（1-4）: 

if "%choice%"=="1" goto START_SERVER
if "%choice%"=="2" goto VIEW_DATABASE_CLI
if "%choice%"=="3" goto VIEW_DATABASE_WEB
if "%choice%"=="4" goto END
goto MENU

:CHECK_NODE
echo 正在检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

:KILL_NODE
echo 正在检查并结束已有的 Node 进程...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% neq 0 (
    echo 没有发现运行中的 Node 进程
) else (
    echo Node 进程已终止
)

:CHECK_DATA_DIR
echo 正在检查数据目录...
if not exist "data" (
    mkdir data
    if %errorlevel% neq 0 (
        echo [错误] 创建数据目录失败
        pause
        exit /b 1
    )
    echo 创建数据目录成功
) else (
    echo 数据目录检查完成
)

:CHECK_DEPS
echo 正在检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo 依赖安装完成
) else (
    echo 依赖检查完成
)

:INIT_ADMIN
echo 正在检查脚本目录...
if not exist "scripts" (
    mkdir scripts
    if %errorlevel% neq 0 (
        echo [错误] 创建脚本目录失败
        pause
        exit /b 1
    )
    echo 创建脚本目录成功
) else (
    echo 脚本目录检查完成
)

echo 正在检查初始化脚本...
if not exist "scripts\init-admin.js" (
    echo 正在创建初始化脚本...
    echo import { auth } from '../src/lib/auth.js'; > scripts\init-admin.js
    echo. >> scripts\init-admin.js
    echo const defaultAdmin = { >> scripts\init-admin.js
    echo     username: 'admin', >> scripts\init-admin.js
    echo     password: 'admin123' >> scripts\init-admin.js
    echo }; >> scripts\init-admin.js
    echo. >> scripts\init-admin.js
    echo try { >> scripts\init-admin.js
    echo     auth.createAdmin(defaultAdmin.username, defaultAdmin.password^); >> scripts\init-admin.js
    echo     console.log('管理员账户创建成功！'^); >> scripts\init-admin.js
    echo     console.log(`用户名: ${defaultAdmin.username}`^); >> scripts\init-admin.js
    echo     console.log(`密码: ${defaultAdmin.password}`^); >> scripts\init-admin.js
    echo } catch (error^) { >> scripts\init-admin.js
    echo     if (error.message.includes('UNIQUE constraint failed'^)^) { >> scripts\init-admin.js
    echo         console.log('管理员账户已存在，跳过创建'^); >> scripts\init-admin.js
    echo     } else { >> scripts\init-admin.js
    echo         console.error('创建管理员账户失败:', error^); >> scripts\init-admin.js
    echo         process.exit(1^); >> scripts\init-admin.js
    echo     } >> scripts\init-admin.js
    echo } >> scripts\init-admin.js
)

echo 正在初始化管理员账户...
call node scripts/init-admin.js
if %errorlevel% neq 0 (
    echo [错误] 管理员账户初始化失败
    pause
    exit /b 1
)
echo 管理员账户初始化完成

:START_SERVER
echo =================================
echo 正在启动开发服务器...
echo 服务器启动后请访问: http://localhost:4321
echo 按 Ctrl+C 可以停止服务器
echo =================================
set BROWSER=none
call npm run dev
goto MENU

:VIEW_DATABASE_CLI
echo =================================
echo 数据库命令行工具
echo =================================
echo 可用的命令：
echo .tables    - 显示所有表
echo .schema    - 显示表结构
echo .quit      - 退出数据库
echo.
echo 示例查询：
echo SELECT * FROM admins;
echo SELECT * FROM comments;
echo SELECT * FROM settings;
echo.
sqlite3 data/blog.db
goto MENU

:VIEW_DATABASE_WEB
echo =================================
echo 正在启动数据库Web界面...
echo =================================
echo 请先登录后访问：http://localhost:4321/admin/database
echo 按 Ctrl+C 可以停止服务器
echo =================================
set BROWSER=none
call npm run dev
goto MENU

:END
echo 感谢使用，再见！
exit /b 0 