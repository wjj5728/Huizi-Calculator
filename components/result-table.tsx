'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalculationResult } from '@/lib/types';
import { getCurrentTotalPay } from '@/lib/calculate';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResultTableProps {
  results: CalculationResult[];
  totalPeople: number;
  baseMoney: number;
}

export function ResultTable({ results, totalPeople, baseMoney }: ResultTableProps) {
  const [highlightedPeriod, setHighlightedPeriod] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">得标期数</TableHead>
            <TableHead className="text-center">时间</TableHead>
            <TableHead className="text-center">竞标利息</TableHead>
            <TableHead className="text-center">当期收款</TableHead>
            <TableHead className="text-center">实收金额</TableHead>
            <TableHead className="text-center">累计缴纳</TableHead>
            <TableHead className="text-center">净收益</TableHead>
            <TableHead className="text-center">收益率</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((item) => {
            const currentTotalPay = getCurrentTotalPay(results, item.period, totalPeople, baseMoney);
            const isProfit = item.netProfit >= 0;
            const isHighlighted = highlightedPeriod === item.period;

            return (
              <TableRow
                key={item.period}
                onClick={() => setHighlightedPeriod(item.period === highlightedPeriod ? null : item.period)}
                className={cn(
                  'cursor-pointer transition-colors',
                  isHighlighted && 'bg-yellow-200 dark:bg-yellow-900',
                  item.predicted && 'bg-gray-50 dark:bg-gray-900'
                )}
              >
                <TableCell className="text-center">{item.period}</TableCell>
                <TableCell className="text-center">{item.date}</TableCell>
                <TableCell className="text-center">
                  {item.bid.toLocaleString()}
                  {item.predicted && (
                    <span className="text-xs text-gray-500 ml-1">(预测)</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{currentTotalPay.toLocaleString()}</TableCell>
                <TableCell className="text-center">{item.received.toLocaleString()}</TableCell>
                <TableCell className="text-center">{item.totalPaid.toLocaleString()}</TableCell>
                <TableCell className={cn(
                  'text-center font-bold',
                  isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {item.netProfit.toLocaleString()}
                </TableCell>
                <TableCell className={cn(
                  'text-center font-bold',
                  isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {item.profitRate}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
