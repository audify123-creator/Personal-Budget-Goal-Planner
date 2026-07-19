import React, { useState, useMemo } from 'react';
import { BudgetItem, PayPeriodData, PaycheckSettings } from '../types';
import { 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles,
  Info,
  DollarSign,
  Package,
  Layers,
  HeartPulse
} from 'lucide-react';
import { motion } from 'motion/react';

interface BudgetTrackerProps {
  expenses: BudgetItem[];
  payPeriods: PayPeriodData[];
  selectedPeriodId: number;
  onPeriodChange: (id: number) => void;
  onUpdatePeriodData: (periodId: number, itemId: string, field: 'paid' | 'projected' | 'actual', value: boolean | number) => void;
  onAddExpense: (expense: Omit<BudgetItem, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  onBulkAutofillProjections: (periodId: number) => void;
  onCopyPeriodToAll: (periodId: number) => void;
  paycheckNetPay: number;
  workbookFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

export default function BudgetTracker({
  expenses,
  payPeriods,
  selectedPeriodId,
  onPeriodChange,
  onUpdatePeriodData,
  onAddExpense,
  onRemoveExpense,
  onBulkAutofillProjections,
  onCopyPeriodToAll,
  paycheckNetPay,
  workbookFrequency
}: BudgetTrackerProps) {
  const [activeTab, setActiveTab] = useState<'living' | 'household_items'>('living');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: '',
    cost: 0,
    category: 'living' as BudgetItem['category'],
    timesPaidPerYear: 12
  });

  const activePeriod = useMemo(() => {
    return payPeriods.find(p => p.id === selectedPeriodId) || payPeriods[0];
  }, [payPeriods, selectedPeriodId]);

  // Filter expenses based on selected tab
  const filteredExpenses = useMemo(() => {
    if (activeTab === 'living') {
      return expenses.filter(e => e.category === 'living' || e.category === 'custom');
    } else {
      return expenses.filter(e => e.category === 'household' || e.category === 'medicine' || e.category === 'first_aid_home');
    }
  }, [expenses, activeTab]);

  // Calculations for current period (Living + Household)
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

