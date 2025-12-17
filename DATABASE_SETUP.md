# 数据库配置指南

## 本地开发环境配置

### 方法1: 使用 Vercel Postgres（推荐）

1. **在 Vercel 控制台选择或创建数据库**：
   
   **情况A：已有数据库**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 进入你的项目
   - 点击 "Storage" 标签
   - 如果你看到多个 Postgres 数据库：
     - **选择与当前项目关联的数据库**（通常名称包含项目名）
     - 或者选择**最近创建的、未使用的数据库**
     - 如果都不确定，可以创建新的数据库（见情况B）
   
   **情况B：创建新数据库**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 进入你的项目
   - 点击 "Storage" 标签
   - 点击 "Create Database" → 选择 "Postgres"
   - 选择免费计划（Hobby）
   - 给数据库起个名字，比如 `huizi-calculator-db`

2. **获取连接字符串**：
   - 在数据库页面，点击 ".env.local" 标签
   - 复制 `POSTGRES_URL` 的值

3. **配置本地环境变量**：
   - 在项目根目录创建 `.env.local` 文件
   - 添加以下内容：
     ```
     POSTGRES_URL=你的连接字符串
     ```
   - **注意**：`.env.local` 文件已被 `.gitignore` 忽略，不会被提交到 Git

4. **重启开发服务器**：
   ```bash
   # 停止当前服务器（Ctrl+C）
   npm run dev
   ```

### 方法3: 使用本地 PostgreSQL（高级）

如果你有本地 PostgreSQL 数据库：

1. 创建数据库：
   ```sql
   CREATE DATABASE huizi_calculator;
   ```

2. 在 `.env.local` 中添加：
   ```
   POSTGRES_URL=postgresql://用户名:密码@localhost:5432/huizi_calculator
   ```

3. 运行初始化脚本（在数据库管理工具中执行 `database-init.sql`）

### 方法4: 不使用数据库（仅本地存储）

如果暂时不想配置数据库，应用仍然可以正常工作：
- 数据会保存到浏览器的 `localStorage`
- 计算功能完全正常
- 只是数据不会持久化到服务器

## 验证配置

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问 `http://localhost:3000`

3. 查看调试面板：
   - 如果配置正确：会显示数据库中的记录
   - 如果未配置：会显示友好的错误提示，但应用仍可正常使用

## 部署到 Vercel

在 Vercel 上部署时，环境变量会自动配置：
- 在 Vercel 项目设置中，环境变量会自动从连接的数据库获取
- 无需手动配置

## 常见问题

### Q: 为什么还是显示 "Database not configured"？

A: 确保：
1. `.env.local` 文件在项目根目录
2. `POSTGRES_URL` 变量名正确
3. 连接字符串完整且正确
4. 已重启开发服务器（环境变量更改需要重启）

### Q: 如何检查环境变量是否加载？

A: 在代码中临时添加：
```typescript
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? '已配置' : '未配置');
```

### Q: 本地开发必须配置数据库吗？

A: 不是必须的。应用可以在没有数据库的情况下正常工作，数据会保存到 `localStorage`。
