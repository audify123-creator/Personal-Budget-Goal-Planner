import { PaycheckSettings, AdditionalIncomeItem } from '../types';

export interface PaycheckCalculations {
  grossAnnual: number;
  grossMonthly: number;
  grossBiweekly: number;
  grossWeekly: number;
  ficaAnnual: number;
  retirementAnnual: number;
  healthAnnual: number;
  federalTaxAnnual: number;
  stateTaxAnnual: number;
  totalDeductionsAnnual: number;
  netAnnual: number;
  netMonthly: number;
  netBiweekly: number;
  netWeekly: number;
  netSemimonthly: number;
  taxableIncome: number;
}

export function calculatePaycheck(settings: PaycheckSettings): PaycheckCalculations {
  const grossWeekly = settings.hourlyWage * settings.hoursPerWeek;
  const grossAnnual = grossWeekly * 52;
  const grossBiweekly = grossWeekly * 2;
  const grossMonthly = grossAnnual / 12;

  // FICA (6.2% SS + 1.45% Med) = 7.65%
  const ficaAnnual = grossAnnual * 0.0765;

  // 401(k) Retirement Contribution
  const retirementAnnual = grossAnnual * (settings.retirementRate / 100);

  // Health Premium
  const healthAnnual = settings.healthPremiumMonthly * 12;

  // Federal Income Tax (Single Filer, 2026 standard deduction estimated at $15,000)
  const standardDeduction = 15000;
  const taxableIncome = Math.max(0, grossAnnual - standardDeduction - retirementAnnual);

  // 2026 Federal tax brackets (estimated progressives: 10% up to $11,600, 12% up to $47,150, 22% up to $100,525)
  let federalTaxAnnual = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= 11600) {
      federalTaxAnnual = taxableIncome * 0.10;
    } else if (taxableIncome <= 47150) {
      federalTaxAnnual = (11600 * 0.10) + ((taxableIncome - 11600) * 0.12);
    } else {
      federalTaxAnnual = (11600 * 0.10) + ((47150 - 11600) * 0.12) + ((taxableIncome - 47150) * 0.22);
    }
  }

  // State & Local Taxes (e.g. 3.5%)
  const stateTaxAnnual = grossAnnual * (settings.stateTaxRate / 100);

  // Total deductions
  const totalDeductionsAnnual = ficaAnnual + federalTaxAnnual + stateTaxAnnual + retirementAnnual + healthAnnual;
  
  // Net income
  const netAnnual = Math.max(0, grossAnnual - totalDeductionsAnnual);
  const netMonthly = netAnnual / 12;
  const netBiweekly = netAnnual / 26;
  const netWeekly = netAnnual / 52;
  const netSemimonthly = netAnnual / 24;

  return {
    grossAnnual,
    grossMonthly,
    grossBiweekly,
    grossWeekly,
    ficaAnnual,
    retirementAnnual,
    healthAnnual,
    federalTaxAnnual,
    stateTaxAnnual,
    totalDeductionsAnnual,
    netAnnual,
    netMonthly,
    netBiweekly,
    netWeekly,
    netSemimonthly,
    taxableIncome
  };
}

export function getPaycheckPeriodNet(calc: PaycheckCalculations, frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'): number {
  switch (frequency) {
    case 'weekly': return calc.netWeekly;
    case 'biweekly': return calc.netBiweekly;
    case 'semimonthly': return calc.netSemimonthly;
    case 'monthly': return calc.netMonthly;
    default: return calc.netBiweekly;
  }
}

export function calculateAdditionalIncomeAnnual(item: AdditionalIncomeItem): number {
  switch (item.frequency) {
    case 'weekly': return item.amount * 52;
    case 'biweekly': return item.amount * 26;
    case 'semimonthly': return item.amount * 24;
    case 'monthly': return item.amount * 12;
    case 'annual': return item.amount;
    default: return 0;
  }
}

export function getAdditionalIncomePeriodAmount(item: AdditionalIncomeItem, targetFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'): number {
  const annual = calculateAdditionalIncomeAnnual(item);
  switch (targetFrequency) {
    case 'weekly': return annual / 52;
    case 'biweekly': return annual / 26;
    case 'semimonthly': return annual / 24;
    case 'monthly': return annual / 12;
    default: return annual / 26;
  }
}
