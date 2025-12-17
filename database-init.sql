-- 初始化数据库表结构
-- 在 Vercel Postgres 控制台的 SQL 编辑器中运行此脚本

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
