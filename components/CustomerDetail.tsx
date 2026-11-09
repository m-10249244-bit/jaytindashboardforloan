import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShoppingBag, CreditCard, Edit2, 
  Image as ImageIcon, Share2, Check, Trash2, AlertCircle, Target, TrendingDown, Clock, Plus, ShieldCheck, Maximize2, Download, FileText, Percent, KeyRound
} from 'lucide-react';
import { LedgerRecord, PurchaseItem, PaymentRecord, AppSettings } from '../types';
import AddItemModal from './AddItemModal';
import PaymentModal from './PaymentModal';
import RecordFormModal from './RecordFormModal';
import PDFExportModal from './PDFExportModal';

interface Props {
  record: LedgerRecord;
  isViewOnly?: boolean;
  onClose: () => void;
  onUpdateRecord: (record: LedgerRecord) => void;
  onDeleteRecord?: (id: string) => void;
  stats?: any;
  allRecords?: LedgerRecord[];
  settings?: AppSettings;
}

const CustomerDetail: React.FC<Props> = ({ record, isViewOnly = false, onClose, onUpdateRecord, onDeleteRecord, stats, allRecords, settings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'history'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseItem | undefined>(undefined);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | undefined>(undefined);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPDFOpen, setIsPDFOpen] = useState(false);

  const progress = (record.paidAmount / record.totalAmount) * 100 || 0;
  const remainingPrincipal = Math.max(0, record.totalAmount - record.paidAmount);
  const calculatedInterest = record.calculatedInterest || 0;
  const grandTotalRemaining = remainingPrincipal + calculatedInterest;
  const isOverdue = record.status === 'Overdue';
  const overdueDays = record.overdueDays || 0;

  const handleSettleCompletely = () => {
    if (!confirm("Confirm full settlement of this protocol?")) return;
    const nextRecord = { 
      ...record, 
      paidAmount: record.totalAmount, 
      status: 'Settled' as const,
      calculatedInterest: 0,
      notes: [{ id: `N-${Date.now()}`, timestamp: new Date().toLocaleString(), content: 'Protocol manually settled and closed.' }, ...record.notes]
    };
    onUpdateRecord(nextRecord);
  };

  const handleUpdateItem = (item: PurchaseItem) => {
    let nextItems = [...record.items];
    const index = nextItems.findIndex(i => i.id === item.id);
    if (index >= 0) nextItems[index] = item;
    else nextItems = [item, ...nextItems];

    const total = nextItems.reduce((sum, i) => sum + i.amount, 0);
    const paid = record.payments.reduce((sum, p) => sum + p.amount, 0);
    onUpdateRecord({ ...record, items: nextItems, totalAmount: total, paidAmount: paid });
    setIsAddingItem(false);
    setEditingItem(undefined);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Remove this asset?")) return;
    const nextItems = record.items.filter(i => i.id !== id);
    const total = nextItems.reduce((sum, i) => sum + i.amount, 0);
    onUpdateRecord({ ...record, items: nextItems, totalAmount: total });
  };

  const handleUpdatePayment = (payment: PaymentRecord) => {
    let nextPayments = [...record.payments];
    const index = nextPayments.findIndex(p => p.id === payment.id);
    if (index >= 0) nextPayments[index] = payment;
    else nextPayments = [payment, ...nextPayments];

    const paid = nextPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus = paid >= record.totalAmount ? 'Settled' : record.status;
    onUpdateRecord({ ...record, payments: nextPayments, paidAmount: paid, status: newStatus as any });
    setIsRecordingPayment(false);
    setEditingPayment(undefined);
  };

  const handleDeletePayment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Void this injection record?")) return;
    const nextPayments = record.payments.filter(p => p.id !== id);
    const paid = nextPayments.reduce((sum, p) => sum + p.amount, 0);
    onUpdateRecord({ ...record, payments: nextPayments, paidAmount: paid });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F2C59]/40 backdrop-blur-xl p-0 md:p-8">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
        className="glass-card w-full max-w-6xl h-full md:max-h-[92vh] md:rounded-[48px] overflow-hidden flex flex-col relative shadow-2xl border border-white/80"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        
        {/* Header */}
        <div className="p-6 md:p-10 pb-4 relative flex flex-col md:flex-row justify-between items-start gap-8 bg-white/40 border-b border-blue-50">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/70 rounded-full z-10 border border-white/60 hover:bg-white active-scale shadow-sm transition-colors">
            <X className="w-6 h-6 text-slate-400 hover:text-[#0F2C59]" />
          </button>
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#B8A17D] uppercase tracking-[0.3em] font-bold">{isViewOnly ? 'Identity Vault' : 'Protocol Detail'}</span>
              <div className={`px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${isOverdue ? 'bg-rose-500 text-white animate-pulse border-rose-400' : 'bg-white/60 text-[#1E3A8A] border-blue-100'}`}>
                {record.status}
              </div>
              {isOverdue && overdueDays > 0 && (
                <div className="px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest bg-amber-500 text-white border border-amber-400">
                  Overdue: {overdueDays}d (+RM{calculatedInterest.toLocaleString()})
                </div>
              )}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#0F2C59] tracking-tight">{record.userName}</h2>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {!isViewOnly && (
                <>
                  <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-white/80 border border-blue-100 rounded-xl text-[#1E3A8A] active-scale shadow-sm hover:bg-white" title="Edit Profile"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={handleSettleCompletely} className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 active-scale shadow-sm hover:bg-emerald-100" title="Instant Settle"><ShieldCheck className="w-4 h-4" /></button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 active-scale shadow-sm hover:bg-rose-100" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
              {/* PDF Export Button */}
              <button 
                onClick={() => setIsPDFOpen(true)}
                className="px-4 py-2 bg-[#0F2C59] text-[#B8A17D] border border-[#B8A17D]/40 rounded-xl text-[10px] font-bold uppercase tracking-widest active-scale flex items-center shadow-md hover:bg-[#153A6B] transition-colors"
                title="Download 3-Page Financial Protocol PDF"
              >
                <Download className="w-4 h-4 mr-2 text-[#B8A17D]" />
                <span>3-Page PDF</span>
              </button>

              {/* 6-Digit Access OTP Generation */}
              {!isViewOnly && (
                <button
                  onClick={() => {
                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                    onUpdateRecord({ ...record, accessOtp: otp });
                    alert(`One-Time Passcode Generated for ${record.userName}:\n\nPasscode: ${otp}\n\nShare this 6-digit passcode with the client to unlock their private ledger.`);
                  }}
                  className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded-xl text-[10px] font-bold uppercase tracking-widest active-scale flex items-center shadow-sm hover:bg-amber-500/20"
                  title="Generate 6-Digit One-Time Passcode"
                >
                  <KeyRound className="w-4 h-4 mr-1.5 text-amber-600" />
                  <span>{record.accessOtp ? `OTP: ${record.accessOtp}` : 'Generate OTP'}</span>
                </button>
              )}

              <button onClick={() => { 
                const url = `${window.location.origin}${window.location.pathname}#/share/${record.shareKey}`; 
                navigator.clipboard.writeText(url); 
                setCopied(true); 
                setTimeout(() => setCopied(false), 2000); 
              }} className="px-4 py-2 bg-white/80 border border-blue-100 rounded-xl text-[10px] font-bold uppercase tracking-widest active-scale text-[#1E3A8A] flex items-center shadow-sm hover:bg-white">
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Share2 className="w-4 h-4 mr-2" />} {copied ? 'Copied' : 'Share URL'}
              </button>
            </div>
          </div>

          {/* Header Exposure Card */}
          <div className="w-full md:w-96 p-6 rounded-[32px] bg-gradient-to-br from-[#0F2C59] to-[#153A6B] text-white shadow-2xl space-y-4 border border-[#1E3A8A]">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Protocol Fulfillment</span>
              <span className="text-sm font-bold text-amber-300">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#B8A17D] to-[#E0E7FF]" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-[8px] text-slate-300 uppercase tracking-widest font-bold">Injected</p>
                <p className="text-lg font-bold">RM{record.paidAmount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-300 uppercase tracking-widest font-bold">
                  {calculatedInterest > 0 ? 'Total Due (w/ Interest)' : 'Exposure'}
                </p>
                <p className={`text-lg font-bold ${isOverdue ? 'text-amber-300' : 'text-emerald-300'}`}>
                  RM{grandTotalRemaining.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-4 md:px-12 border-b border-blue-50 bg-white/20">
          <div className="flex">
            {['overview', 'items', 'history'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-5 px-6 md:px-8 text-[10px] font-bold uppercase tracking-[0.3em] relative ${activeTab === tab ? 'text-[#0F2C59]' : 'text-slate-400'}`}>
                {tab}{activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E3A8A] rounded-t-full" />}
              </button>
            ))}
          </div>
          {!isViewOnly && (
            <div className="flex items-center space-x-2">
              {activeTab === 'items' && (
                <button onClick={() => { setEditingItem(undefined); setIsAddingItem(true); }} className="flex items-center space-x-2 px-4 py-2 bg-[#0F2C59] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest active-scale shadow-md hover:bg-[#153A6B]">
                  <Plus className="w-3.5 h-3.5" /> <span>Declare Asset</span>
                </button>
              )}
              {activeTab === 'history' && (
                <button onClick={() => { setEditingPayment(undefined); setIsRecordingPayment(true); }} className="flex items-center space-x-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest active-scale shadow-md hover:bg-[#1D4ED8]">
                  <Plus className="w-3.5 h-3.5" /> <span>Inject Capital</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 pt-8 custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-8 rounded-[32px] bg-white/80 border border-white shadow-xl flex flex-col justify-between">
                    <Target className="w-6 h-6 text-[#1E3A8A] mb-4" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agreement Valuation</p>
                      <h4 className="text-2xl font-bold text-[#0F2C59]">RM{record.totalAmount.toLocaleString()}</h4>
                    </div>
                 </div>
                 <div className={`p-8 rounded-[32px] border shadow-xl flex flex-col justify-between ${isOverdue ? 'bg-rose-50/80 border-rose-200' : 'bg-white/80 border-white'}`}>
                    <TrendingDown className={`w-6 h-6 mb-4 ${isOverdue ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {calculatedInterest > 0 ? 'Total Due (w/ Overdue Interest)' : 'Active Exposure'}
                      </p>
                      <h4 className={`text-2xl font-bold ${isOverdue ? 'text-rose-600' : 'text-[#0F2C59]'}`}>
                        RM{grandTotalRemaining.toLocaleString()}
                      </h4>
                      {calculatedInterest > 0 && (
                        <p className="text-[10px] font-bold text-amber-700 mt-1">
                          Principal RM{remainingPrincipal.toLocaleString()} + Interest RM{calculatedInterest.toLocaleString()}
                        </p>
                      )}
                    </div>
                 </div>
                 <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#1E3A8A] to-[#153A6B] text-white shadow-xl flex flex-col justify-between">
                    <Clock className="w-6 h-6 text-white/60 mb-4" />
                    <div>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Maturity Date</p>
                      <h4 className="text-xl font-bold">{record.endDate || 'N/A'}</h4>
                    </div>
                 </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evidence Gallery</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[...(record.attachments || []), ...record.items.filter(i => i.attachment).map(i => i.attachment!)].map((att, idx) => (
                      <div key={idx} onClick={() => setFullScreenImage(att.data)} className="aspect-square bg-white border border-blue-50 rounded-2xl overflow-hidden cursor-pointer active-scale shadow-sm group">
                        <img src={att.data} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                    ))}
                    {record.items.length === 0 && <div className="col-span-3 text-[10px] text-slate-400 font-bold uppercase italic py-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">No artifacts uploaded.</div>}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Logs</h4>
                  <div className="space-y-3">
                    {record.notes.map(note => (
                      <div key={note.id} className="p-5 bg-white/70 rounded-2xl border border-white shadow-sm">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-2 flex items-center"><Clock className="w-2.5 h-2.5 mr-1.5" /> {note.timestamp}</p>
                        <p className="text-xs text-[#0F2C59] leading-relaxed font-medium">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {record.items.map(item => (
                <div key={item.id} onClick={() => !isViewOnly && (setEditingItem(item), setIsAddingItem(true))} className="group p-6 bg-white/80 border border-white rounded-[32px] shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex space-x-4">
                  {item.attachment && (
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                      <img src={item.attachment.data} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-bold text-[#1E3A8A] uppercase tracking-widest">{item.date}</span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          item.overdueDays && item.overdueDays > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-slate-500 bg-blue-50/60'
                        }`}>
                          Due: {item.dueDate || record.endDate || 'N/A'}
                          {item.overdueDays && item.overdueDays > 0 ? ` (Overdue: ${item.overdueDays}d)` : ''}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-[#0F2C59] leading-tight">{item.name}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <span className="text-xl font-bold text-[#0F2C59]">RM{item.amount.toLocaleString()}</span>
                        {item.calculatedInterest !== undefined && item.calculatedInterest > 0 ? (
                          <p className="text-[10px] font-bold text-amber-700">
                            Item Interest: +RM{item.calculatedInterest.toLocaleString()}
                          </p>
                        ) : (
                          item.dailyInterestRate !== undefined && item.dailyInterestRate > 0 && (
                            <p className="text-[9px] text-slate-400">
                              Item Rate: {item.interestType === 'percentage' ? `${item.dailyInterestRate}%` : `RM${item.dailyInterestRate}`}/d
                            </p>
                          )
                        )}
                      </div>
                      {!isViewOnly && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsAddingItem(true); }} className="p-2 bg-blue-50 rounded-lg text-slate-400 hover:text-[#1E3A8A]"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => handleDeleteItem(e, item.id)} className="p-2 bg-rose-50 rounded-lg text-rose-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {record.items.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 text-sm font-medium">No assets declared in this protocol.</div>}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {record.payments.map(payment => (
                <div key={payment.id} onClick={() => !isViewOnly && (setEditingPayment(payment), setIsRecordingPayment(true))} className="group flex items-center space-x-6 p-6 bg-white/80 border border-white rounded-[32px] shadow-sm hover:shadow-xl transition-all cursor-pointer">
                  {payment.attachment ? (
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                      <img src={payment.attachment.data} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shrink-0"><Check className="w-6 h-6 text-emerald-500" /></div>
                  )}
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-[#1E3A8A] uppercase tracking-widest">{payment.method} • {payment.date}</p>
                    <p className="text-base font-bold text-[#0F2C59]">Injection Confirmed</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-emerald-600">+RM{payment.amount.toLocaleString()}</span>
                    {!isViewOnly && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={(e) => { e.stopPropagation(); setEditingPayment(payment); setIsRecordingPayment(true); }} className="p-2 text-slate-400 hover:text-[#1E3A8A]"><Edit2 className="w-3.5 h-3.5" /></button>
                         <button onClick={(e) => handleDeletePayment(e, payment.id)} className="p-2 text-rose-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {record.payments.length === 0 && <div className="py-20 text-center text-slate-400 text-sm font-medium">No injection history found.</div>}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isPDFOpen && (
            <PDFExportModal isOpen={isPDFOpen} onClose={() => setIsPDFOpen(false)} record={record} settings={settings} />
          )}
          {isAddingItem && (
            <AddItemModal isOpen={isAddingItem} onClose={() => { setIsAddingItem(false); setEditingItem(undefined); }} onSubmit={handleUpdateItem} initialData={editingItem} />
          )}
          {isRecordingPayment && (
            <PaymentModal isOpen={isRecordingPayment} onClose={() => { setIsRecordingPayment(false); setEditingPayment(undefined); }} onSubmit={handleUpdatePayment} maxAmount={999999} initialData={editingPayment} />
          )}
          {isEditingProfile && (
            <RecordFormModal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} onSave={onUpdateRecord} initialData={record} />
          )}
          {fullScreenImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFullScreenImage(null)} className="fixed inset-0 z-[200] bg-[#0A192F]/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out">
              <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <button className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X className="w-8 h-8" /></button>
            </motion.div>
          )}
          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-[#0A192F]/50 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl mx-auto flex items-center justify-center"><AlertCircle className="w-10 h-10 text-rose-500" /></div>
                <div><h4 className="text-2xl font-bold text-[#0F2C59]">Terminate Protocol?</h4><p className="text-xs text-slate-500 mt-2 font-medium">This bond will be permanently erased. This cannot be undone.</p></div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { if(onDeleteRecord) onDeleteRecord(record.id); onClose(); }} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest active-scale">Confirm Destruction</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest active-scale">Abort</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CustomerDetail;