    return {
      totalProjected: projectedSum,
      totalActual: actualSum,
      remainingBalance: paycheckNetPay - actualSum,
      paidCount,
      totalItemsCount: expenses.length
    };
  }, [expenses, activePeriod, paycheckNetPay]);

  // Cumulative actual cost per item across ALL periods to check against Annual Estimation
  const yearlyCumulativeActuals = useMemo(() => {
    const cumulative: Record<string, number> = {};
    expenses.forEach(e => {
      cumulative[e.id] = 0;
    });

    payPeriods.forEach(p => {
      expenses.forEach(e => {
        cumulative[e.id] += p.actualCosts[e.id] || 0;
      });
    });

    return cumulative;
  }, [expenses, payPeriods]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.name.trim()) return;
    onAddExpense(newExpense);
    setNewExpense({
      name: '',
      cost: 0,
      category: activeTab === 'living' ? 'living' : 'household',
      timesPaidPerYear: 12
    });
    setShowAddModal(false);
  };

  return (
    <div id="budget_tracker_view" className="space-y-6">
      {/* Overview Dashboard Cards for Selected Period */}
      <div id="period_summary_cards" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Period Funding Source */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[#1A1A1A] text-[9px] uppercase tracking-wider font-bold opacity-60">Period Net Funding</span>
            <h3 className="text-2xl font-mono font-bold text-[#1A1A1A]">${paycheckNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
          <span className="text-[#4A4A4A] text-[10px] font-serif border-t border-[#1A1A1A]/10 pt-2 mt-2">Active {workbookFrequency} cycle</span>
        </div>

        {/* Total Period Projected */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[#1A1A1A] text-[9px] uppercase tracking-wider font-bold opacity-60">Total Period Projected</span>
            <h3 className="text-2xl font-mono font-bold text-[#1A1A1A]">${stats.totalProjected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
          <span className="text-[#4A4A4A] text-[10px] font-serif border-t border-[#1A1A1A]/10 pt-2 mt-2">{((stats.totalProjected / paycheckNetPay) * 100 || 0).toFixed(0)}% of paycheck allocated</span>
        </div>

        {/* Total Period Actual */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[#1A1A1A] text-[9px] uppercase tracking-wider font-bold opacity-60">Total Period Actual</span>
            <h3 className="text-2xl font-mono font-bold text-[#1A1A1A]">${stats.totalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
          <span className="text-[#4A4A4A] text-[10px] font-serif border-t border-[#1A1A1A]/10 pt-2 mt-2">
            {stats.totalActual > stats.totalProjected ? (
              <span className="text-rose-700 font-bold">Over projection by ${(stats.totalActual - stats.totalProjected).toFixed(0)}</span>
            ) : (
              <span className="text-[#1A1A1A] opacity-75">Under projection by ${(stats.totalProjected - stats.totalActual).toFixed(0)}</span>
            )}
          </span>
        </div>

        {/* Remaining / Leftover */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[#1A1A1A] text-[9px] uppercase tracking-wider font-bold opacity-60">Remaining Period Balance</span>
            <h3 className={`text-2xl font-mono font-bold ${stats.remainingBalance >= 0 ? 'text-[#1A1A1A]' : 'text-rose-700'}`}>
              ${stats.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <span className="text-[#4A4A4A] text-[10px] font-serif border-t border-[#1A1A1A]/10 pt-2 mt-2">Unspent ledger residue</span>
        </div>
      </div>

      {/* Control Panel: Selection of Pay Period, Tabs, Productivity Actions */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center bg-[#FDFCF9] border border-[#1A1A1A] p-6">
        {/* Pay Period Switcher */}
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[#1A1A1A] text-[#1A1A1A]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider opacity-60">Active Pay Period</label>
            <select
              value={selectedPeriodId}
              onChange={(e) => onPeriodChange(parseInt(e.target.value))}
              className="bg-[#FDFCF9] border border-[#1A1A1A] px-3 py-1 text-xs text-[#1A1A1A] font-semibold focus:outline-none font-mono"
            >
              {payPeriods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1A1A1A]/20">
          <button
            onClick={() => setActiveTab('living')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold transition ${
              activeTab === 'living'
                ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]'
                : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Living Expenses
          </button>
          <button
            onClick={() => setActiveTab('household_items')}
            className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold transition ${
              activeTab === 'household_items'
                ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]'
                : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Stock & Household Items
          </button>
        </div>

        {/* Bulk Productivity Toolkit */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Autofill projected budget defaults for this pay period based on yearly estimated item averages?')) {
                onBulkAutofillProjections(selectedPeriodId);
              }
            }}
            className="px-3.5 py-1.5 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A]/5 transition bg-transparent"
            title="Saves hours of typing! Calculates default period budget limits for each active item automatically."
          >
            Auto-Project
          </button>
          
          <button
            onClick={() => {
              if (confirm('Duplicate all projections, actuals, and paid checklists from this period to ALL other pay periods? This instantly completes your yearly schedule.')) {
                onCopyPeriodToAll(selectedPeriodId);
              }
            }}
            className="px-3.5 py-1.5 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A]/5 transition bg-transparent"
            title="Copies this period's entries to the rest of the year. You can customize individual periods later."
          >
            Duplicate Yearly
          </button>

          <button
            onClick={() => {
              setNewExpense(prev => ({
                ...prev,
                category: activeTab === 'living' ? 'living' : 'household'
              }));
              setShowAddModal(true);
            }}
            className="px-4 py-1.5 bg-[#1A1A1A] text-[#FDFCF9] text-[10px] uppercase tracking-widest font-bold hover:opacity-85 transition"
          >
            + Add Row
          </button>
        </div>
      </div>

      {/* Main Interactive Grid Table */}
      <div id="budget_tracker_table_card" className="bg-[#FDFCF9] border border-[#1A1A1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#1A1A1A]">
            <thead className="text-[10px] uppercase tracking-widest font-bold border-b border-[#1A1A1A] text-[#1A1A1A]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Paid</th>
                <th className="py-3 px-4">Expense Item</th>
                <th className="py-3 px-4 text-right">Base Cost / Monthly</th>
                <th className="py-3 px-4 text-center">Paid/Yr</th>
                <th className="py-3 px-4 text-right">Annual Est.</th>
                <th className="py-3 px-4 text-right text-[#1A1A1A] w-36">Projected Budget</th>
                <th className="py-3 px-4 text-right text-[#1A1A1A] w-36">Actual Cost</th>
                <th className="py-3 px-4 text-center w-28">Status Flags</th>
                <th className="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/10">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#1A1A1A]/50 font-serif">
                    No expense rows found in this category. Click "Add Row" above to create custom items!
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const isPaid = activePeriod.paidItems[expense.id] || false;
                  const projected = activePeriod.projectedBudgets[expense.id] || 0;
                  const actual = activePeriod.actualCosts[expense.id] || 0;
                  
                  // Calculate annual estimation
                  const annualEst = expense.timesPaidPerYear === 0 
                    ? expense.cost 
                    : (expense.cost * expense.timesPaidPerYear);

                  const cumulativeActual = yearlyCumulativeActuals[expense.id] || 0;
                  const isOverAnnualBudget = cumulativeActual > annualEst;
                  const isOverPeriodBudget = actual > projected && projected > 0;

                  return (
                    <tr 
                      key={expense.id} 
                      className={`hover:bg-[#1A1A1A]/5 transition-colors ${
                        isPaid ? 'opacity-50 line-through text-[#1A1A1A]/60' : ''
                      }`}
                    >
                      {/* Paid Checkbox */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onUpdatePeriodData(selectedPeriodId, expense.id, 'paid', !isPaid)}
                          className={`w-4 h-4 mx-auto flex items-center justify-center border transition-all ${
                            isPaid 
                              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FDFCF9]' 
                              : 'bg-transparent border-[#1A1A1A] text-transparent hover:bg-[#1A1A1A]/5'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3px]" />
                        </button>
                      </td>

                      {/* Expense Item Name */}
                      <td className="py-2.5 px-4 font-serif text-[#1A1A1A]">
                        <div className="flex flex-col">
                          <span className="font-semibold">{expense.name}</span>
                          {expense.notes && <span className="text-[10px] text-[#4A4A4A] font-normal font-sans tracking-wide">{expense.notes}</span>}
                        </div>
                      </td>

                      {/* Base Cost */}
                      <td className="py-2.5 px-4 text-right font-mono text-[#1A1A1A]">
                        ${expense.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Times Paid / Year */}
                      <td className="py-2.5 px-4 text-center font-mono text-[#1A1A1A]/60 text-xs">
                        {expense.timesPaidPerYear}
                      </td>

                      {/* Annual Est. */}
                      <td className="py-2.5 px-4 text-right font-mono text-[#1A1A1A]/70">
                        ${annualEst.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>

                      {/* Projected Budget (Editable) */}
                      <td className="py-2.5 px-3 text-right bg-[#1A1A1A]/5">
                        <div className="relative flex items-center justify-end">
                          <span className="text-[#1A1A1A]/40 text-[10px] mr-1">$</span>
                          <input
                            type="number"
                            min="0"
                            value={projected === 0 ? '' : projected}
                            onChange={(e) => onUpdatePeriodData(selectedPeriodId, expense.id, 'projected', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-20 bg-[#FDFCF9] border border-[#1A1A1A]/30 focus:border-[#1A1A1A] px-1.5 py-0.5 text-right font-mono text-xs text-[#1A1A1A] focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Actual Cost (Editable) */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="relative flex items-center justify-end">
                          <span className="text-[#1A1A1A]/40 text-[10px] mr-1">$</span>
                          <input
                            type="number"
                            min="0"
                            value={actual === 0 ? '' : actual}
                            onChange={(e) => onUpdatePeriodData(selectedPeriodId, expense.id, 'actual', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-20 bg-[#FDFCF9] border border-[#1A1A1A]/30 focus:border-[#1A1A1A] px-1.5 py-0.5 text-right font-mono text-xs text-[#1A1A1A] focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Flags Indicator */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isOverPeriodBudget && (
                            <span className="text-[9px] font-mono font-bold text-[#1A1A1A] border border-[#1A1A1A] px-1 py-0.5" title="Actual exceeds target projection">
                              Over Proj
                            </span>
                          )}
                          {isOverAnnualBudget && (
                            <span className="text-[9px] font-mono font-bold text-rose-700 border border-rose-700 px-1 py-0.5" title="Sum of actuals across all periods exceeds estimated annual total">
                              Over Annual
                            </span>
                          )}
                          {!isOverPeriodBudget && !isOverAnnualBudget && (
                            <span className="text-xs font-serif opacity-40 italic">OK</span>
                          )}
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td className="py-2.5 px-2 text-center">
                        {expense.id.startsWith('custom_') && (
                          <button
                            onClick={() => onRemoveExpense(expense.id)}
                            className="text-[#1A1A1A]/50 hover:text-rose-700 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row Adding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFCF9] border-2 border-[#1A1A1A] max-w-md w-full p-8 shadow-2xl relative">
            <h3 className="text-2xl font-serif italic text-[#1A1A1A] mb-4 border-b border-[#1A1A1A]/20 pb-2">Add Custom Expense Row</h3>
            
            <form onSubmit={handleAddExpenseSubmit} className="space-y-6">
              <div>
                <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Car Gas or Storage Unit"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  className="w-full bg-[#FDFCF9] border border-[#1A1A1A] px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1">Base Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newExpense.cost || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FDFCF9] border border-[#1A1A1A] px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1">Times Paid / Year</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newExpense.timesPaidPerYear}
                    onChange={(e) => setNewExpense({ ...newExpense, timesPaidPerYear: parseInt(e.target.value) || 12 })}
                    className="w-full bg-[#FDFCF9] border border-[#1A1A1A] px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#1A1A1A]/5 transition bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] text-[#FDFCF9] text-[10px] uppercase tracking-widest font-bold hover:opacity-85 transition"
                >
                  Add to Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
