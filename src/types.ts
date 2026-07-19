export interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  category: 'living' | 'household' | 'medicine' | 'first_aid_home' | 'custom';
  timesPaidPerYear: number;
  notes?: string;
}

export interface PayPeriodData {
  id: number; // 1 to 26 for biweekly
  name: string; // e.g., "Pay Period 1"
  paidItems: Record<string, boolean>; // BudgetItem.id -> isPaid
  projectedBudgets: Record<string, number>; // BudgetItem.id -> projected cost
  actualCosts: Record<string, number>; // BudgetItem.id -> actual cost
}

export interface PaycheckSettings {
  id: string;
  name: string;
  hourlyWage: number;
  hoursPerWeek: number;
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  stateTaxRate: number; // percent, e.g., 3.5
  healthPremiumMonthly: number; // e.g., 125
  retirementRate: number; // percent, e.g., 3% for 401k
}

export interface AdditionalIncomeItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'annual';
}

export interface GoalDefinition {
  id: string;
  name: string;
  category: 'personal' | 'lifestyle';
}

export interface MonthlyGoalAllocation {
  time: number; // hours allocated
  money: number; // money allocated
  energy: 'Low' | 'Medium' | 'High'; // energy level
}

// Maps Goal ID -> Month -> MonthlyGoalAllocation
export type GoalAllocations = Record<string, Record<string, MonthlyGoalAllocation>>;
