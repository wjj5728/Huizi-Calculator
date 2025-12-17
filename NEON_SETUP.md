# Neon 数据库配置指南

本项目使用 `@neondatabase/serverless` 客户端连接 Neon，这是 Neon 官方推荐的服务器端客户端，性能更好且更适合 Serverless 环境。

## 快速开始

### 步骤1: 创建 Neon 数据库

1. **注册/登录 Neon**：
   - 访问 [Neon Console](https://console.neon.tech/)
   - 登录或注册账户

2. **创建新项目**：
   - 点击 "Create a project"
   - 填写项目名称（如：`huizi-calculator`）
   - 选择区域（建议选择离你最近的）
   - 选择 PostgreSQL 版本（推荐 15 或 16）
   - 点击 "Create project"

3. **获取连接字符串**：
   - 项目创建后，会自动显示连接字符串
   - 或者在项目页面，点击 "Connection Details"
   - 复制 **"Connection string"**（推荐使用直接连接，不是 "Session pooler connection string"）
   - 格式类似：`postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`
   - **注意**：`@neondatabase/serverless` 会自动处理 SSL，但建议保留 `sslmode=require`

### 步骤2: 配置本地环境变量

1. **创建 `.env.local` 文件**：
   - 在项目根目录创建 `.env.local` 文件
   - 添加以下内容：
     ```env
     POSTGRES_URL=你的Neon连接字符串
     ```
   
   **示例**：
   ```env
   POSTGRES_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   **重要提示**：
   - 连接字符串通常已经包含 `?sslmode=require`，这是 Neon 要求的
   - 如果连接字符串不包含 `sslmode=require`，请手动添加

2. **验证连接字符串格式**：
   - 应该以 `postgresql://` 开头
   - 包含用户名、密码、主机、端口和数据库名
   - 包含 `sslmode=require` 参数

### 步骤3: 创建数据库表

数据库表会在首次使用 API 时自动创建。如果需要手动创建：

1. **在 Neon Console 执行 SQL**：
   - 在 Neon 项目页面，点击 "SQL Editor"
   - 点击 "New query"
   - 复制并执行以下 SQL 语句：

```sql
CREATE TABLE IF NOT EXISTS calculator_inputs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  total_people INTEGER NOT NULL,
  base_money INTEGER NOT NULL,
  bid_type VARCHAR(20) NOT NULL,
  first_bid INTEGER,
  bid_decrease INTEGER,
  custom_bids JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_session_id ON calculator_inputs(session_id);
CREATE INDEX IF NOT EXISTS idx_updated_at ON calculator_inputs(updated_at);
```

2. **或者让应用自动创建**：
   - 启动应用后，首次保存数据时会自动创建表

### 步骤4: 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
npm run dev
```

## 验证配置

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **打开浏览器访问** `http://localhost:3000`

3. **测试数据库连接**：
   - 使用计算器并点击"计算"按钮
   - 查看调试面板，应该能看到数据已保存

## Neon 特定功能

### 查看数据库中的数据

1. 在 Neon Console，点击 "SQL Editor"
2. 执行查询：
   ```sql
   SELECT * FROM calculator_inputs ORDER BY updated_at DESC;
   ```

### 使用连接池（可选）

Neon 提供连接池功能，适合生产环境：

1. 在项目页面，点击 "Connection Details"
2. 复制 **"Session pooler connection string"**
3. 在 `.env.local` 中使用这个连接字符串

**注意**：连接池 URL 格式不同，代码会自动识别。

### 数据库管理

- **备份**：Neon 自动提供时间点恢复（PITR）
- **监控**：在项目页面可以查看数据库使用情况
- **扩展**：可以根据需要扩展数据库

## 常见问题

### Q: 连接失败怎么办？

A: 检查：
1. 连接字符串是否正确（特别是密码部分）
2. 是否包含 `sslmode=require` 参数
3. 网络连接是否正常
4. Neon 项目是否正常运行

### Q: 应该使用直接连接还是连接池？

A:
- **开发环境**：使用直接连接（Connection string）
- **生产环境**：建议使用连接池（Session pooler connection string）

### Q: Neon 免费计划有什么限制？

A:
- 数据库大小：3 GB
- 项目数量：有限制
- 对于这个计算器项目，完全够用

### Q: 如何重置数据库密码？

A:
- 在 Neon Console，进入项目设置
- 找到 "Reset password" 选项
- 重置后需要更新 `.env.local` 中的连接字符串

## 优势

使用 Neon 的好处：
- ✅ 完全托管的 PostgreSQL
- ✅ 自动扩展和备份
- ✅ 免费计划足够使用
- ✅ 快速启动，无需配置
- ✅ 支持分支（Branching）功能
