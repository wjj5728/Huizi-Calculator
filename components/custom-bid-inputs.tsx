'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';

interface CustomBidInputsProps {
  totalPeople: number;
  customBids: number[];
  onChange: (bids: number[]) => void;
}

function getPeriodDate(period: number): string {
  const startYear = 2025;
  const startMonth = 6;
  const y = startYear + Math.floor((startMonth - 1 + period - 1) / 12);
  const m = ((startMonth - 1 + period - 1) % 12) + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

export function CustomBidInputs({ totalPeople, customBids, onChange }: CustomBidInputsProps) {
  const handleChange = (index: number, value: string) => {
    const newBids = [...customBids];
    const numValue = value === '' ? 0 : parseInt(value, 10);
    newBids[index] = isNaN(numValue) ? 0 : numValue;
    onChange(newBids);
  };

  return (
    <div className="space-y-4">
      <p className="font-semibold">自定义每期利息：</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: totalPeople - 1 }, (_, i) => {
          const period = i + 2;
          const value = customBids[i] || 0;
          return (
            <div key={period} className="flex flex-col space-y-1">
              <Label htmlFor={`bid_${period}`} className="text-xs">
                {period}期<br />({getPeriodDate(period)})
              </Label>
              <Input
                id={`bid_${period}`}
                type="number"
                min="0"
                value={value || ''}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
