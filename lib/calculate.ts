import { CalculatorInputs, CalculationResult } from './types';

export function calculate(inputs: CalculatorInputs): CalculationResult[] {
  const { totalPeople, baseMoney, bidType, firstBid = 300, bidDecrease = 0, customBids = [] } = inputs;

  // 获取利息数据
  const bids: number[] = [];
  const isPredicted: boolean[] = [];

  if (bidType === 'fixed') {
    for (let i = 1; i <= totalPeople; i++) {
      bids.push(i === 1 ? 0 : Math.max(0, firstBid - (i - 2) * bidDecrease));
      isPredicted.push(false);
    }
  } else {
    bids.push(0); // 第一期无利息
    isPredicted.push(false);
    let lastVal = 0;
    for (let i = 2; i <= totalPeople; i++) {
      const idx = i - 2;
      const val = customBids[idx] || 0;
      if (val === 0) {
        // 预测逻辑
        const predictedVal = Math.max(200, lastVal - 20);
        bids.push(predictedVal);
        isPredicted.push(true);
        lastVal = predictedVal;
      } else {
        bids.push(val);
        isPredicted.push(false);
        lastVal = val;
      }
    }
  }

  // 计算结果
  const result: CalculationResult[] = [];
  let totalBids = 0; // 累计利息总和

  // 时间处理
  const startYear = 2025;
  const startMonth = 6; // 1-12
  function getPeriodDate(period: number): string {
    const y = startYear + Math.floor((startMonth - 1 + period - 1) / 12);
    const m = ((startMonth - 1 + period - 1) % 12) + 1;
    return `${y}-${m.toString().padStart(2, '0')}`;
  }

  // 第一期特殊处理（会头）
  const firstPeriodReceived = (totalPeople - 1) * baseMoney;
  let firstPeriodPaid = 0;
  for (let p = 2; p <= totalPeople; p++) {
    firstPeriodPaid += baseMoney; // 会头后续每期只需缴纳基本会金
  }
  result.push({
    period: 1,
    bid: 0,
    received: firstPeriodReceived,
    totalPaid: firstPeriodPaid,
    netProfit: firstPeriodReceived - firstPeriodPaid,
    profitRate: firstPeriodPaid > 0
      ? ((firstPeriodReceived - firstPeriodPaid) / firstPeriodPaid * 100).toFixed(2)
      : "0.00",
    date: getPeriodDate(1),
    predicted: false
  });

  // 从第二期开始计算
  for (let period = 2; period <= totalPeople; period++) {
    // 当期得标者实收金额 = 基本会金×人数 + 之前累计利息
    const received = baseMoney * (totalPeople - 1) + totalBids;

    // 计算累计支出（假设自己在第period期得标）
    let totalPaid = 0;
    for (let p = 1; p <= totalPeople; p++) {
      if (p < period) {
        // 未得标期：只需缴纳基本会金
        totalPaid += baseMoney;
      } else if (p === period) {
        // 得标当期：无需缴纳
      } else {
        // 已得标后：每期缴纳基本会金+自己得标时的利息
        totalPaid += baseMoney + bids[period - 1];
      }
    }

    // 净收益和收益率
    const netProfit = received - totalPaid;
    const profitRate = totalPaid > 0 ? (netProfit / totalPaid * 100).toFixed(2) : "0.00";

    result.push({
      period,
      bid: bids[period - 1],
      received,
      totalPaid,
      netProfit,
      profitRate,
      date: getPeriodDate(period),
      predicted: isPredicted[period - 1]
    });

    // 更新累计利息（下一期开始前）
    if (period < totalPeople) {
      totalBids += bids[period];
    }
  }

  return result;
}

export function getCurrentTotalPay(result: CalculationResult[], period: number, totalPeople: number, baseMoney: number): number {
  let currentTotalPay = 0;
  for (let person = 1; person <= totalPeople; person++) {
    if (person === period) continue; // 本期得标人不缴纳
    // 判断此人得标期
    const personBidPeriod = person; // 假设每个人第person期得标
    if (personBidPeriod < period) {
      // 已得标
      currentTotalPay += baseMoney + result[personBidPeriod - 1].bid;
    } else {
      // 未得标
      currentTotalPay += baseMoney;
    }
  }
  return currentTotalPay;
}
