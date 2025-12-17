'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SessionSelectorProps {
  sessionId: string;
  onSessionIdChange: (id: string) => void;
}

export function SessionSelector({ sessionId, onSessionIdChange }: SessionSelectorProps) {
  const [availableIds, setAvailableIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(sessionId);
  const [mode, setMode] = useState<'select' | 'input'>('select');

  // 加载所有可用的 session ID
  const loadAvailableIds = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/list-ids');
      const result = await response.json();
      if (result.success && result.ids) {
        setAvailableIds(result.ids);
        // 如果当前ID不在列表中且不是默认ID，切换到输入模式
        if (result.ids.length > 0 && sessionId !== 'default' && !result.ids.includes(sessionId)) {
          setMode('input');
        }
      }
    } catch (error) {
      console.error('Failed to load session IDs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableIds();
  }, []);

  useEffect(() => {
    setInputValue(sessionId);
  }, [sessionId]);

  const handleSelectChange = (value: string) => {
    if (value === 'new') {
      setMode('input');
      const newId = `user_${Date.now()}`;
      setInputValue(newId);
      onSessionIdChange(newId);
    } else {
      onSessionIdChange(value);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (value.trim()) {
      onSessionIdChange(value.trim());
    }
  };

  const handleConfirmInput = () => {
    if (inputValue.trim()) {
      onSessionIdChange(inputValue.trim());
      setMode('select');
      loadAvailableIds(); // 刷新列表
    }
  };

  return (
    <div className="space-y-2">
      <Label>存储ID（用于跨设备同步）</Label>
      {mode === 'select' ? (
        <div className="flex gap-2">
          <Select value={sessionId} onValueChange={handleSelectChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="选择或创建ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">单用户模式 (default)</SelectItem>
              {availableIds.filter(id => id !== 'default').map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
              <SelectItem value="new">+ 创建新ID</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMode('input');
              setInputValue(sessionId);
            }}
          >
            手动输入
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="输入存储ID（如：user001）"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleConfirmInput}
            disabled={!inputValue.trim()}
          >
            确认
          </Button>
          {availableIds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMode('select');
                loadAvailableIds();
              }}
            >
              选择已有
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        使用相同的ID可以在不同设备/浏览器间同步数据
      </p>
    </div>
  );
}
