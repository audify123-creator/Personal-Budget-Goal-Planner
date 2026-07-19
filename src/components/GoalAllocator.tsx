import React, { useState, useMemo } from 'react';
import { GoalDefinition, GoalAllocations, MonthlyGoalAllocation } from '../types';
import { GOALS_DEFINITIONS, MONTHS_LIST } from '../data/defaultData';
import { 
  Clock, 
  DollarSign, 
  Flame, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  HelpCircle,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface GoalAllocatorProps {
  allocations: GoalAllocations;
  onUpdateAllocation: (goalId: string, month: string, field: keyof MonthlyGoalAllocation, value: number | 'Low' | 'Medium' | 'High') => void;
  monthlyNetFunding: number; // to compare monthly money goal spending
}

export default function GoalAllocator({
  allocations,
  onUpdateAllocation,
  monthlyNetFunding
}: GoalAllocatorProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('August');
  const [selectedCategory, setSelectedCategory] = useState<'personal' | 'lifestyle'>('personal');
  const [trackerGoalId, setTrackerGoalId] = useState<string>('books');

  // Filter goal definitions by active category
  const filteredGoals = useMemo(() => {
    return GOALS_DEFINITIONS.filter(g => g.category === selectedCategory);
  }, [selectedCategory]);

  // Compute resource totals allocated for the active selected month
  const monthTotals = useMemo(() => {
    let totalTime = 0;
    let totalMoney = 0;
    let lowEnergyCount = 0;
    let medEnergyCount = 0;
    let highEnergyCount = 0;

    GOALS_DEFINITIONS.forEach(g => {
      const alloc = allocations[g.id]?.[selectedMonth];
      if (alloc) {
        totalTime += alloc.time || 0;
        totalMoney += alloc.money || 0;
        if (alloc.energy === 'Low') lowEnergyCount++;
        else if (alloc.energy === 'Medium') medEnergyCount++;
        else if (alloc.energy === 'High') highEnergyCount++;
      }
    });

    const totalEnergyGoals = lowEnergyCount + medEnergyCount + highEnergyCount;

    return {
      totalTime,
      totalMoney,
      lowPct: totalEnergyGoals > 0 ? (lowEnergyCount / totalEnergyGoals) * 100 : 0,
      medPct: totalEnergyGoals > 0 ? (medEnergyCount / totalEnergyGoals) * 100 : 0,
      highPct: totalEnergyGoals > 0 ? (highEnergyCount / totalEnergyGoals) * 100 : 0,
      lowCount: lowEnergyCount,
      medCount: medEnergyCount,
      highCount: highEnergyCount
    };
  }, [allocations, selectedMonth]);

  // Yearly timeline of the selected goal for the timeline tracker view
  const trackerGoalData = useMemo(() => {
    const goal = GOALS_DEFINITIONS.find(g => g.id === trackerGoalId);
    if (!goal) return [];

    return MONTHS_LIST.map(month => {
      const alloc = allocations[trackerGoalId]?.[month] || { time: 0, money: 0, energy: 'Low' };
      return {
        month,
        time: alloc.time || 0,
        money: alloc.money || 0,
        energy: alloc.energy || 'Low'
      };
    });
  }, [allocations, trackerGoalId]);

  return (
    <div id="goal_allocator_view" className="space-y-8">
      {/* 1. Month Horizontal Scroll Picker */}
      <div id="month_pill_container" className="bg-[#FDFCF9] border border-[#1A1A1A] p-6">
        <label className="block text-[#1A1A1A] text-[10px] uppercase font-bold tracking-widest mb-4 flex items-center gap-1.5 opacity-60">
          <Calendar className="w-4 h-4 text-[#1A1A1A]" />
          Select Planning Month
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {MONTHS_LIST.map((month) => {
            const isSelected = selectedMonth === month;
            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-4 py-2 text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                    : 'bg-[#FDFCF9] border border-[#1A1A1A]/30 text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Monthly Budget Indicators (Time, Money, Energy) */}
      <div id="monthly_indicators_grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Budget */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-wider font-bold opacity-70 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Monthly Time Budget
            </span>
            <span className="text-[#1A1A1A]/50 text-[10px] font-mono">Max Rec: 160 hrs</span>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-mono font-bold text-[#1A1A1A]">{monthTotals.totalTime} hrs</span>
              <span className="text-[#1A1A1A]/60 text-[10px] font-serif">Allocated for {selectedMonth}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1A1A1A]/10 overflow-hidden">
              <div 
                style={{ width: `${Math.min(100, (monthTotals.totalTime / 160) * 100)}%` }} 
                className="h-full bg-[#1A1A1A] transition-all duration-500"
              />
            </div>
          </div>
          <p className="text-[#4A4A4A] text-[11px] font-serif italic">
            {monthTotals.totalTime > 160 
              ? '⚠️ Warning: Over-allocated! Keep focused goals to prevent burnout.' 
              : 'Focus time allows deeper engagement and productivity.'}
          </p>
        </div>

        {/* Money Allocation */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-wider font-bold opacity-70 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Monthly Money Budget
            </span>
            <span className="text-[#1A1A1A]/50 text-[10px] font-mono">Net Fund: ${monthlyNetFunding.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-2xl font-mono font-bold text-[#1A1A1A]">${monthTotals.totalMoney.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
              <span className="text-[#1A1A1A]/60 text-[10px] font-serif">Allocated for {selectedMonth}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1A1A1A]/10 overflow-hidden">
              <div 
                style={{ width: `${Math.min(100, (monthTotals.totalMoney / (monthlyNetFunding || 1)) * 100)}%` }} 
                className={`h-full transition-all duration-500 ${
                  monthTotals.totalMoney > monthlyNetFunding 
                    ? 'bg-rose-700' 
                    : 'bg-[#1A1A1A]'
                }`}
              />
            </div>
          </div>
          <p className="text-[#4A4A4A] text-[11px] font-serif italic">
            {monthTotals.totalMoney > monthlyNetFunding 
              ? '🚨 Alert: Money allocations exceed your monthly paycheck net income!' 
              : 'Allocations are funded safely by your projected take-home pay.'}
          </p>
        </div>

        {/* Energy Balance */}
        <div className="bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-wider font-bold opacity-70 flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              Monthly Energy Profile
            </span>
            <span className="text-[#1A1A1A]/50 text-[10px] font-mono">Density Balance</span>
          </div>
          <div className="space-y-3">
            <div className="w-full h-3 border border-[#1A1A1A] overflow-hidden flex text-[9px] text-[#FDFCF9] font-bold">
              {monthTotals.highPct > 0 && (
                <div style={{ width: `${monthTotals.highPct}%` }} className="bg-[#1A1A1A] flex items-center justify-center text-white font-mono" title={`High Energy: ${monthTotals.highCount} goals`}>
                  H
                </div>
              )}
              {monthTotals.medPct > 0 && (
                <div style={{ width: `${monthTotals.medPct}%` }} className="bg-[#1A1A1A]/60 flex items-center justify-center text-white font-mono border-l border-[#FDFCF9]" title={`Medium Energy: ${monthTotals.medCount} goals`}>
                  M
                </div>
              )}
              {monthTotals.lowPct > 0 && (
                <div style={{ width: `${monthTotals.lowPct}%` }} className="bg-[#1A1A1A]/30 flex items-center justify-center text-[#1A1A1A] font-mono border-l border-[#FDFCF9]" title={`Low Energy: ${monthTotals.lowCount} goals`}>
                  L
                </div>
              )}
              {monthTotals.highCount === 0 && monthTotals.medCount === 0 && monthTotals.lowCount === 0 && (
                <div className="w-full flex items-center justify-center text-[#1A1A1A]/50 text-xs font-serif font-normal">No goals set</div>
              )}
            </div>
            <div className="flex justify-between text-[9px] text-[#1A1A1A] font-mono uppercase">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1A1A1A]" /> High ({monthTotals.highCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1A1A1A]/60" /> Med ({monthTotals.medCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1A1A1A]/30" /> Low ({monthTotals.lowCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Goals Allocation Interactive Worksheet & Yearly Timeline Side-by-Side */}
      <div id="allocator_workspace_grid" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Interactive Goals List (7 cols) */}
        <div id="goals_worksheet_panel" className="xl:col-span-7 bg-[#FDFCF9] border border-[#1A1A1A] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1A1A1A]/20 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-serif italic text-[#1A1A1A] flex items-center gap-2 font-bold">
                <Award className="w-5 h-5" />
                Goals Allocation: {selectedMonth}
              </h2>
              <p className="text-[#4A4A4A] text-xs mt-1">Specify how much Time, Money, and mental Focus you can commit.</p>
            </div>

            {/* Category Toggle button */}
            <div className="flex border border-[#1A1A1A]/30 self-start sm:self-auto">
              <button
                onClick={() => setSelectedCategory('personal')}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider transition ${
                  selectedCategory === 'personal'
                    ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                    : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] bg-transparent'
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setSelectedCategory('lifestyle')}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider transition ${
                  selectedCategory === 'lifestyle'
                    ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                    : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] bg-transparent'
                }`}
              >
                Lifestyle
              </button>
            </div>
          </div>

          {/* Goal allocation form list */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
            {filteredGoals.map((goal) => {
              const alloc = allocations[goal.id]?.[selectedMonth] || { time: 0, money: 0, energy: 'Low' };
              
              return (
                <div 
                  key={goal.id} 
                  className={`p-5 border transition-all ${
                    trackerGoalId === goal.id 
                      ? 'bg-[#1A1A1A]/5 border-[#1A1A1A]' 
                      : 'bg-transparent border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      type="button"
                      onClick={() => setTrackerGoalId(goal.id)}
                      className="text-sm font-serif font-bold text-[#1A1A1A] flex items-center gap-2 hover:opacity-70 transition text-left"
                    >
                      <ChevronRight className={`w-4 h-4 text-[#1A1A1A] transition-transform ${trackerGoalId === goal.id ? 'rotate-90' : ''}`} />
                      {goal.name}
                    </button>

                    {/* Energy Selection Segment */}
                    <div className="flex border border-[#1A1A1A]/30 bg-[#FDFCF9]">
                      {(['Low', 'Medium', 'High'] as const).map((level) => {
                        const isChosen = alloc.energy === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => onUpdateAllocation(goal.id, selectedMonth, 'energy', level)}
                            className={`px-2.5 py-1 text-[9px] font-mono font-bold transition-all ${
                              isChosen
                                ? 'bg-[#1A1A1A] text-[#FDFCF9]'
                                : 'text-[#1A1A1A]/55 hover:text-[#1A1A1A] bg-transparent'
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resource Inputs Sliders / Number fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Time (Hrs) */}
                    <div>
                      <div className="flex justify-between text-[11px] text-[#4A4A4A] mb-1">
                        <span>Time Dedication</span>
                        <span className="font-mono text-[#1A1A1A] font-bold">{alloc.time || 0} hrs/mo</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#1A1A1A]/40" />
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={alloc.time || 0}
                          onChange={(e) => onUpdateAllocation(goal.id, selectedMonth, 'time', parseInt(e.target.value) || 0)}
                          className="w-full accent-[#1A1A1A] h-1 bg-[#1A1A1A]/10 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Money ($) */}
                    <div>
                      <div className="flex justify-between text-[11px] text-[#4A4A4A] mb-1">
                        <span>Financial Allocation</span>
                        <span className="font-mono text-[#1A1A1A] font-bold">${alloc.money || 0}/mo</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-[#1A1A1A]/40" />
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={alloc.money === 0 ? '' : alloc.money}
                          onChange={(e) => onUpdateAllocation(goal.id, selectedMonth, 'money', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#FDFCF9] border border-[#1A1A1A]/30 px-2 py-0.5 text-xs text-right text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Yearly Goal Timeline Tracker (5 cols) */}
        <div id="yearly_goal_timeline_panel" className="xl:col-span-5 bg-[#FDFCF9] border border-[#1A1A1A] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-[#1A1A1A]/60 font-bold uppercase tracking-widest font-mono">Yearly Timeline Visualizer</span>
              <h2 className="text-xl font-serif italic text-[#1A1A1A] flex items-center gap-2 mt-0.5 font-bold">
                <TrendingUp className="w-5 h-5" />
                {GOALS_DEFINITIONS.find(g => g.id === trackerGoalId)?.name || 'Goal Timeline'}
              </h2>
              <p className="text-[#4A4A4A] text-xs mt-1">Showing your allocated resources across all 12 workbook months.</p>
            </div>

            {/* Interactive Timeline Graph Chart (Custom CSS SVG Representation) */}
            <div className="bg-[#FDFCF9] border border-[#1A1A1A]/20 p-4 space-y-4">
              <span className="text-[10px] text-[#1A1A1A] font-bold uppercase tracking-wider block opacity-70">Time & Money Commitment Trends</span>
              
              <div className="h-40 flex items-end justify-between gap-1 border-b border-[#1A1A1A]/20 pb-2 relative">
                {/* Horizontal reference lines */}
                <div className="absolute inset-x-0 bottom-1/4 border-b border-[#1A1A1A]/5 text-[9px] text-zinc-400 pl-1 pt-0.5" />
                <div className="absolute inset-x-0 bottom-2/4 border-b border-[#1A1A1A]/5 text-[9px] text-zinc-400 pl-1 pt-0.5" />
                <div className="absolute inset-x-0 bottom-3/4 border-b border-[#1A1A1A]/5 text-[9px] text-zinc-400 pl-1 pt-0.5" />

                {trackerGoalData.map((data, idx) => {
                  const maxTime = Math.max(...trackerGoalData.map(d => d.time), 1);
                  const timeHeight = `${(data.time / maxTime) * 80}%`; // Cap at 80%
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-[#FDFCF9] border border-[#1A1A1A] text-[9px] text-[#1A1A1A] rounded px-1.5 py-1 pointer-events-none transition-all z-20 text-center min-w-[72px] shadow-md">
                        <span className="block font-bold font-serif">{data.month}</span>
                        <span className="block text-[#1A1A1A] font-mono">{data.time} hrs</span>
                        <span className="block text-[#1A1A1A]/70 font-mono">${data.money}</span>
                        <span className="block text-[8px] text-[#4A4A4A]">{data.energy} Energy</span>
                      </div>

                      {/* Bar represent Time */}
                      <div 
                        style={{ height: timeHeight }} 
                        className={`w-2.5 transition-all duration-300 ${
                          data.energy === 'High' ? 'bg-[#1A1A1A]' :
                          data.energy === 'Medium' ? 'bg-[#1A1A1A]/60' :
                          'bg-[#1A1A1A]/30'
                        }`}
                      />

                      {/* Month label */}
                      <span className="text-[8px] text-[#1A1A1A]/60 font-bold mt-1 uppercase font-mono">{data.month.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Energy indicator labels */}
              <div className="flex justify-between text-[9px] text-[#1A1A1A] border-t border-[#1A1A1A]/10 pt-2 font-mono uppercase">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#1A1A1A]" /> High</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#1A1A1A]/60" /> Med</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-[#1A1A1A]/30" /> Low</span>
              </div>
            </div>

            {/* List breakdown of yearly entries */}
            <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1 text-xs">
              {trackerGoalData.map((d, index) => (
                <div key={index} className="flex justify-between items-center py-1.5 px-3 bg-[#FDFCF9] border border-[#1A1A1A]/10">
                  <span className="text-[#1A1A1A] font-serif font-bold">{d.month}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#1A1A1A]/60 text-[10px] flex items-center gap-0.5"><Clock className="w-2.5 h-2.5 text-[#1A1A1A]" /> {d.time}h</span>
                    <span className="text-[#1A1A1A]/60 text-[10px] flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5 text-[#1A1A1A]" /> ${d.money}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 font-bold ${
                      d.energy === 'High' ? 'text-[#1A1A1A]' :
                      d.energy === 'Medium' ? 'text-[#1A1A1A]/70' :
                      'text-[#1A1A1A]/40'
                    }`}>{d.energy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-[#1A1A1A]/5 border border-[#1A1A1A]/20 flex items-start gap-2 text-[10px] text-[#4A4A4A]">
            <Info className="w-4 h-4 text-[#1A1A1A]/70 flex-shrink-0" />
            <span className="font-serif">
              Click on any goal name in the left panel to display its multi-month allocation timeline. Resource allocations sync automatically to memory.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
