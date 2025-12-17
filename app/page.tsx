'use client';

import { useState } from 'react';
import { CalculatorForm } from '@/components/calculator-form';
import { ResultTable } from '@/components/result-table';
import { DebugPanel } from '@/components/debug-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculationResult, CalculatorInputs } from '@/lib/types';

export default function Home() {
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);

  const handleCalculate = (calculatedResults: CalculationResult[], calculatedInputs: CalculatorInputs) => {
    setResults(calculatedResults);
    setInputs(calculatedInputs);
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-red-600 mb-8">
        闽南标会（会子）计算器
      </h1>

      <div className="space-y-8">
        <CalculatorForm onCalculate={handleCalculate} />
        
        <DebugPanel />

        {results.length > 0 && inputs && (
          <Card>
            <CardHeader>
              <CardTitle>计算结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>标会规模：</strong>{' '}
                  {inputs.totalPeople}人参与，每期会金{inputs.baseMoney.toLocaleString()}元
                </p>
                <p>
                  <strong>总资金池：</strong>{' '}
                  {inputs.baseMoney.toLocaleString()}元 × {inputs.totalPeople}人 × {inputs.totalPeople}期 ={' '}
                  {(inputs.totalPeople * inputs.totalPeople * inputs.baseMoney).toLocaleString()}元
                </p>
              </div>

              <ResultTable
                results={results}
                totalPeople={inputs.totalPeople}
                baseMoney={inputs.baseMoney}
              />
            </CardContent>
          </Card>
        )}

        {results.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              请先设置参数并点击"计算"按钮
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
