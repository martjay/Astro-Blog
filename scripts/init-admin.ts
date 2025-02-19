import { auth } from '../src/lib/auth';

// 替换为你想要的用户名和密码
const username = 'admin';
const password = 'your-secure-password';

try {
  auth.createAdmin(username, password);
  console.log('管理员账户创建成功！');
} catch (error) {
  console.error('创建管理员账户失败:', error);
} 