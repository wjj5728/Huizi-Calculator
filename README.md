# 闽南标会计算器

这是一个基于 Next.js 14、Shadcn UI 和 Vercel Postgres 构建的闽南标会（会子）计算器。

## 功能特性

- 🧮 计算标会的收益和支出
- 📊 支持固定利息递减和自定义利息两种竞标方式
- 💾 自动保存输入参数到数据库（Vercel Postgres）
- 📱 响应式设计，支持移动端
- 🎨 使用 Shadcn UI 构建的现代化界面

## 技术栈

- **框架**: Next.js 14 (App Router)
- **UI库**: Shadcn UI + Tailwind CSS
- **数据库**: Vercel Postgres
- **语言**: TypeScript

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

#### 使用 Neon（推荐）

1. **获取连接字符串**：
   - 登录 [Neon Console](https://console.neon.tech/)
   - 创建项目后，复制 "Connection string"
   - 确保连接字符串包含 `sslmode=require`

2. **配置本地环境变量**：
   - 在项目根目录创建 `.env.local` 文件
   - 添加：`POSTGRES_URL=你的Neon连接字符串`
   - 详细步骤请查看 `NEON_SETUP.md`

#### 使用 Supabase

1. **获取 API 密钥**：
   - 登录 [Supabase Dashboard](https://app.supabase.com/)
   - 选择项目 → Project Settings → API
   - 复制 Project URL 和 anon public key

2. **配置本地环境变量**：
   - 在项目根目录创建 `.env.local` 文件
   - 添加：
     ```env
     NEXT_PUBLIC_SUPABASE_URL=你的项目URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
     ```
   - 详细步骤请查看 `SUPABASE_SETUP.md`

#### 使用 Vercel Postgres

1. **选择或创建数据库**：
   - 进入项目 → Storage 标签
   - 创建新数据库或选择现有数据库
   - 详细指南请查看 `DATABASE_SELECTION_GUIDE.md`

2. **获取连接字符串**：
   - 点击数据库名称进入详情页
   - 点击 ".env.local" 标签
   - 复制 `POSTGRES_URL` 的值

3. **配置本地环境变量**：
   - 在项目根目录创建 `.env.local` 文件
   - 添加：`POSTGRES_URL=你的连接字符串`
   - 重启开发服务器

### 3. 初始化数据库表

数据库表会在首次使用 API 时自动创建。如果需要手动创建，可以运行：

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
```

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 连接 Vercel Postgres 数据库
4. 环境变量会自动配置

## 项目结构

```
├── app/
│   ├── api/              # API 路由
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 主页面
│   └── globals.css       # 全局样式
├── components/
│   ├── ui/               # Shadcn UI 组件
│   ├── calculator-form.tsx
│   ├── result-table.tsx
│   └── custom-bid-inputs.tsx
├── lib/
│   ├── calculate.ts      # 计算逻辑
│   ├── db.ts             # 数据库操作
│   ├── types.ts          # 类型定义
│   ├── session.ts        # 会话管理
│   └── utils.ts          # 工具函数
└── ...
```

## 使用说明

1. 设置参与人数和每期会金
2. 选择竞标方式：
   - **固定利息递减**：设置首期利息和每期递减金额
   - **自定义利息**：为每期设置自定义利息（留空会自动预测）
3. 点击"计算"按钮查看结果
4. 输入参数会自动保存到数据库和本地存储

## 许可证

MIT
