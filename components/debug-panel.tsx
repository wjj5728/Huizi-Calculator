'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StoredData {
  id: number;
  session_id: string;
  total_people: number;
  base_money: number;
  bid_type: string;
  first_bid: number | null;
  bid_decrease: number | null;
  custom_bids: any;
  created_at: string;
  updated_at: string;
}

export function DebugPanel() {
  const [data, setData] = useState<StoredData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/list');
      const result = await response.json();
      console.log('Debug panel fetch result:', result); // 调试日志
      if (result.success) {
        setData(result.data || []);
      } else {
        setError(result.message || result.error || '获取数据失败');
        // 即使失败也显示详细信息
        if (result.details) {
          console.error('API error details:', result.details);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('Debug panel fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 监听数据保存事件
    const handleDataSaved = () => {
      fetchData();
    };
    
    window.addEventListener('dataSaved', handleDataSaved);
    
    return () => {
      window.removeEventListener('dataSaved', handleDataSaved);
    };
  }, []);

  return (
    <Card className="border-yellow-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-yellow-600">🔧 开发模式 - 数据库调试面板</CardTitle>
          <Button onClick={fetchData} disabled={loading} size="sm">
            {loading ? '加载中...' : '刷新数据'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <strong>错误：</strong> {error}
            <div className="mt-2 text-xs">
              提示：请确保已配置 POSTGRES_URL 环境变量
            </div>
          </div>
        )}
        
        {!error && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              共找到 <strong>{data.length}</strong> 条记录
            </div>
            
            {data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无数据。请先使用计算器并保存数据。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>会话ID</TableHead>
                      <TableHead>人数</TableHead>
                      <TableHead>会金</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>首期利息</TableHead>
                      <TableHead>递减</TableHead>
                      <TableHead>更新时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.session_id.substring(0, 20)}...
                        </TableCell>
                        <TableCell>{item.total_people}</TableCell>
                        <TableCell>{item.base_money.toLocaleString()}</TableCell>
                        <TableCell>{item.bid_type === 'fixed' ? '固定' : '自定义'}</TableCell>
                        <TableCell>{item.first_bid ?? '-'}</TableCell>
                        <TableCell>{item.bid_decrease ?? '-'}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(item.updated_at).toLocaleString('zh-CN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
