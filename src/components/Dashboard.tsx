import React, { useMemo } from 'react';
import { BudgetItem, PayPeriodData, PaycheckSettings, GoalAllocations } from '../types';
import { GOALS_DEFINITIONS, MONTHS_LIST } from '../data/defaultData';
import { calculatePaycheck } from '../utils/paycheckMath';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Flame, 
  Calendar, 
  CheckSquare, 
  Sliders, 
  Briefcase,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  expenses: BudgetItem[];
  payPeriods: PayPeriodData[];
  selectedPeriodId: number;
  paychecks: PaycheckSettings[];
  workbookFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  goalAllocations: GoalAllocations;
  onNavigateToTab: (tabName: 'paycheck' | 'budget' | 'goals') => void;
  paycheckNetPay: number;
}

export default function Dashboard({
  expenses,
  payPeriods,
  selectedPeriodId,
  paychecks,
  workbookFrequency,
  goalAllocations,
  onNavigateToTab,
  paycheckNetPay
}: DashboardProps) {
  const currentMonthName = useMemo(() => {
    // Return standard active month based on the active pay period
    // e.g., mapping Period 1-2 to August, 3-4 to September, etc.
    const monthIndex = Math.min(11, Math.floor((selectedPeriodId - 1) / 2.2));
    return MONTHS_LIST[monthIndex] || 'August';
  }, [selectedPeriodId]);

  // Calculations for current period (Living + Household)
  const activePeriod = useMemo(() => {
    return payPeriods.find(p => p.id === selectedPeriodId) || payPeriods[0];
  }, [payPeriods, selectedPeriodId]);

  const stats = useMemo(() => {
    let projectedSum = 0;
    let actualSum = 0;
    let paidCount = 0;

    expenses.forEach(e => {
      projectedSum += activePeriod.projectedBudgets[e.id] || 0;
      actualSum += activePeriod.actualCosts[e.id] || 0;
      if (activePeriod.paidItems[e.id]) {
        paidCount++;
      }
    });

    // Yearly household-wide calculations
    let grossAnnual = 0;
    let netAnnual = 0;
    paychecks.forEach(p => {
      const calc = calculatePaycheck(p);
      grossAnnual += calc.grossAnnual;
      netAnnual += calc.netAnnual;
    });

    // Goal allocations for current month
    let monthlyGoalHours = 0;
    let monthlyGoalMoney = 0;
    let highEnergyCount = 0;
    GOALS_DEFINITIONS.forEach(g => {
      const alloc = goalAllocations[g.id]?.[currentMonthName];
      if (alloc) {
        monthlyGoalHours += alloc.time || 0;
        monthlyGoalMoney += alloc.money || 0;
        if (alloc.energy === 'High') highEnergyCount++;
      }
    });

    return {
      totalProjected: projectedSum,
      totalActual: actualSum,
      remainingBalance: paycheckNetPay - actualSum,
      paidCount,
      totalItemsCount: expenses.length,
      grossAnnual,
      netAnnual,
      monthlyGoalHours,
      monthlyGoalMoney,
      highEnergyCount
    };
  }, [expenses, activePeriod, paychecks, goalAllocations, currentMonthName, paycheckNetPay]);

  const progressPercentage = Math.min(100, (stats.totalActual / (paycheckNetPay || 1)) * 100);
  const paidPercentage = Math.round((stats.paidCount / (stats.totalItemsCount || 1)) * 100);

  return (
    <div id="dashboard_panel" className="space-y-8">
      {/* 1. Header Welcome Card */}
      <div className="border border-[#1A1A1A] p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#FDFCF9]">
        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A] opacity-60 block">Section I // Overview Ledger</span>
          <h1 className="text-4xl md:text-5xl font-serif italic font-bold tracking-tight text-[#1A1A1A] leading-none">Command Center</h1>
          <p className="text-[#4A4A4A] text-sm md:text-base font-serif leading-relaxed max-w-xl">
            A unified digital binder designed to optimize your bi-weekly pay cycle deductions, organize periodic ledger budgets, and allocate Time, Money, and Energy goals across the year.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onNavigateToTab('budget')}
            className="px-6 py-3 bg-[#1A1A1A] text-[#FDFCF9] text-[10px] uppercase tracking-widest font-bold hover:opacity-85 transition"
          >
            Manage Budget
          </button>
          <button
            onClick={() => onNavigateToTab('goals')}
            className="px-6 py-3 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A]/5 transition bg-transparent"
          >
            Allocate Goals
          </button>
        </div>
      </div>

      {/* 2. Bento Statistics Grid */}
      <div id="dashboard_bento_grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Card A: Financial Health & Paycheck Breakdown */}
        <div className="border border-[#1A1A1A] p-8 flex flex-col justify-between space-y-6 bg-[#FDFCF9]">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-[#1A1A1A]">Ledger Sheet 01</span>
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-40">{paychecks.length} active {paychecks.length === 1 ? 'earner' : 'earners'}</span>
            </div>
            <h2 className="text-2xl font-serif italic text-[#1A1A1A]">Annual Wage Model</h2>
            <p className="text-[#4A4A4A] text-xs font-serif leading-relaxed">Annualized salary estimates formulated on customized tax withholding brackets and benefit parameters.</p>
          </div>

          <div className="py-1 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-end border-b border-[#1A1A1A]/20 pb-2">
              <span className="text-[#4A4A4A]">Gross Earnings Est.</span>
              <span className="text-[#1A1A1A] font-bold">${stats.grossAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
            </div>
            <div className="flex justify-between items-end border-b border-[#1A1A1A]/20 pb-2">
              <span className="text-[#4A4A4A]">Net Disposable Income</span>
              <span className="text-[#1A1A1A] font-bold text-base">${stats.netAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
            </div>
            <div className="flex justify-between items-end pb-1">
              <span className="text-[#4A4A4A]">Period Take-Home Net</span>
              <span className="text-[#1A1A1A] font-bold">${paycheckNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('paycheck')}
            className="w-full py-3 bg-[#1A1A1A] text-[#FDFCF9] text-[10px] uppercase tracking-widest font-bold transition hover:opacity-85 flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            Calibrate Paycheck
          </button>
        </div>

        {/* Card B: Active Pay Period Tracker */}
        <div className="border border-[#1A1A1A] p-8 flex flex-col justify-between space-y-6 bg-[#FDFCF9]">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-[#1A1A1A]">Ledger Sheet 02</span>
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-40">Period {selectedPeriodId}</span>
            </div>
            <h2 className="text-2xl font-serif italic text-[#1A1A1A]">Budget Tracker</h2>
            <p className="text-[#4A4A4A] text-xs font-serif leading-relaxed">Track active spending checklists and outstanding bills directly against your period disposable limit.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[#4A4A4A]">Spend Allocation</span>
                <span className="font-bold text-[#1A1A1A]">
                  {progressPercentage.toFixed(0)}% Utilized
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1A1A1A]/10 relative">
                <div 
                  style={{ width: `${progressPercentage}%` }} 
                  className="absolute top-0 left-0 h-1.5 bg-[#1A1A1A] transition-all duration-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1 text-[#4A4A4A]">
              <div>Target: <span className="text-[#1A1A1A] font-bold block">${stats.totalProjected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
              <div>Actual: <span className="text-[#1A1A1A] font-bold block">${stats.totalActual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('budget')}
            className="w-full py-3 bg-[#1A1A1A] text-[#FDFCF9] text-[10px] uppercase tracking-widest font-bold transition hover:opacity-85 flex items-center justify-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Open Budget Sheet
          </button>
        </div>

        {/* Card C: Time, Money, Energy (TME) Goals Allocator */}
        <div className="border border-[#1A1A1A] p-8 flex flex-col justify-between space-y-6 bg-[#FDFCF9]">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/20 pb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-[#1A1A1A]">Ledger Sheet 03</span>
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-40">{currentMonthName}</span>
            </div>
            <h2 className="text-2xl font-serif italic text-[#1A1A1A]">TME Life Planner</h2>
            <p className="text-[#4A4A4A] text-xs font-serif leading-relaxed">Allocate physical hours, investment capital, and focus levels dedicated to personal aspirations.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 border border-[#1A1A1A]/30 bg-transparent">
              <div className="flex items-center gap-1.5 text-[#4A4A4A]">
                <Clock className="w-3.5 h-3.5" />
                Time Allocation
              </div>
              <span className="text-[#1A1A1A] font-bold">{stats.monthlyGoalHours} hrs/mo</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-[#1A1A1A]/30 bg-transparent">
              <div className="flex items-center gap-1.5 text-[#4A4A4A]">
                <DollarSign className="w-3.5 h-3.5" />
                Capital Assigned
              </div>
              <span className="text-[#1A1A1A] font-bold">${stats.monthlyGoalMoney}/mo</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('goals')}
            className="w-full py-3 bg-[#1A1A1A] text-[#FDFCF9] text-[10px] uppercase tracking-widest font-bold transition hover:opacity-85 flex items-center justify-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            Configure Goals
          </button>
        </div>

      </div>

      {/* 3. Help Guides & Quick Integration info */}
      <div id="dashboard_instructions_panel" className="border border-[#1A1A1A] p-8 space-y-6 bg-[#FDFCF9]">
        <div className="border-b border-[#1A1A1A]/20 pb-3">
          <h3 className="text-[11px] uppercase tracking-widest font-bold text-[#1A1A1A] opacity-60 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
            Workbook Quick Reference Guide
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-[#4A4A4A] font-serif leading-relaxed">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between border-b border-[#1A1A1A]/10 pb-1">
              <h4 className="font-bold text-[#1A1A1A] font-sans text-xs uppercase tracking-wider">1. Calibrate Paycheck</h4>
              <span className="text-[10px] font-mono opacity-50">01</span>
            </div>
            <p className="text-xs">
              Navigate to the <span className="font-semibold text-[#1A1A1A]">Paycheck Breakdown</span>. Set your correct hourly rate and premium variables. The system computes a realistic net-income limit that dynamically funds your budgets!
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between border-b border-[#1A1A1A]/10 pb-1">
              <h4 className="font-bold text-[#1A1A1A] font-sans text-xs uppercase tracking-wider">2. Customize Bill Binder</h4>
              <span className="text-[10px] font-mono opacity-50">02</span>
            </div>
            <p className="text-xs">
              Under <span className="font-semibold text-[#1A1A1A]">Budget Tracker</span>, mark items as paid for the active period. Pro-tip: Use the <span className="font-semibold text-[#1A1A1A]">Auto-Project</span> button to load monthly averages instantly!
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between border-b border-[#1A1A1A]/10 pb-1">
              <h4 className="font-bold text-[#1A1A1A] font-sans text-xs uppercase tracking-wider">3. Map Personal Goals</h4>
              <span className="text-[10px] font-mono opacity-50">03</span>
            </div>
            <p className="text-xs">
              Select a month in the <span className="font-semibold text-[#1A1A1A]">TME Goal Allocator</span> and adjust your Time, Money, and Energy levels. Click any goal to trace its progression over all 12 calendar months!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
