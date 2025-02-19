import { auth } from '../src/lib/auth.js';

// 默认管理员账户信息
const defaultAdmin = {
    username: 'admin',
    password: 'admin123'
};

try {
    auth.createAdmin(defaultAdmin.username, defaultAdmin.password);
    console.log('管理员账户创建成功！');
    console.log(`用户名: ${defaultAdmin.username}`);
    console.log(`密码: ${defaultAdmin.password}`);
} catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
        console.log('管理员账户已存在，跳过创建');
    } else {
        console.error('创建管理员账户失败:', error);
        process.exit(1);
    }
} 