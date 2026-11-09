import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LedgerRecord, PaymentType } from '../types';

const generateJayTINId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'JayTIN';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateShareKey = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: LedgerRecord) => void;
  initialData?: LedgerRecord;
}

const RecordFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
  const [userName, setUserName] = useState('');
  const [type, setType] = useState<PaymentType>('Installment');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [interestEnabled, setInterestEnabled] = useState<boolean>(true);
  const [dailyInterestRate, setDailyInterestRate] = useState<number>(10);
  const [interestType, setInterestType] = useState<'percentage' | 'fixed'>('fixed');

  useEffect(() => {
    if (initialData) {
      setUserName(initialData.userName);
      setType(initialData.type);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate || '');
      setInterestEnabled(initialData.interestEnabled ?? (initialData.dailyInterestRate !== undefined && initialData.dailyInterestRate > 0));
      setDailyInterestRate(initialData.dailyInterestRate ?? 10);
      setInterestType(initialData.interestType || 'fixed');
    } else if (isOpen) {
      setUserName('');
      setType('Installment');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setInterestEnabled(true);
      setDailyInterestRate(10);
      setInterestType('fixed');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const record: LedgerRecord = initialData ? {
      ...initialData,
      userName,
      type,
      startDate,
      endDate: endDate || undefined,
      interestEnabled,
      dailyInterestRate: interestEnabled ? (Number(dailyInterestRate) || 0) : 0,
      interestType,
      waiveInterest: !interestEnabled,
      shareKey: initialData.shareKey || generateShareKey(),
    } : {
      id: generateJayTINId(),
      shareKey: generateShareKey(),
      userName,
      type,
      totalAmount: 0,
      paidAmount: 0,
      startDate,
      endDate: endDate || undefined,
      interestEnabled,
      dailyInterestRate: interestEnabled ? (Number(dailyInterestRate) || 0) : 0,
      interestType,
      waiveInterest: !interestEnabled,
      items: [],
      payments: [],
      notes: [{ id: `N-${Date.now()}`, timestamp: new Date().toLocaleString(), content: 'Protocol initialized with interest tracking.' }],
      attachments: [],
      status: 'Active'
    };
    onSave(record);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0F2C59]/40 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} 
        className="glass-card w-full max-w-lg rounded-[36px] overflow-hidden border border-white/80 shadow-2xl relative z-10 bg-white"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        <div className="p-8 border-b border-blue-50 flex justify-between items-center bg-blue-50/40">
          <div>
            <h3 className="text-xl font-bold text-[#0F2C59]">{initialData ? 'Refine Protocol' : 'Initialize Ledger'}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1">Private Registry Entry</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors active-scale">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-2 px-1">Client Profile Name</label>
              <input required type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full Legal Name" className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-2 px-1">Start Date</label>
                <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-2 px-1">Maturity Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-2 px-1">Protocol Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as PaymentType)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none appearance-none cursor-pointer">
                <option value="Installment">Installment Agreement</option>
                <option value="Delayed">Delayed Settlement</option>
              </select>
            </div>

            {/* Overdue Daily Interest System Settings */}
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block">
                    Daily Overdue Interest System
                  </label>
                  <p className="text-[9px] text-slate-500">
                    Compounding rule: Overdue Days × Daily Rate
                  </p>
                </div>
                {/* Interest Toggle Button */}
                <button
                  type="button"
                  onClick={() => setInterestEnabled(!interestEnabled)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm active-scale ${
                    interestEnabled
                      ? 'bg-[#0F2C59] text-[#B8A17D] border border-[#B8A17D]/40'
                      : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${interestEnabled ? 'bg-[#B8A17D]' : 'bg-slate-300'}`} />
                  <span>{interestEnabled ? 'Interest Enabled' : 'Enable Interest'}</span>
                </button>
              </div>

              {interestEnabled ? (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-1">
                        Calculation Mode
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-blue-100 p-0.5 bg-white">
                        <button
                          type="button"
                          onClick={() => setInterestType('fixed')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            interestType === 'fixed'
                              ? 'bg-[#0F2C59] text-white'
                              : 'text-slate-500 hover:text-[#0F2C59]'
                          }`}
                        >
                          Fixed (RM/d)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterestType('percentage')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                            interestType === 'percentage'
                              ? 'bg-[#0F2C59] text-white'
                              : 'text-slate-500 hover:text-[#0F2C59]'
                          }`}
                        >
                          Rate (%/d)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-1">
                        {interestType === 'fixed' ? 'Daily Rate (RM)' : 'Daily Rate (%)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          {interestType === 'fixed' ? 'RM' : '%'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step={interestType === 'fixed' ? '1' : '0.1'}
                          value={dailyInterestRate}
                          onChange={(e) => setDailyInterestRate(parseFloat(e.target.value) || 0)}
                          placeholder="10"
                          className="w-full bg-white border border-blue-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none font-bold text-[#0F2C59]"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">
                    * Overdue calculations automatically compound past maturity and are displayed in the 3-page PDF.
                  </p>
                </div>
              ) : (
                <div className="py-2 px-3 bg-white/60 rounded-xl border border-blue-100 text-[10px] text-slate-400">
                  Interest currently disabled. Click "Enable Interest" above to specify daily terms.
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="w-full bg-[#0F2C59] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-[#153A6B] transition-all">Archive Protocol</button>
        </form>
      </motion.div>
    </div>
  );
};

export default RecordFormModal;
