'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomBidInputs } from '@/components/custom-bid-inputs';
import { SessionSelector } from '@/components/session-selector';
import { CalculatorInputs, BidType, CalculationResult } from '@/lib/types';
import { calculate } from '@/lib/calculate';

interface CalculatorFormProps {
  onCalculate: (results: CalculationResult[], inputs: CalculatorInputs) => void;
}

export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    totalPeople: 36,
    baseMoney: 3000,
    bidType: 'fixed',
    firstBid: 300,
    bidDecrease: 20,
    customBids: [],
  });

  const [customBids, setCustomBids] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<string>('default'); // 默认使用 'default' ID（单用户模式）

  // 从数据库加载数据
  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!sessionId || sessionId.trim() === '') return;

      try {
        const response = await fetch(`/api/load?sessionId=${encodeURIComponent(sessionId)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.inputs) {
            setInputs(data.inputs);
            if (data.inputs.customBids && Array.isArray(data.inputs.customBids)) {
              setCustomBids(data.inputs.customBids);
            } else if (data.inputs.bidType === 'custom') {
              // 如果没有customBids但类型是custom，初始化数组
              setCustomBids(Array(data.inputs.totalPeople - 1).fill(0));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load from database', error);
      }
    };

    loadFromDatabase();
  }, [sessionId]);

  // 保存到数据库
  const saveInputs = async (newInputs: CalculatorInputs) => {
    const toSave = {
      ...newInputs,
      customBids: newInputs.bidType === 'custom' ? customBids : undefined,
    };
    
    // 保存到数据库
    try {
      if (sessionId && sessionId.trim() !== '') {
        const response = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, inputs: toSave }),
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 触发自定义事件，通知调试面板刷新
            window.dispatchEvent(new CustomEvent('dataSaved'));
          } else {
            console.warn('Database save failed:', result.message);
            // 即使数据库保存失败，也触发事件（可能只是配置问题）
            window.dispatchEvent(new CustomEvent('dataSaved'));
          }
        }
      }
    } catch (error) {
      console.error('Failed to save to database', error);
    }
  };

  const handleCalculate = () => {
    const inputsToUse: CalculatorInputs = {
      ...inputs,
      customBids: inputs.bidType === 'custom' ? customBids : undefined,
    };
    const results = calculate(inputsToUse);
    onCalculate(results, inputsToUse);
  };

  const handleSave = () => {
    const inputsToSave: CalculatorInputs = {
      ...inputs,
      customBids: inputs.bidType === 'custom' ? customBids : undefined,
    };
    saveInputs(inputsToSave);
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    
    // 如果是切换竞标方式或改变人数，需要重新初始化自定义利息数组
    if (field === 'bidType' && value === 'custom') {
      const newBids = Array(inputs.totalPeople - 1).fill(0);
      setCustomBids(newBids);
    } else if (field === 'totalPeople' && inputs.bidType === 'custom') {
      const newBids = Array(value - 1).fill(0);
      // 保留原有的值
      for (let i = 0; i < Math.min(newBids.length, customBids.length); i++) {
        newBids[i] = customBids[i];
      }
      setCustomBids(newBids);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>参数设置</CardTitle>
        <CardDescription>
          规则说明：已得标者每期需缴纳固定会金+自己得标时的利息，未得标者只需缴纳固定会金
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SessionSelector sessionId={sessionId} onSessionIdChange={setSessionId} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalPeople">参与人数</Label>
            <Input
              id="totalPeople"
              type="number"
              min="2"
              value={inputs.totalPeople}
              onChange={(e) => handleInputChange('totalPeople', parseInt(e.target.value, 10))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseMoney">每期会金（元）</Label>
            <Input
              id="baseMoney"
              type="number"
              min="100"
              value={inputs.baseMoney}
              onChange={(e) => handleInputChange('baseMoney', parseInt(e.target.value, 10))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidType">竞标方式</Label>
            <Select
              value={inputs.bidType}
              onValueChange={(value) => handleInputChange('bidType', value as BidType)}
            >
              <SelectTrigger id="bidType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">固定利息递减</SelectItem>
                <SelectItem value="custom">自定义利息</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inputs.bidType === 'fixed' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="firstBid">首期利息（元）</Label>
                <Input
                  id="firstBid"
                  type="number"
                  min="0"
                  value={inputs.firstBid || 0}
                  onChange={(e) => handleInputChange('firstBid', parseInt(e.target.value, 10))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bidDecrease">每期递减（元）</Label>
                <Input
                  id="bidDecrease"
                  type="number"
                  min="0"
                  value={inputs.bidDecrease || 0}
                  onChange={(e) => handleInputChange('bidDecrease', parseInt(e.target.value, 10))}
                />
              </div>
            </>
          )}
        </div>

        {inputs.bidType === 'custom' && (
          <CustomBidInputs
            totalPeople={inputs.totalPeople}
            customBids={customBids}
            onChange={setCustomBids}
          />
        )}
      
        <div className="flex flex-col md:flex-row gap-2">
          <Button onClick={handleCalculate} className="w-full md:w-auto">
            计算
          </Button>
          <Button variant="outline" onClick={handleSave} className="w-full md:w-auto">
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
