export type BidType = 'fixed' | 'custom';

export interface CalculatorInputs {
  totalPeople: number;
  baseMoney: number;
  bidType: BidType;
  firstBid?: number;
  bidDecrease?: number;
  customBids?: number[];
}

export interface CalculationResult {
  period: number;
  bid: number;
  received: number;
  totalPaid: number;
  netProfit: number;
  profitRate: string;
  date: string;
  predicted: boolean;
}

export interface DatabaseInputs extends CalculatorInputs {
  id?: number;
  sessionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
