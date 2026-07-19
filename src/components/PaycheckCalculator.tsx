import React, { useState, useMemo } from 'react';
import { PaycheckSettings, AdditionalIncomeItem } from '../types';
import { 
  calculatePaycheck, 
  getPaycheckPeriodNet,
  calculateAdditionalIncomeAnnual,
  getAdditionalIncomePeriodAmount
} from '../utils/paycheckMath';
import { 
  DollarSign, 
  Percent, 
  Clock, 
  Briefcase, 
  Calculator, 
  Trash2, 
  Plus, 
  Users, 
  User, 
  Info, 
  TrendingUp, 
  ArrowRight,
  Gift,
  Coins,
  Scale,
  HeartHandshake
} from 'lucide-react';
import { motion } from 'motion/react';

interface PaycheckCalculatorProps {
  paychecks: PaycheckSettings[];
  onPaychecksChange: (paychecks: PaycheckSettings[]) => void;
  workbookFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  onWorkbookFrequencyChange: (freq: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly') => void;
  additionalIncomes?: AdditionalIncomeItem[];
  onAdditionalIncomesChange?: (items: AdditionalIncomeItem[]) => void;
}

export default function PaycheckCalculator({
  paychecks,
  onPaychecksChange,
  workbookFrequency,
  onWorkbookFrequencyChange,
  additionalIncomes = [],
  onAdditionalIncomesChange
}: PaycheckCalculatorProps) {
  const [selectedPaycheckId, setSelectedPaycheckId] = useState<string>(() => {
    return paychecks[0]?.id || 'p1';
  });

  // Safe fallback to active earner
  const activePaycheck = useMemo(() => {
    return paychecks.find(p => p.id === selectedPaycheckId) || paychecks[0] || paychecks[0];
  }, [paychecks, selectedPaycheckId]);

  // If the active paycheck was deleted, reset selected to first available
  React.useEffect(() => {
    if (activePaycheck && activePaycheck.id !== selectedPaycheckId) {
      setSelectedPaycheckId(activePaycheck.id);
    }
  }, [activePaycheck, selectedPaycheckId]);

  // Handlers for active paycheck
  const handleActiveChange = (key: keyof PaycheckSettings, value: number | string) => {
    if (!activePaycheck) return;
    
    let parsedValue = typeof value === 'string' ? parseFloat(value) : value;
    if (key !== 'name' && isNaN(parsedValue)) {
      parsedValue = 0;
    }

    const updated = paychecks.map(p => {
      if (p.id === activePaycheck.id) {
        return {
          ...p,
          [key]: key === 'name' ? value : parsedValue
        };
      }
      return p;
    });
    onPaychecksChange(updated);
  };

  const handleActiveFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activePaycheck) return;
    const updated = paychecks.map(p => {
      if (p.id === activePaycheck.id) {
        return {
          ...p,
          payFrequency: e.target.value as PaycheckSettings['payFrequency']
        };
      }
      return p;
    });
    onPaychecksChange(updated);
  };

  // Add new household paycheck profile
  const handleAddPaycheck = () => {
    const newId = `p_${Date.now()}`;
    const nextNum = paychecks.length + 1;
    const newPaycheck: PaycheckSettings = {
      id: newId,
      name: `Earner ${nextNum}`,
      hourlyWage: 20,
      hoursPerWeek: 40,
      payFrequency: 'biweekly',
      stateTaxRate: 3.5,
      healthPremiumMonthly: 100,
      retirementRate: 3
    };
    onPaychecksChange([...paychecks, newPaycheck]);
    setSelectedPaycheckId(newId);
  };

  // Delete paycheck profile
  const handleDeletePaycheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (paychecks.length <= 1) return;
    
    const remaining = paychecks.filter(p => p.id !== id);
    onPaychecksChange(remaining);
    
    if (selectedPaycheckId === id) {
      setSelectedPaycheckId(remaining[0].id);
    }
  };

  // Individual active earner paycheck calculations
  const activeCalculations = useMemo(() => {
    if (!activePaycheck) return null;
    return calculatePaycheck(activePaycheck);
  }, [activePaycheck]);

  // Aggregate household sums
  const householdTotals = useMemo(() => {
    let grossAnnual = 0;
    let netAnnual = 0;
    let ficaAnnual = 0;
    let federalTaxAnnual = 0;
    let stateTaxAnnual = 0;
    let healthAnnual = 0;
    let retirementAnnual = 0;

    const earnersList = paychecks.map(p => {
      const calc = calculatePaycheck(p);
      const contributionPerPeriod = getPaycheckPeriodNet(calc, workbookFrequency);
      
      grossAnnual += calc.grossAnnual;
      netAnnual += calc.netAnnual;
      ficaAnnual += calc.ficaAnnual;
      federalTaxAnnual += calc.federalTaxAnnual;
      stateTaxAnnual += calc.stateTaxAnnual;
      healthAnnual += calc.healthAnnual;
      retirementAnnual += calc.retirementAnnual;

      return {
        id: p.id,
        name: p.name,
        contributionPerPeriod,
        payFrequency: p.payFrequency,
        hourlyWage: p.hourlyWage,
        hoursPerWeek: p.hoursPerWeek,
        netAnnual: calc.netAnnual
      };
    });

    let additionalAnnual = 0;
    const additionalList = additionalIncomes.map(item => {
      const annual = calculateAdditionalIncomeAnnual(item);
      const contributionPerPeriod = getAdditionalIncomePeriodAmount(item, workbookFrequency);
      additionalAnnual += annual;
      return {
        ...item,
        contributionPerPeriod,
        annual
      };
    });

    const combinedEarnersNetPeriodFunding = earnersList.reduce((sum, e) => sum + e.contributionPerPeriod, 0);
    const combinedAdditionalNetPeriodFunding = additionalList.reduce((sum, a) => sum + a.contributionPerPeriod, 0);
    const combinedNetPeriodFunding = combinedEarnersNetPeriodFunding + combinedAdditionalNetPeriodFunding;

    return {
      grossAnnual,
      netAnnual: netAnnual + additionalAnnual,
      ficaAnnual,
      federalTaxAnnual,
      stateTaxAnnual,
      healthAnnual,
      retirementAnnual,
      earnersList,
      additionalList,
      additionalAnnual,
      combinedNetPeriodFunding
    };
  }, [paychecks, additionalIncomes, workbookFrequency]);

  const activeDeductionPercentage = activeCalculations 
    ? ((activeCalculations.totalDeductionsAnnual / activeCalculations.grossAnnual) * 100) || 0
    : 0;
  const activeTakeHomePercentage = 100 - activeDeductionPercentage;

  return (
    <div id="paycheck_calculator_container" className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      
      {/* COLUMN 1: Profiles sidebar & global planning cycle */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* Profile Card List */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="border-b border-[#1A1A1A]/20 pb-3">
            <h2 className="text-lg font-serif italic text-[#1A1A1A] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1A1A1A]" />
              Household Earners
            </h2>
            <p className="text-[#4A4A4A] text-xs font-serif mt-0.5">Manage members and individual earnings profiles.</p>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {paychecks.map((p) => {
              const isActive = p.id === selectedPaycheckId;
              const calc = calculatePaycheck(p);
              const pNet = getPaycheckPeriodNet(calc, workbookFrequency);
              
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPaycheckId(p.id)}
                  className={`p-4 border text-left cursor-pointer transition flex items-center justify-between ${
                    isActive 
                      ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FDFCF9]' 
                      : 'bg-[#FDFCF9] border-[#1A1A1A]/30 text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider">
                      <User className="w-3.5 h-3.5" />
                      {p.name}
                    </div>
                    <div className="text-[10px] opacity-75 font-mono">
                      ${p.hourlyWage.toFixed(2)}/hr × {p.hoursPerWeek}h · {p.payFrequency}
                    </div>
                    <div className="text-[11px] font-bold font-mono">
                      +${pNet.toLocaleString(undefined, { minimumFractionDigits: 2 })} / cycle
                    </div>
                  </div>

                  {paychecks.length > 1 && (
                    <button
                      onClick={(e) => handleDeletePaycheck(p.id, e)}
                      className={`p-1.5 rounded transition ${
                        isActive 
                          ? 'text-[#FDFCF9]/60 hover:text-red-300' 
                          : 'text-[#1A1A1A]/60 hover:text-red-600 hover:bg-[#1A1A1A]/5'
                      }`}
                      title="Remove Earner Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleAddPaycheck}
            className="w-full py-2.5 bg-transparent border border-[#1A1A1A] border-dashed hover:bg-[#1A1A1A]/5 text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Household Earner
          </button>
        </div>

        {/* Global Workbook setting */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="border-b border-[#1A1A1A]/20 pb-3">
            <h2 className="text-base font-serif italic text-[#1A1A1A] flex items-center gap-2">
              <Calculator className="w-4.5 h-4.5 text-[#1A1A1A]" />
              Workbook Calendar Cycle
            </h2>
            <p className="text-[#4A4A4A] text-xs font-serif mt-0.5">Define how the entire household's workbook is synchronized.</p>
          </div>

          <div className="space-y-3">
            <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1">
              Active Budget Planning Cycle
            </label>
            <select
              value={workbookFrequency}
              onChange={(e) => onWorkbookFrequencyChange(e.target.value as any)}
              className="w-full px-4 py-2 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none"
            >
              <option value="weekly">Weekly (52 Budget Periods/yr)</option>
              <option value="biweekly">Bi-weekly (26 Budget Periods/yr)</option>
              <option value="semimonthly">Semi-monthly (24 Budget Periods/yr)</option>
              <option value="monthly">Monthly (12 Budget Periods/yr)</option>
            </select>
            <div className="flex gap-2 p-3 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 text-[11px] text-[#4A4A4A] font-serif leading-relaxed">
              <Info className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
              <span>
                All household earner earnings will automatically be prorated and combined to fit into this selected planning period!
              </span>
            </div>
          </div>
        </div>

        {/* Other Inflows & Support */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="border-b border-[#1A1A1A]/20 pb-3">
            <h2 className="text-base font-serif italic text-[#1A1A1A] flex items-center gap-2">
              <Coins className="w-4.5 h-4.5 text-[#1A1A1A]" />
              Other Inflows & Support
            </h2>
            <p className="text-[#4A4A4A] text-xs font-serif mt-0.5">Track social security, settlements, gifts, and refunds.</p>
          </div>

          <div className="space-y-4">
            {additionalIncomes.map((item) => {
              return (
                <div key={item.id} className="space-y-1.5 pb-3 border-b border-[#1A1A1A]/10 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <label className="text-[#1A1A1A] text-[10px] uppercase tracking-wider font-bold block flex items-center gap-1.5">
                      {item.id === 'gifts' && <Gift className="w-3.5 h-3.5 text-[#1A1A1A]/60" />}
                      {item.id === 'settlements' && <Scale className="w-3.5 h-3.5 text-[#1A1A1A]/60" />}
                      {item.id === 'refunds' && <Coins className="w-3.5 h-3.5 text-[#1A1A1A]/60" />}
                      {item.id === 'social_security' && <HeartHandshake className="w-3.5 h-3.5 text-[#1A1A1A]/60" />}
                      {item.name}
                    </label>
                    <span className="text-[10px] font-mono opacity-70">
                      +${getAdditionalIncomePeriodAmount(item, workbookFrequency).toLocaleString(undefined, { minimumFractionDigits: 2 })} / cycle
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1 text-[#1A1A1A]/40 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        value={item.amount || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (onAdditionalIncomesChange) {
                            const updated = additionalIncomes.map(ai => 
                              ai.id === item.id ? { ...ai, amount: val } : ai
                            );
                            onAdditionalIncomesChange(updated);
                          }
                        }}
                        className="w-full pl-6 pr-2 py-1 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] font-mono focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>

                    <select
                      value={item.frequency}
                      onChange={(e) => {
                        const freq = e.target.value as any;
                        if (onAdditionalIncomesChange) {
                          const updated = additionalIncomes.map(ai => 
                            ai.id === item.id ? { ...ai, frequency: freq } : ai
                          );
                          onAdditionalIncomesChange(updated);
                        }
                      }}
                      className="w-full px-2 py-1 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="semimonthly">Semi-monthly</option>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annually</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* COLUMN 2: Active Earner Settings Form */}
      <div className="xl:col-span-4 bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-5">
        {activePaycheck ? (
          <>
            <div className="border-b border-[#1A1A1A]/20 pb-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/60 font-mono">Earner Customization</span>
              <h2 className="text-lg font-serif italic text-[#1A1A1A] mt-1">
                Edit {activePaycheck.name}'s Profile
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1.5">
                  Earner Name / Alias
                </label>
                <input
                  type="text"
                  value={activePaycheck.name}
                  onChange={(e) => handleActiveChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFCF9] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-sans focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                  placeholder="e.g. Partner A"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1.5">
                    Hourly Wage ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#1A1A1A] text-xs font-semibold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={activePaycheck.hourlyWage || ''}
                      onChange={(e) => handleActiveChange('hourlyWage', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1.5">
                    Hours Per Week
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2 w-3.5 h-3.5 text-[#1A1A1A]/40" />
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={activePaycheck.hoursPerWeek || ''}
                      onChange={(e) => handleActiveChange('hoursPerWeek', e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1.5">
                  Earner's Pay Frequency
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#1A1A1A]/40" />
                  <select
                    value={activePaycheck.payFrequency}
                    onChange={handleActiveFrequencyChange}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none"
                  >
                    <option value="weekly">Weekly (52 checks/yr)</option>
                    <option value="biweekly">Bi-weekly (26 checks/yr)</option>
                    <option value="semimonthly">Semi-monthly (24 checks/yr)</option>
                    <option value="monthly">Monthly (12 checks/yr)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#1A1A1A]/20 pt-4 mt-2">
                <h3 className="text-[#1A1A1A] text-[9px] font-bold uppercase tracking-widest mb-3 pb-1 border-b border-[#1A1A1A]/10">Taxes & Deductions</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between">
                      <span>State & Local Tax Rate</span>
                      <span className="text-[#1A1A1A] text-[10px] font-mono font-bold">{activePaycheck.stateTaxRate}%</span>
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-2 w-3.5 h-3.5 text-[#1A1A1A]/40" />
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.1"
                        value={activePaycheck.stateTaxRate || ''}
                        onChange={(e) => handleActiveChange('stateTaxRate', e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between">
                      <span>Monthly Health Insurance</span>
                      <span className="text-[#1A1A1A] text-[10px] font-mono font-bold">${activePaycheck.healthPremiumMonthly}/mo</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-[#1A1A1A]/40 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        value={activePaycheck.healthPremiumMonthly || ''}
                        onChange={(e) => handleActiveChange('healthPremiumMonthly', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold mb-1 flex justify-between">
                      <span>401(k) Retirement Contribution</span>
                      <span className="text-[#1A1A1A] text-[10px] font-mono font-bold">{activePaycheck.retirementRate}%</span>
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-2 w-3.5 h-3.5 text-[#1A1A1A]/40" />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={activePaycheck.retirementRate || ''}
                        onChange={(e) => handleActiveChange('retirementRate', e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#FDFCF9] border border-[#1A1A1A] text-xs text-[#1A1A1A] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-xs opacity-50">
            Please add or select a paycheck profile.
          </div>
        )}
      </div>

      {/* COLUMN 3: Household Combined Analytics & Deductions breakdown */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* Household Combined Summary */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="border-b border-[#1A1A1A]/20 pb-3">
            <h2 className="text-lg font-serif italic text-[#1A1A1A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
              Combined Income Pool
            </h2>
            <p className="text-[#4A4A4A] text-xs font-serif mt-0.5">Sum total of all paycheck profiles combined.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 border border-[#1A1A1A]/20 bg-[#FDFCF9]">
                <span className="text-[#4A4A4A] block mb-0.5 text-[8px] uppercase tracking-wider">Household Gross</span>
                <span className="text-[#1A1A1A] text-sm font-bold">${householdTotals.grossAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
              </div>
              <div className="p-3 border border-[#1A1A1A]/20 bg-[#FDFCF9]">
                <span className="text-[#4A4A4A] block mb-0.5 text-[8px] uppercase tracking-wider">Household Net</span>
                <span className="text-[#1A1A1A] text-sm font-bold">${householdTotals.netAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
              </div>
            </div>

            <div className="p-4 bg-[#1A1A1A] text-[#FDFCF9] space-y-1.5">
              <span className="text-[#FDFCF9]/60 text-[8px] uppercase tracking-wider block font-bold">Pooled Funding per {workbookFrequency} cycle</span>
              <div className="text-2xl font-mono font-bold">${householdTotals.combinedNetPeriodFunding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <span className="text-[10px] font-serif italic text-[#FDFCF9]/70 block">This is your final spending limit per period in the Budget sheets!</span>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <span className="text-[#1A1A1A] text-[9px] uppercase tracking-widest font-bold border-b border-[#1A1A1A]/20 pb-1 block">Earner Cycle Contributions</span>
                <div className="space-y-1 mt-1.5 text-xs">
                  {householdTotals.earnersList.map((e) => (
                    <div key={e.id} className="flex justify-between items-center py-0.5 font-mono text-[11px]">
                      <span className="font-sans font-medium text-gray-700">{e.name}</span>
                      <span className="font-bold">${e.contributionPerPeriod.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>

              {householdTotals.additionalList.some(a => a.amount > 0) && (
                <div>
                  <span className="text-[#1A1A1A] text-[9px] uppercase tracking-widest font-bold border-b border-[#1A1A1A]/20 pb-1 block">Other Cash Inflows</span>
                  <div className="space-y-1 mt-1.5 text-xs">
                    {householdTotals.additionalList.filter(a => a.amount > 0).map((a) => (
                      <div key={a.id} className="flex justify-between items-center py-0.5 font-mono text-[11px]">
                        <span className="font-sans font-medium text-gray-700">{a.name}</span>
                        <span className="font-bold text-[#1A1A1A]">+${a.contributionPerPeriod.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Earner Detailed Withholdings */}
        {activeCalculations && activePaycheck && (
          <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
            <div className="border-b border-[#1A1A1A]/20 pb-3">
              <h2 className="text-base font-serif italic text-[#1A1A1A]">
                {activePaycheck.name}'s Deductions Sheet
              </h2>
              <p className="text-[#4A4A4A] text-xs font-serif mt-0.5">Itemized calculations of annual withholding and pre-tax premiums.</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                <span className="text-[#4A4A4A]">Net Take-Home Ratio</span>
                <span className="text-[#1A1A1A] font-mono font-bold">{activeTakeHomePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-[#1A1A1A]/10 relative mb-3">
                <div 
                  style={{ width: `${activeTakeHomePercentage}%` }} 
                  className="absolute top-0 left-0 h-1 bg-[#1A1A1A] transition-all"
                />
              </div>

              <div className="divide-y divide-[#1A1A1A]/10 font-serif">
                <div className="flex justify-between items-center py-2 text-[#1A1A1A]">
                  <span>Federal Income Tax (Estimated)</span>
                  <span className="font-mono font-bold">${activeCalculations.federalTaxAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                </div>
                <div className="flex justify-between items-center py-2 text-[#1A1A1A]">
                  <span>FICA Tax (SS + Medicare)</span>
                  <span className="font-mono font-bold">${activeCalculations.ficaAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                </div>
                <div className="flex justify-between items-center py-2 text-[#1A1A1A]">
                  <span>State & Local Tax ({activePaycheck.stateTaxRate}%)</span>
                  <span className="font-mono font-bold">${activeCalculations.stateTaxAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                </div>
                <div className="flex justify-between items-center py-2 text-[#1A1A1A]">
                  <span>Health Premium Benefit</span>
                  <span className="font-mono font-bold">${activeCalculations.healthAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                </div>
                {activePaycheck.retirementRate > 0 && (
                  <div className="flex justify-between items-center py-2 text-[#1A1A1A]">
                    <span>401(k) Retirement Contribution</span>
                    <span className="font-mono font-bold">${activeCalculations.retirementAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 text-[#1A1A1A] font-bold">
                  <span>Total Withheld & Deducted</span>
                  <span className="font-mono font-bold text-red-700">-${activeCalculations.totalDeductionsAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
