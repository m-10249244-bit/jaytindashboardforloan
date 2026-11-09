
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Info } from 'lucide-react';
import { LedgerRecord, PaymentType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: LedgerRecord) => void;
}

const generateJayTINId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'JayTIN';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Added generateShareKey to satisfy LedgerRecord requirement
const generateShareKey = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AddRecordModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [userName, setUserName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [type, setType] = useState<PaymentType>('Installment');
  const [cycle, setCycle] = useState<'Day' | 'Weekly' | 'Monthly'>('Monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Included shareKey in the new record object
    const newRecord: LedgerRecord = {
      id: generateJayTINId(),
      shareKey: generateShareKey(),
      userName,
      type,
      totalAmount: 0, // Records start empty, total is derived from items
      paidAmount: 0,
      paymentCycle: type === 'Installment' ? cycle : undefined,
      startDate: new Date().toISOString().split('T')[0],
      items: [],
      payments: [],
      notes: [
        { 
          id: `N-${Date.now()}`, 
          timestamp: new Date().toLocaleString(), 
          content: 'Protocol initialized.' 
        }
      ],
      attachments: [],
      status: 'Active'
    };
    onAdd(newRecord);
    setUserName('');
    setTotalAmount(0);
    setType('Installment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#EBFAFF]/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="glass-card w-full max-w-lg rounded-[48px] overflow-hidden border border-white/60 shadow-2xl relative z-10"
      >
        <div className="p-10 pb-6 border-b border-white/20 flex justify-between items-center bg-white/10">
          <div>
            <h3 className="text-2xl font-jua text-[#333]">Initialize Ledger</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mt-1">Creating financial bond</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/30 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Client Profile Name</label>
              <input 
                required
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Full Legal Name"
                className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#B8A17D]/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Protocol Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as PaymentType)}
                  className="w-full bg-white/40 border border-white/30 rounded-2xl px-5 py-4 text-sm focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Installment">Installment Agreement</option>
                  <option value="Delayed">Delayed Settlement</option>
                </select>
              </div>

              {type === 'Installment' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Cycle Frequency</label>
                  <div className="flex space-x-1 p-1 bg-white/30 rounded-2xl border border-white/20">
                    {['Day', 'Weekly', 'Monthly'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCycle(c as any)}
                        className={`flex-1 py-2 text-[9px] font-bold rounded-xl transition-all uppercase tracking-tighter ${cycle === c ? 'bg-[#333] text-white' : 'text-gray-400'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex items-start space-x-4 p-5 rounded-[24px] bg-white/30 border border-white/20">
              <Info className="w-5 h-5 text-[#B8A17D] mt-0.5 shrink-0" />
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                Preservation starts with an empty valuation. Add artifacts (items) to the record after initialization to define total outstanding capital.
              </p>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#999] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.4em] shadow-xl gold-glow border border-[#B8A17D]/30 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            Preserve Registry
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddRecordModal;
