import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingBag, ImageIcon, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { PurchaseItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PurchaseItem) => void;
  initialData?: PurchaseItem;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DRAFT_KEY = 'jaytin_item_draft';

const AddItemModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [extraBalance, setExtraBalance] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [hasCustomInterest, setHasCustomInterest] = useState(false);
  const [dailyInterestRate, setDailyInterestRate] = useState<number>(0);
  const [interestType, setInterestType] = useState<'percentage' | 'fixed'>('fixed');
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName('');
    setAmount(0);
    setExtraBalance(0);
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNote('');
    setHasCustomInterest(false);
    setDailyInterestRate(0);
    setInterestType('fixed');
    setItemImage(null);
    setError(null);
    localStorage.removeItem(DRAFT_KEY);
  }

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount);
      setExtraBalance(initialData.extraBalance || 0);
      setDate(initialData.date);
      setDueDate(initialData.dueDate || '');
      setNote(initialData.note || '');
      setItemImage(initialData.attachment?.data || null);
      if (initialData.dailyInterestRate !== undefined && initialData.dailyInterestRate > 0) {
        setHasCustomInterest(true);
        setDailyInterestRate(initialData.dailyInterestRate);
        setInterestType(initialData.interestType || 'fixed');
      } else {
        setHasCustomInterest(false);
        setDailyInterestRate(0);
        setInterestType('fixed');
      }
    } else if (isOpen) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setName(parsed.name || '');
          setAmount(parsed.amount || 0);
          setExtraBalance(parsed.extraBalance || 0);
          setNote(parsed.note || '');
        } catch (e) {}
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Proof photo exceeds 5MB limit.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setItemImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setItemImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) {
      setError("Verify entry details.");
      return;
    }
    
    const item: PurchaseItem = {
      id: initialData?.id || `I-${Date.now()}`,
      name: name.trim(),
      amount: Number(amount),
      extraBalance: Number(extraBalance) || 0,
      date,
      dueDate: dueDate || undefined,
      note,
      dailyInterestRate: hasCustomInterest ? Number(dailyInterestRate) : undefined,
      interestType: hasCustomInterest ? interestType : undefined,
      attachment: itemImage ? {
        id: initialData?.attachment?.id || `A-I-${Date.now()}`,
        name: `Asset: ${name}`,
        data: itemImage,
        type: 'image',
      } : undefined
    };

    onSubmit(item);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0F2C59]/40 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-lg rounded-[40px] overflow-hidden border border-white/80 shadow-2xl relative z-10 bg-white"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        <div className="p-8 border-b border-blue-50 flex justify-between items-center bg-blue-50/40">
          <div>
            <h3 className="text-xl font-bold text-[#0F2C59]">{initialData ? 'Refine Asset' : 'Declare Asset'}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Registry Protocol</p>
          </div>
          <div className="flex items-center space-x-2">
            {!initialData && (name || amount > 0) && (
              <button type="button" onClick={resetForm} className="p-2 text-slate-400 hover:text-rose-500 active-scale"><RotateCcw className="w-4 h-4" /></button>
            )}
            <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-full active-scale transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Asset Name</label>
            <input required type="text" placeholder="Artifact Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Valuation (RM)</label>
              <input required type="number" step="0.01" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none font-bold text-[#0F2C59]" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-widest block px-1">Extra Balance / Surcharge (RM)</label>
              <input type="number" step="0.01" value={extraBalance || ''} onChange={(e) => setExtraBalance(Number(e.target.value))} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none font-bold text-[#1E3A8A]" placeholder="0.00" title="Extra balance or surcharge on this order" />
            </div>
          </div>

          {extraBalance > 0 && (
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-[#0F2C59] font-bold flex justify-between">
              <span>Combined Valuation:</span>
              <span className="text-[#1E3A8A]">RM{(Number(amount || 0) + Number(extraBalance || 0)).toLocaleString()}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Order Date</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3.5 text-xs focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-widest block px-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3.5 text-xs focus:outline-none" title="Maturity date for this specific order" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Annotation</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference notes..." className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-xs focus:outline-none min-h-[70px]" />
          </div>

          {/* Single Order Interest Settings */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#1E3A8A] mr-2 inline-block" />
                Custom Order Daily Interest
              </label>
              <label className="text-[10px] font-bold text-slate-500 flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCustomInterest}
                  onChange={(e) => setHasCustomInterest(e.target.checked)}
                  className="rounded text-[#1E3A8A] focus:ring-0 mr-1"
                />
                <span>Custom Rate</span>
              </label>
            </div>

            {hasCustomInterest && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Method
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-blue-100 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => setInterestType('fixed')}
                      className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                        interestType === 'fixed' ? 'bg-[#0F2C59] text-white' : 'text-slate-500'
                      }`}
                    >
                      Fixed (RM/d)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterestType('percentage')}
                      className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                        interestType === 'percentage' ? 'bg-[#0F2C59] text-white' : 'text-slate-500'
                      }`}
                    >
                      Rate (%/d)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    {interestType === 'fixed' ? 'Daily Amount (RM)' : 'Daily Rate (%)'}
                  </label>
                  <input
                    type="number"
                    step={interestType === 'fixed' ? '0.5' : '0.1'}
                    value={dailyInterestRate}
                    onChange={(e) => setDailyInterestRate(parseFloat(e.target.value) || 0)}
                    placeholder="5"
                    className="w-full bg-white border border-blue-100 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2C59] focus:outline-none"
                  />
                </div>
              </div>
            )}
            <p className="text-[8px] text-slate-400 italic">
              {hasCustomInterest 
                ? 'Active: Overdue accrual is calculated individually for this item in PDF and ledger.'
                : 'Uses protocol default rate. Check box to specify custom daily interest for this item.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Evidence Photo</label>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div 
              onClick={() => !itemImage && fileInputRef.current?.click()} 
              className={`w-full h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all relative group overflow-hidden ${itemImage ? 'border-transparent' : 'border-blue-100 hover:border-[#1E3A8A]/40 hover:bg-blue-50/30 cursor-pointer'}`}
            >
              {itemImage ? (
                <>
                  <img src={itemImage} className="w-full h-full object-cover" />
                  <button onClick={handleRemoveImage} className="absolute top-3 right-3 p-2 bg-[#0A192F]/70 text-white rounded-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-6 h-6 text-slate-300 mb-2 group-hover:text-[#1E3A8A]" />
                  <span className="text-[9px] uppercase font-bold text-slate-400">Click to upload artifact image</span>
                </>
              )}
            </div>
            {error && <p className="text-[10px] text-rose-500 mt-2 flex items-center font-bold uppercase"><AlertCircle className="w-3 h-3 mr-1"/> {error}</p>}
          </div>

          <button type="submit" className="w-full bg-[#0F2C59] hover:bg-[#153A6B] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.4em] shadow-xl transition-all active-scale">Confirm Archive</button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddItemModal;
