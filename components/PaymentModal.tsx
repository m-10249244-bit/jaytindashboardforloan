import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ImageIcon, AlertCircle, Trash2 } from 'lucide-react';
import { PaymentMethod, PaymentRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: any) => void;
  maxAmount: number;
  initialData?: PaymentRecord;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, maxAmount, initialData }) => {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('BANK');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setAmount(0);
    setMethod('BANK');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setProofImage(null);
    setError(null);
  }

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount);
      setMethod(initialData.method);
      setDate(initialData.date);
      setNote(initialData.note || '');
      setProofImage(initialData.attachment?.data || null);
    } else if (isOpen) {
      resetForm();
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Image exceeds 5MB limit.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setProofImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProofImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    
    const payment: any = {
      id: initialData?.id || `P-${Date.now()}`,
      amount: Number(amount),
      method,
      date,
      note,
      attachment: proofImage ? {
        id: initialData?.attachment?.id || `A-P-${Date.now()}`,
        name: `Proof of Payment`,
        data: proofImage,
        type: 'image',
      } : undefined
    };

    onSubmit(payment);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0F2C59]/40 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-md rounded-[40px] overflow-hidden border border-white/80 shadow-2xl relative z-10 bg-white"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        <div className="p-8 border-b border-blue-50 flex justify-between items-center bg-blue-50/40">
          <div>
            <h3 className="text-xl font-bold text-[#0F2C59]">{initialData ? 'Refine Injection' : 'Inject Capital'}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Capital Transfer Protocol</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors active-scale">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Amount (RM)</label>
              <input required type="number" step="0.01" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none font-bold text-[#0F2C59]" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Date</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-2 px-1">Injection Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'BANK', 'E-Wallet'].map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m as PaymentMethod)} className={`py-3 text-[10px] font-bold rounded-xl border transition-all ${method === m ? 'bg-[#0F2C59] text-white border-[#0F2C59]' : 'bg-blue-50/40 border-blue-100 text-slate-500 hover:bg-white'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Transaction Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference description..." className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-xs focus:outline-none min-h-[80px]" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block px-1">Receipt Artifact</label>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div 
              onClick={() => !proofImage && fileInputRef.current?.click()} 
              className={`w-full h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${proofImage ? 'border-transparent' : 'border-blue-100 hover:border-[#1E3A8A]/40 hover:bg-blue-50/30 cursor-pointer'}`}
            >
              {proofImage ? (
                <>
                  <img src={proofImage} className="w-full h-full object-cover" />
                  <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-[#0A192F]/70 text-white rounded-xl backdrop-blur-sm transition-all active:scale-95"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 text-slate-300 mb-1" />
                  <span className="text-[8px] uppercase font-bold text-slate-400">Click to upload receipt</span>
                </>
              )}
            </div>
            {error && <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> {error}</p>}
          </div>

          <button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.4em] shadow-lg active-scale transition-all">Log Injection</button>
        </form>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
