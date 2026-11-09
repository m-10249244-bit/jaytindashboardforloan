import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { LedgerRecord } from '../types';

interface Props {
  records: LedgerRecord[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const CustomerList: React.FC<Props> = ({ records, onSelect, selectedId }) => {
  if (records.length === 0) {
    return (
      <div 
        className="glass-card rounded-[32px] flex flex-col items-center justify-center py-24 text-slate-400 border border-white/60"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        <AlertCircle className="w-12 h-12 mb-4 opacity-20 text-[#1E3A8A]" />
        <p className="text-sm font-bold tracking-wide text-[#0F2C59]">No financial protocols detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}>
      {/* Desktop View (Table) */}
      <div className="hidden md:block glass-card rounded-[32px] overflow-hidden border border-white/80 min-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-blue-50/60 bg-blue-50/30">
              <th className="px-10 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Client Profile</th>
              <th className="px-10 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Protocol Type</th>
              <th className="px-10 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] text-right">Balance</th>
              <th className="px-10 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Status</th>
              <th className="px-8 py-6 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50/40">
            {records.map((record, index) => (
              <motion.tr 
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelect(record.id)}
                className={`group cursor-pointer hover:bg-white/60 transition-all duration-300 ${selectedId === record.id ? 'bg-white/80' : ''}`}
              >
                <td className="px-10 py-6">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#0F2C59] mb-1 group-hover:text-[#1E3A8A]">{record.userName}</span>
                    <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">{record.id}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className="text-[10px] font-bold text-[#1E3A8A] bg-blue-50/60 border border-blue-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                    {record.type}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-[#0F2C59]">
                      RM{(record.totalAmount - record.paidAmount).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Total: RM{record.totalAmount.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-6 py-6">
                  <ChevronRight className={`w-5 h-5 text-slate-300 transition-all duration-300 ${selectedId === record.id ? 'translate-x-2 text-[#1E3A8A]' : 'group-hover:translate-x-2'}`} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4 pb-8">
        {records.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(record.id)}
            className={`glass-card p-6 rounded-[28px] border border-white/80 shadow-sm active-scale ${selectedId === record.id ? 'bg-white/90 border-[#1E3A8A]/30 ring-1 ring-[#1E3A8A]/20' : ''}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-[#1E3A8A] uppercase tracking-[0.3em]">Protocol Entry</p>
                <h3 className="text-xl font-bold text-[#0F2C59] tracking-tight">{record.userName}</h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{record.id}</p>
              </div>
              <StatusBadge status={record.status} />
            </div>

            <div className="flex justify-between items-end bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {(record.calculatedInterest || 0) > 0 ? 'Remaining + Accrued Interest' : 'Remaining Capital'}
                </p>
                <p className="text-2xl font-bold text-[#0F2C59] tracking-tighter">
                  RM{((record.totalAmount - record.paidAmount) + (record.calculatedInterest || 0)).toLocaleString()}
                </p>
                {(record.calculatedInterest || 0) > 0 && (
                  <p className="text-[10px] font-bold text-amber-700">
                    Includes {record.overdueDays || 0}d Overdue Interest +RM{(record.calculatedInterest || 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Valuation</p>
                <p className="text-xs font-bold text-slate-500 opacity-70">RM{record.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-between items-center px-1">
               <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{record.type}</span>
                 {record.endDate && (
                   <span className="text-[9px] text-slate-400 font-mono">Due: {record.endDate}</span>
                 )}
               </div>
               <div className="flex items-center text-[#1E3A8A] text-[10px] font-bold uppercase tracking-widest">
                  View Detail <ChevronRight className="w-3.5 h-3.5 ml-1" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Active') {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-100">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] shadow-[0_0_8px_#1E3A8A]" />
        <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Active</span>
      </div>
    );
  }
  if (status === 'Settled') {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#0F2C59] border border-blue-200/40 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Settled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500 border border-rose-400 shadow-md animate-pulse">
      <AlertTriangle className="w-3.5 h-3.5 text-white" />
      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Overdue (Accruing)</span>
    </div>
  );
};

export default CustomerList;
