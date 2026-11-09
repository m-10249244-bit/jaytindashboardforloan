import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, AlertCircle, Wallet } from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const generatePath = () => {
    const data = stats.monthlyTrend;
    if (data.length < 2) return "";
    const max = Math.max(...data.map(d => d.amount), 100);
    const width = 200;
    const height = 40;
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d.amount / max) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="md:col-span-8 glass-card rounded-[40px] p-8 md:p-10 border border-white/80 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Wallet className="w-64 h-64 text-[#1E3A8A]" /></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em]">Outstanding Capital</p>
            <h2 className="text-5xl md:text-6xl font-bold text-[#0F2C59] tracking-tight">RM{stats.totalOutstanding.toLocaleString()}</h2>
            <div className="flex items-center space-x-3 pt-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center shadow-sm">
                <TrendingUp className="w-3 h-3 mr-1.5" /> Healthy Flow
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valuation: RM{stats.totalValuation.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-full md:w-48 space-y-4 bg-white/40 p-6 rounded-[32px] border border-blue-100/60 shadow-inner">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
              <span className="text-xs font-bold text-[#1E3A8A]">{stats.collectionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 bg-blue-100/60 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.collectionRate}%` }} className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]" />
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-blue-50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Monthly Inflow</p>
            <p className="text-xl font-bold text-[#0F2C59]">RM{stats.collectedThisMonth.toLocaleString()}</p>
          </div>
          <div className="flex-1 max-w-[200px] h-10 ml-8 opacity-60">
            <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
              <path d={generatePath()} fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </motion.div>

      <div className="md:col-span-4 grid grid-cols-1 gap-6">
        <div className="glass-card rounded-[32px] p-8 border border-white/80 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 shadow-sm"><Activity className="w-5 h-5 text-[#1E3A8A]" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocols</span>
          </div>
          <div className="mt-4">
            <h4 className="text-4xl font-bold text-[#0F2C59] tracking-tighter">{stats.activeCustomers}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Active Bonds</p>
          </div>
        </div>
        <div className={`glass-card rounded-[32px] p-8 border flex flex-col justify-between shadow-xl ${stats.overdueAmount > 0 ? 'border-rose-100 bg-rose-50/20' : 'border-white/80'}`}>
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl border shadow-sm ${stats.overdueAmount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-blue-50/80 border-blue-100'}`}>
              <AlertCircle className={`w-5 h-5 ${stats.overdueAmount > 0 ? 'text-rose-500' : 'text-slate-300'}`} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk & Interest</span>
          </div>
          <div className="mt-4">
            <h4 className={`text-3xl font-bold tracking-tighter ${stats.overdueAmount > 0 ? 'text-rose-600' : 'text-[#0F2C59]'}`}>
              RM{stats.overdueAmount.toLocaleString()}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending Principal</p>
              {stats.totalInterestAmount > 0 && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  +RM{stats.totalInterestAmount.toLocaleString()} Accrued Interest
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
