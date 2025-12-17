-- Supabase 表创建脚本
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本

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

-- 创建策略：允许所有人读取和写入（可以根据需要修改）
-- 允许插入
CREATE POLICY "Allow public insert" ON public.calculator_inputs
  FOR INSERT
  WITH CHECK (true);

-- 允许更新
CREATE POLICY "Allow public update" ON public.calculator_inputs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 允许读取
CREATE POLICY "Allow public select" ON public.calculator_inputs
  FOR SELECT
  USING (true);

-- 允许删除（可选）
CREATE POLICY "Allow public delete" ON public.calculator_inputs
  FOR DELETE
  USING (true);
