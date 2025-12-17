# 数据库连接问题排查指南

## 错误：fetch failed

这个错误通常表示无法连接到数据库。请按以下步骤排查：

### 1. 检查环境变量配置

**确认 `.env.local` 文件存在且格式正确**：

```bash
# 在项目根目录检查
cat .env.local
# 或 Windows PowerShell
Get-Content .env.local
```

**应该看到类似内容**：
```env
POSTGRES_URL=postgresql://postgres.xxxxx:密码@主机:端口/postgres
```

### 2. 检查连接字符串格式

**Supabase 连接字符串格式**：
- ✅ 正确：`postgresql://postgres.xxxxx:密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
- ✅ 正确：`postgresql://postgres.xxxxx:密码@db.xxxxx.supabase.co:5432/postgres`
- ❌ 错误：包含 `[YOUR-PASSWORD]` 占位符
- ❌ 错误：缺少协议前缀 `postgresql://`

### 3. 获取正确的 Supabase 连接字符串

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 点击 **Project Settings** → **Database**
4. 在 **Connection string** 部分：
   - 选择 **"URI"** 标签（不是 "Session pooler"）
   - 复制连接字符串
   - **重要**：如果显示 `[YOUR-PASSWORD]`，需要：
     - 在下方找到 "Database password"
     - 点击 "Reveal" 查看密码
     - 将连接字符串中的 `[YOUR-PASSWORD]` 替换为实际密码

### 4. 验证连接字符串

连接字符串应该：
- 以 `postgresql://` 开头
- 包含用户名（通常是 `postgres`）
- 包含密码（不是占位符）
- 包含主机地址
- 包含端口号（通常是 5432 或 6543）
- 包含数据库名（通常是 `postgres`）

**示例**：
```
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

替换后：
```
postgresql://postgres.abcdefghijklmnop:你的实际密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 5. 重启开发服务器

修改 `.env.local` 后，**必须重启开发服务器**：

```bash
# 停止服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### 6. 检查网络连接

- 确保能访问 Supabase 服务器
- 检查防火墙设置
- 如果在公司网络，可能需要配置代理

### 7. 测试连接

创建一个测试文件 `test-connection.js`：

```javascript
const postgres = require('postgres');

const sql = postgres(process.env.POSTGRES_URL, {
  ssl: 'require'
});

async function test() {
  try {
    const result = await sql`SELECT version()`;
    console.log('✅ 连接成功！', result);
    await sql.end();
  } catch (error) {
    console.error('❌ 连接失败：', error.message);
    process.exit(1);
  }
}

test();
```

运行：
```bash
node test-connection.js
```

### 8. 常见问题

**Q: 连接字符串中有特殊字符怎么办？**
A: 如果密码包含特殊字符（如 `@`, `:`, `/`），需要进行 URL 编码：
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`

**Q: 使用连接池 URL 还是直接连接？**
A: 
- **连接池 URL**（`pooler.supabase.com`）：适合生产环境，更稳定
- **直接连接**（`db.xxxxx.supabase.co`）：适合开发环境

**Q: 端口号应该用哪个？**
A:
- `5432`：直接连接端口
- `6543`：连接池端口（推荐）

### 9. 如果仍然失败

1. **检查 Supabase 项目状态**：
   - 确保项目没有被暂停
   - 检查数据库是否正常运行

2. **查看详细错误信息**：
   - 在浏览器控制台查看 Network 标签
   - 在服务器终端查看完整错误堆栈

3. **尝试使用 Supabase 的连接池 URL**：
   - 在 Supabase Dashboard → Database → Connection string
   - 选择 "Session pooler" 标签
   - 使用这个连接字符串（代码会自动识别）

4. **联系支持**：
   - 如果以上方法都不行，可能是 Supabase 服务问题
   - 检查 [Supabase Status](https://status.supabase.com/)

## 临时解决方案

如果暂时无法连接数据库，应用仍然可以正常工作：
- 数据会保存到浏览器的 `localStorage`
- 所有计算功能正常
- 只是数据不会持久化到服务器

等数据库配置好后，数据会自动同步。
