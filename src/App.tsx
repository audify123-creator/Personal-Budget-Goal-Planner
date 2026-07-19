/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BudgetItem, PayPeriodData, PaycheckSettings, GoalAllocations, MonthlyGoalAllocation, AdditionalIncomeItem } from './types';
import { calculatePaycheck, getPaycheckPeriodNet, getAdditionalIncomePeriodAmount } from './utils/paycheckMath';
import { 
  DEFAULT_PAYCHECK_SETTINGS, 
  DEFAULT_LIVING_EXPENSES, 
  DEFAULT_HOUSEHOLD_ITEMS, 
  GOALS_DEFINITIONS, 
  MONTHS_LIST 
} from './data/defaultData';
import Dashboard from './components/Dashboard';
import PaycheckCalculator from './components/PaycheckCalculator';
import BudgetTracker from './components/BudgetTracker';
import GoalAllocator from './components/GoalAllocator';
import { 
  LayoutDashboard, 
  Sliders, 
  CheckSquare, 
  Flame, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  PAYCHECK: 'personal_planner_paycheck',
  EXPENSES: 'personal_planner_expenses',
  PERIODS: 'personal_planner_periods',
  GOALS: 'personal_planner_goals',
  ACTIVE_PERIOD: 'personal_planner_active_period'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'paycheck' | 'budget' | 'goals'>('dashboard');

  // --- State Initializers (backed by localStorage with migration) ---
  const [paychecks, setPaychecks] = useState<PaycheckSettings[]>(() => {
    const savedList = localStorage.getItem('personal_planner_paychecks_list');
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    // Migrate old single paycheck setting
    const savedSingle = localStorage.getItem(LOCAL_STORAGE_KEYS.PAYCHECK);
    if (savedSingle) {
      try {
        const parsed = JSON.parse(savedSingle);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return [{
            ...parsed,
            id: parsed.id || 'p1',
            name: parsed.name || 'Earner A'
          }];
        }
      } catch (e) {}
    }

    return [
      {
        id: 'p1',
        name: 'Earner A',
        hourlyWage: 23,
        hoursPerWeek: 40,
        payFrequency: 'biweekly',
        stateTaxRate: 3.5,
        healthPremiumMonthly: 125,
        retirementRate: 3
      },
      {
        id: 'p2',
        name: 'Earner B',
        hourlyWage: 20,
        hoursPerWeek: 40,
        payFrequency: 'biweekly',
        stateTaxRate: 3.5,
        healthPremiumMonthly: 100,
        retirementRate: 3
      }
    ];
  });

  const [workbookFrequency, setWorkbookFrequency] = useState<'weekly' | 'biweekly' | 'semimonthly' | 'monthly'>(() => {
    const savedFreq = localStorage.getItem('personal_planner_workbook_frequency');
    if (savedFreq && ['weekly', 'biweekly', 'semimonthly', 'monthly'].includes(savedFreq)) {
      return savedFreq as any;
    }

    // Migrate from old single paycheck
    const savedSingle = localStorage.getItem(LOCAL_STORAGE_KEYS.PAYCHECK);
    if (savedSingle) {
      try {
        const parsed = JSON.parse(savedSingle);
        if (parsed?.payFrequency) return parsed.payFrequency;
      } catch (e) {}
    }

    return 'biweekly';
  });

  const [additionalIncomes, setAdditionalIncomes] = useState<AdditionalIncomeItem[]>(() => {
    const saved = localStorage.getItem('personal_planner_additional_incomes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'gifts', name: 'Gifts & Support', amount: 0, frequency: 'annual' },
      { id: 'settlements', name: 'Settlements', amount: 0, frequency: 'annual' },
      { id: 'refunds', name: 'Refunds (Tax, Retail)', amount: 0, frequency: 'annual' },
      { id: 'social_security', name: 'Social Security Payments', amount: 0, frequency: 'monthly' },
    ];
  });

  const [expenses, setExpenses] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
    if (saved) return JSON.parse(saved);
    // Merge base preloads on first boot
    return [...DEFAULT_LIVING_EXPENSES, ...DEFAULT_HOUSEHOLD_ITEMS];
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_PERIOD);
    return saved ? parseInt(saved, 10) : 1;
  });

  // Calculate total number of periods based on workbook planning cycle
  const totalPeriodsCount = useMemo(() => {
    switch (workbookFrequency) {
      case 'weekly': return 52;
      case 'biweekly': return 26;
      case 'semimonthly': return 24;
      case 'monthly': return 12;
      default: return 26;
    }
  }, [workbookFrequency]);

  const [payPeriods, setPayPeriods] = useState<PayPeriodData[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PERIODS);
    if (saved) {
      const parsed = JSON.parse(saved) as PayPeriodData[];
      return parsed;
    }
    // Pre-create standard empty sheets for the maximum periods (52 to support all frequencies)
    const list: PayPeriodData[] = [];
    for (let i = 1; i <= 52; i++) {
      list.push({
        id: i,
        name: `Pay Period ${i}`,
        paidItems: {},
        projectedBudgets: {},
        actualCosts: {}
      });
    }
    return list;
  });

  const [goalAllocations, setGoalAllocations] = useState<GoalAllocations>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.GOALS);
    if (saved) return JSON.parse(saved);
    // Initialize empty mapping
    const allocations: GoalAllocations = {};
    GOALS_DEFINITIONS.forEach(goal => {
      allocations[goal.id] = {};
      MONTHS_LIST.forEach(month => {
        allocations[goal.id][month] = {
          time: 0,
          money: 0,
          energy: 'Low'
        };
      });
    });
    return allocations;
  });

  // --- Persistent Storage Syncer ---
  useEffect(() => {
    localStorage.setItem('personal_planner_paychecks_list', JSON.stringify(paychecks));
  }, [paychecks]);

  useEffect(() => {
    localStorage.setItem('personal_planner_workbook_frequency', workbookFrequency);
  }, [workbookFrequency]);

  useEffect(() => {
    localStorage.setItem('personal_planner_additional_incomes', JSON.stringify(additionalIncomes));
  }, [additionalIncomes]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_PERIOD, selectedPeriodId.toString());
  }, [selectedPeriodId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PERIODS, JSON.stringify(payPeriods));
  }, [payPeriods]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.GOALS, JSON.stringify(goalAllocations));
  }, [goalAllocations]);

  // Adjust active selected period bounds if it exceeds frequency periods count
  useEffect(() => {
    if (selectedPeriodId > totalPeriodsCount) {
      setSelectedPeriodId(1);
    }
  }, [totalPeriodsCount, selectedPeriodId]);

  // --- Calculated Values ---
  const paycheckNetPay = useMemo(() => {
    let totalNetPay = 0;
    paychecks.forEach(p => {
      const calc = calculatePaycheck(p);
      const netPerPeriod = getPaycheckPeriodNet(calc, workbookFrequency);
      totalNetPay += netPerPeriod;
    });

    additionalIncomes.forEach(item => {
      const extraPerPeriod = getAdditionalIncomePeriodAmount(item, workbookFrequency);
      totalNetPay += extraPerPeriod;
    });

    return totalNetPay;
  }, [paychecks, additionalIncomes, workbookFrequency]);

  const monthlyNetFunding = paycheckNetPay * (totalPeriodsCount / 12);

  // --- Handlers ---
  const handleUpdatePeriodData = (
    periodId: number, 
    itemId: string, 
    field: 'paid' | 'projected' | 'actual', 
    value: boolean | number
  ) => {
    setPayPeriods(prevPeriods => 
      prevPeriods.map(period => {
        if (period.id !== periodId) return period;

        const updatedPeriod = { ...period };
        if (field === 'paid') {
          updatedPeriod.paidItems = {
            ...period.paidItems,
            [itemId]: value as boolean
          };
        } else if (field === 'projected') {
          updatedPeriod.projectedBudgets = {
            ...period.projectedBudgets,
            [itemId]: value as number
          };
        } else if (field === 'actual') {
          updatedPeriod.actualCosts = {
            ...period.actualCosts,
            [itemId]: value as number
          };
        }
        return updatedPeriod;
      })
    );
  };

  const handleAddExpense = (newExpenseItem: Omit<BudgetItem, 'id'>) => {
    const id = `custom_${Date.now()}`;
    setExpenses(prev => [...prev, { ...newExpenseItem, id }]);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    // Also prune from records
    setPayPeriods(prevPeriods => 
      prevPeriods.map(p => {
        const paidItems = { ...p.paidItems };
        const projectedBudgets = { ...p.projectedBudgets };
        const actualCosts = { ...p.actualCosts };
        delete paidItems[id];
        delete projectedBudgets[id];
        delete actualCosts[id];
        return { ...p, paidItems, projectedBudgets, actualCosts };
      })
    );
  };

  // Automated smart average autofill for projections
  const handleBulkAutofillProjections = (periodId: number) => {
    setPayPeriods(prevPeriods => 
      prevPeriods.map(p => {
        if (p.id !== periodId) return p;

        const projectedBudgets = { ...p.projectedBudgets };
        expenses.forEach(item => {
          // If already defined, keep. Otherwise load default
          if (!projectedBudgets[item.id] || projectedBudgets[item.id] === 0) {
            const annualCost = item.timesPaidPerYear === 0 ? item.cost : (item.cost * item.timesPaidPerYear);
            const periodAllocation = annualCost / totalPeriodsCount;
            projectedBudgets[item.id] = parseFloat(periodAllocation.toFixed(2));
          }
        });

        return { ...p, projectedBudgets };
      })
    );
  };

  // Duplicate the current period's entries across all other periods
  const handleCopyPeriodToAll = (sourcePeriodId: number) => {
    const source = payPeriods.find(p => p.id === sourcePeriodId);
    if (!source) return;

    setPayPeriods(prevPeriods => 
      prevPeriods.map(p => {
        if (p.id === sourcePeriodId) return p;
        return {
          ...p,
          paidItems: { ...source.paidItems },
          projectedBudgets: { ...source.projectedBudgets },
          actualCosts: { ...source.actualCosts }
        };
      })
    );
  };

  const handleUpdateAllocation = (
    goalId: string, 
    month: string, 
    field: keyof MonthlyGoalAllocation, 
    value: number | 'Low' | 'Medium' | 'High'
  ) => {
    setGoalAllocations(prev => {
      const updatedGoal = { ...prev[goalId] };
      updatedGoal[month] = {
        ...updatedGoal[month],
        [field]: value
      };
      return {
        ...prev,
        [goalId]: updatedGoal
      };
    });
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to the default workbook templates? This will erase your custom inputs.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Filter periods to valid ones according to frequency selection
  const filteredPayPeriods = useMemo(() => {
    return payPeriods.filter(p => p.id <= totalPeriodsCount);
  }, [payPeriods, totalPeriodsCount]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A1A1A] flex flex-col selection:bg-[#1A1A1A] selection:text-[#FDFCF9]">
      {/* Visual Navigation Banner */}
      <header className="border-b border-[#1A1A1A] bg-[#FDFCF9] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif italic font-bold tracking-tight text-[#1A1A1A]">The Ledger Book</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-semibold text-[#1A1A1A]">Personal Financial & Life Workbook // 2026</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center bg-[#FDFCF9] p-0.5 border border-[#1A1A1A] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider transition ${
                activeTab === 'dashboard'
                  ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                  : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('paycheck')}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider transition ${
                activeTab === 'paycheck'
                  ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                  : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Paycheck
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider transition ${
                activeTab === 'budget'
                  ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                  : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Budget Tracker
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-wider transition ${
                activeTab === 'goals'
                  ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                  : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Goals Allocator
            </button>
          </nav>

          {/* Data controls */}
          <button
            onClick={handleResetData}
            className="text-[10px] uppercase font-bold tracking-wider border-b border-[#1A1A1A] pb-0.5 text-[#1A1A1A] hover:opacity-60 flex items-center gap-1 py-1 px-2 transition"
            title="Wipe data and restore original workbook averages."
          >
            <RefreshCw className="w-3 h-3" />
            Reset Workbook
          </button>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 py-10">
        
        {/* Render Active View Component */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            expenses={expenses}
            payPeriods={filteredPayPeriods}
            selectedPeriodId={selectedPeriodId}
            paychecks={paychecks}
            workbookFrequency={workbookFrequency}
            goalAllocations={goalAllocations}
            onNavigateToTab={setActiveTab}
            paycheckNetPay={paycheckNetPay}
          />
        )}

        {activeTab === 'paycheck' && (
          <PaycheckCalculator 
            paychecks={paychecks}
            onPaychecksChange={setPaychecks}
            workbookFrequency={workbookFrequency}
            onWorkbookFrequencyChange={setWorkbookFrequency}
            additionalIncomes={additionalIncomes}
            onAdditionalIncomesChange={setAdditionalIncomes}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTracker 
            expenses={expenses}
            payPeriods={filteredPayPeriods}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={setSelectedPeriodId}
            onUpdatePeriodData={handleUpdatePeriodData}
            onAddExpense={handleAddExpense}
            onRemoveExpense={handleRemoveExpense}
            onBulkAutofillProjections={handleBulkAutofillProjections}
            onCopyPeriodToAll={handleCopyPeriodToAll}
            paycheckNetPay={paycheckNetPay}
            workbookFrequency={workbookFrequency}
          />
        )}

        {activeTab === 'goals' && (
          <GoalAllocator 
            allocations={goalAllocations}
            onUpdateAllocation={handleUpdateAllocation}
            monthlyNetFunding={monthlyNetFunding}
          />
        )}
      </main>

      {/* Humble Footer with details */}
      <footer className="border-t border-[#1A1A1A] bg-[#FDFCF9] py-8 text-[10px] uppercase tracking-widest font-bold text-[#4A4A4A]">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© MMXXVI The Ledger Book Studio. Formulated on Standardized Living Ledger sheets.</p>
          <div className="flex items-center gap-1.5 opacity-60">
            <Info className="w-3.5 h-3.5" />
            <span>State persistence automatically maintained via local sandbox cache.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
