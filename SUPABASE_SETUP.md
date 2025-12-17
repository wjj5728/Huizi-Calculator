# Supabase 数据库配置指南

## 快速开始

### 步骤1: 获取 Supabase 连接字符串

1. **登录 Supabase**：
   - 访问 [Supabase Dashboard](https://app.supabase.com/)
   - 登录你的账户

2. **选择或创建项目**：
   - 如果已有项目，直接选择
   - 如果没有，点击 "New Project" 创建新项目
     - 填写项目名称（如：`huizi-calculator`）
     - 设置数据库密码（**重要：请记住这个密码**）
     - 选择区域（建议选择离你最近的）
     - 等待项目创建完成（约2分钟）

3. **获取连接字符串**：
   - 在项目页面，点击左侧菜单 "Project Settings"（项目设置，齿轮图标）
   - 点击 "Database" 标签
   - 滚动到 "Connection string" 部分
   - **重要**：选择 **"URI"** 标签（直接连接，不是 "Session pooler"）
   - 复制连接字符串
   - **重要**：连接字符串中可能包含 `[YOUR-PASSWORD]`，需要替换为实际密码
   - **格式示例**：`postgresql://postgres.xxxxx:密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
   - **注意**：如果连接字符串包含 `pooler.supabase.com`，代码会自动使用 Vercel Postgres 客户端；否则使用标准 PostgreSQL 客户端

4. **获取数据库密码**（如果需要）：
   - 在 "Database" 页面，如果连接字符串中有 `[YOUR-PASSWORD]`
   - 在 "Connection string" 下方找到 "Database password"
   - 点击 "Reveal" 或 "Reset" 查看密码
   - 将连接字符串中的 `[YOUR-PASSWORD]` 替换为实际密码

### 步骤2: 配置本地环境变量

1. **创建 `.env.local` 文件**：
   - 在项目根目录创建 `.env.local` 文件
   - 添加以下内容：
     ```env
     POSTGRES_URL=你的完整连接字符串
     ```
   
   **示例**：
   ```env
   POSTGRES_URL=postgresql://postgres.xxxxxxxxxxxxx:你的密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

2. **验证连接字符串格式**：
   - 应该以 `postgresql://` 开头
   - 包含用户名、密码、主机、端口和数据库名
   - 完整格式：`postgresql://用户名:密码@主机:端口/数据库名`

### 步骤3: 创建数据库表

**重要**：Supabase 需要手动创建表并配置权限。

1. **在 Supabase 控制台执行 SQL**：
   - 在 Supabase 项目页面，点击左侧菜单 **"SQL Editor"**
   - 点击 **"New query"**
   - 复制 `supabase-table-setup.sql` 文件中的**全部内容**（或直接复制下面的 SQL）
   - 粘贴到 SQL Editor 中
   - 点击 **"Run"** 执行

**完整的 SQL 脚本**：

```sql
-- 创建表
CREATE TABLE IF NOT EXISTS public.calculator_inputs (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  total_people INTEGER NOT NULL,
  base_money INTEGER NOT NULL,
  bid_type VARCHAR(20) NOT NULL,
  first_bid INTEGER,
  bid_decrease INTEGER,
  custom_bids JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_calculator_inputs_session_id ON public.calculator_inputs(session_id);
CREATE INDEX IF NOT EXISTS idx_calculator_inputs_updated_at ON public.calculator_inputs(updated_at);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.calculator_inputs ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取和写入
CREATE POLICY "Allow public insert" ON public.calculator_inputs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.calculator_inputs
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public select" ON public.calculator_inputs
  FOR SELECT USING (true);

CREATE POLICY "Allow public delete" ON public.calculator_inputs
  FOR DELETE USING (true);
```

2. **验证表已创建**：
   - 执行 SQL 后，点击左侧菜单 **"Table Editor"**
   - 应该能看到 `calculator_inputs` 表
   - 如果看不到，刷新页面

**重要提示**：
- 必须执行**完整的 SQL 脚本**，包括 RLS 策略
- 如果只创建表而不配置 RLS 策略，会出现权限错误

### 步骤4: 验证配置

1. **重启开发服务器**：
   ```bash
   npm run dev
   ```

2. **测试数据库连接**：
   - 打开浏览器访问 `http://localhost:3000`
   - 使用计算器并点击"计算"按钮
   - 查看调试面板，应该能看到数据已保存

## Supabase 特定功能

### 查看数据库中的数据

1. 在 Supabase 项目页面
2. 点击左侧菜单 "Table Editor"
3. 选择 `calculator_inputs` 表
4. 可以查看、编辑、删除数据

### 使用 SQL Editor

1. 点击左侧菜单 "SQL Editor"
2. 可以执行 SQL 查询，例如：
   ```sql
   SELECT * FROM calculator_inputs ORDER BY updated_at DESC;
   ```

### 数据库管理

- **备份**：在 "Database" → "Backups" 可以创建和恢复备份
- **连接池**：Supabase 提供连接池功能，适合生产环境
- **监控**：在 "Database" 页面可以查看数据库使用情况

## 常见问题

### Q: 连接字符串中的密码在哪里？

A: 
- 如果是新创建的项目，密码是创建项目时设置的
- 如果忘记了，可以在 "Database" → "Connection string" 下方点击 "Reset database password"
- 重置后需要更新 `.env.local` 中的连接字符串

### Q: 应该使用 "URI" 还是 "Session pooler"？

A: 
- **开发环境**：使用 "URI"（直接连接）
- **生产环境**：可以使用 "Session pooler"（连接池，更稳定）

### Q: Supabase 免费计划有什么限制？

A:
- 数据库大小：500 MB
- API 请求：每月 50,000 次
- 带宽：5 GB/月
- 对于这个计算器项目，完全够用

### Q: 如何查看数据库使用情况？

A:
- 在 Supabase 项目首页可以看到数据库大小
- 在 "Database" → "Usage" 可以查看详细使用统计

### Q: 连接失败怎么办？

A:
1. 检查连接字符串是否正确（特别是密码部分）
2. 确认 `.env.local` 文件在项目根目录
3. 确认已重启开发服务器
4. 检查 Supabase 项目是否正常运行
5. 查看浏览器控制台和服务器日志的错误信息

## 安全提示

⚠️ **重要**：
- `.env.local` 文件已添加到 `.gitignore`，不会被提交到 Git
- **不要**将连接字符串提交到代码仓库
- 如果密码泄露，立即在 Supabase 重置密码
- 生产环境建议使用环境变量，而不是硬编码
