import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, FileText, CheckCircle2, Shield, Calendar, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LedgerRecord, AppSettings } from '../types';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: LedgerRecord;
  settings?: AppSettings;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({ isOpen, onClose, record, settings }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  // 3 Independent Page Refs
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const principalRemaining = Math.max(0, record.totalAmount - record.paidAmount);
  const calculatedInterest = record.calculatedInterest || 0;
  const grandTotalRemaining = principalRemaining + calculatedInterest;
  const isOverdue = record.status === 'Overdue';
  const overdueDays = record.overdueDays || 0;
  const progress = record.totalAmount > 0 ? (record.paidAmount / record.totalAmount) * 100 : 0;

  const brandTitle = settings?.brandName || 'JayTIN TEAM';
  const logoImage = settings?.logoUrl;
  const signatureImage = settings?.signatureUrl;
  const signerName = settings?.signerName || 'Jayden Ting';
  const signerTitle = settings?.signerTitle || 'Managing Director & Auditor';

  // 3-Page Clean PDF Export
  const handleDownloadPDF = async () => {
    if (!page1Ref.current || !page2Ref.current || !page3Ref.current) return;
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pages = [page1Ref.current, page2Ref.current, page3Ref.current];

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false,
          windowWidth: 800,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
      }

      pdf.save(`${brandTitle.replace(/\s+/g, '_')}_Protocol_${record.userName.replace(/\s+/g, '_')}_${record.id}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#0A192F]/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-4xl max-h-[92vh] rounded-[36px] overflow-hidden flex flex-col bg-white border border-white/80 shadow-2xl relative"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        {/* Top Header Bar */}
        <div className="p-6 px-8 border-b border-blue-50 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center space-x-3">
            {logoImage ? (
              <img src={logoImage} alt="Logo" className="w-10 h-10 rounded-2xl object-contain bg-white border border-blue-100 p-1 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#0F2C59] text-[#B8A17D] flex items-center justify-center border border-[#B8A17D]/30 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-[#0F2C59]">{brandTitle} 3-Page Financial Protocol PDF</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page 1: Profile & Overview · Page 2: Orders & Due Dates · Page 3: Payment History & Seal
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-[#0F2C59] text-[#B8A17D] rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2 active-scale shadow-md hover:bg-[#153A6B] transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-[#B8A17D] border-t-transparent rounded-full" />
                  <span>Exporting 3 Pages...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download 3-Page PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-[#0F2C59] bg-white rounded-xl border border-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#EBFAFF]/60 flex flex-col items-center space-y-10 custom-scrollbar">
          
          {/* ============================================================ */}
          {/* PAGE 1: Identity & Executive Overview */}
          {/* ============================================================ */}
          <div className="w-full flex flex-col items-center">
            <div className="text-[10px] font-bold text-[#0F2C59]/60 uppercase tracking-[0.3em] mb-2">Page 1: Client Profile & Financial Overview</div>
            <div
              ref={page1Ref}
              className="w-[720px] h-[1018px] bg-white rounded-[20px] shadow-2xl p-12 relative flex flex-col justify-between text-[#0F2C59] border border-blue-100 overflow-hidden"
              style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
            >
              {/* Decorative Gradients */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#B8A17D]/15 to-transparent rounded-bl-[140px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#0F2C59]/5 to-transparent rounded-tr-[140px] pointer-events-none" />

              {/* Page 1 Header */}
              <div className="relative z-10 border-b-2 border-slate-100 pb-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    {logoImage && (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-blue-100 p-1 shadow-sm flex items-center justify-center">
                        <img src={logoImage} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#B8A17D]" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#B8A17D]">
                          {brandTitle} Vault Statement
                        </span>
                      </div>
                      <h1 className="text-4xl font-bold text-[#0F2C59]">{brandTitle}</h1>
                      <p className="text-xs text-slate-400 font-semibold tracking-wider mt-1">
                        Official Client Balance Protocol · PAGE 01 / 03
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm ${
                      record.status === 'Overdue' ? 'bg-rose-500' : 'bg-[#0F2C59]'
                    }`}>
                      {record.status === 'Overdue' ? '⚠️ OVERDUE ACCRUING' : record.status}
                    </div>
                    <p className="text-xs font-mono text-slate-500 font-bold">UID: {record.id}</p>
                    <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>

              {/* Page 1: User Profile Card */}
              <div className="relative z-10 py-6 border-b border-slate-100 space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    Client Identity Profile
                  </span>
                  <h2 className="text-3xl font-bold text-[#0F2C59] mt-1">{record.userName}</h2>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Agreement Type: <span className="font-bold text-[#0F2C59]">{record.type} Protocol</span></p>
                    <p className="text-xs text-slate-500">Billing Cycle: <span className="font-bold text-[#0F2C59]">{record.paymentCycle ? `Every ${record.paymentCycle}` : 'Maturity Settlement'}</span></p>
                    <p className="text-xs text-slate-500">Commencement: <span className="font-mono font-bold text-[#0F2C59]">{record.startDate || 'N/A'}</span></p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-xs text-slate-500">Protocol Maturity: <span className="font-mono font-bold text-[#0F2C59]">{record.endDate || 'N/A'}</span></p>
                    <p className="text-xs text-slate-500">Interest Status: <span className="font-bold text-[#B8A17D]">{record.interestEnabled !== false ? 'Active Daily Accrual' : 'Inactive'}</span></p>
                    {isOverdue && (
                      <p className="text-xs font-bold text-rose-600 bg-rose-50 py-0.5 px-2 rounded inline-block">
                        Past Due: {overdueDays} Days
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Page 1: Financial Exposure Highlights */}
              <div className="relative z-10 py-6 space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  Capital Position Breakdown
                </span>
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Valuation</p>
                    <p className="text-3xl font-bold text-[#0F2C59] mt-2">RM{record.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Contract Principal</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Total Settled</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">RM{record.paidAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Fulfillment: {progress.toFixed(1)}%</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#0F2C59] text-white border border-[#1E3A8A] shadow-md">
                    <p className="text-[10px] font-bold text-[#B8A17D] uppercase tracking-widest">Total Exposure (w/ Interest)</p>
                    <p className="text-3xl font-bold text-white mt-2">RM{grandTotalRemaining.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-300 mt-1">Remaining + Accrued</p>
                  </div>
                </div>

                {/* Overdue Interest Summary Bar */}
                <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200/90">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[#0F2C59] uppercase tracking-wider">
                      Overdue Compounding Breakdown
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">
                      {record.interestType === 'percentage'
                        ? `${record.dailyInterestRate || 0}% daily`
                        : `RM${(record.dailyInterestRate || 0).toLocaleString()} / day`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center pt-2 border-t border-amber-200/60">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Unpaid Principal</p>
                      <p className="text-lg font-bold text-[#0F2C59]">RM{principalRemaining.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Overdue Days</p>
                      <p className="text-lg font-bold text-[#0F2C59]">{overdueDays} Days</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-800 font-bold">Accrued Interest</p>
                      <p className="text-lg font-bold text-amber-700">+RM{calculatedInterest.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="relative z-10 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
                <p>{brandTitle} Private Financial System • Page 1 of 3 (Identity & Overview)</p>
                <div className="text-right font-mono text-[10px]">VERIFIED BOND #{record.id}</div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 2: Declared Orders, Order Due Dates & Single Item Interest */}
          {/* ============================================================ */}
          <div className="w-full flex flex-col items-center">
            <div className="text-[10px] font-bold text-[#0F2C59]/60 uppercase tracking-[0.3em] mb-2">Page 2: Orders, Due Dates & Itemized Interest</div>
            <div
              ref={page2Ref}
              className="w-[720px] h-[1018px] bg-white rounded-[20px] shadow-2xl p-12 relative flex flex-col justify-between text-[#0F2C59] border border-blue-100 overflow-hidden"
              style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
            >
              <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-[#B8A17D]/10 to-transparent rounded-br-[140px] pointer-events-none" />

              {/* Page 2 Header */}
              <div className="relative z-10 border-b border-slate-200 pb-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {logoImage && (
                    <img src={logoImage} alt="Brand Logo" className="w-12 h-12 rounded-xl object-contain bg-white border border-blue-100 p-1 shadow-sm" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8A17D]">
                      Declared Asset Orders & Maturities
                    </span>
                    <h2 className="text-2xl font-bold text-[#0F2C59]">Order Items, Due Dates & Single Interest</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#0F2C59]">{record.userName}</p>
                  <p className="text-[10px] font-mono text-slate-400">PAGE 02 / 03</p>
                </div>
              </div>

              {/* Orders Table with Single Item Interest & Due Date */}
              <div className="relative z-10 flex-1 py-6">
                <div className="mb-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Itemized Order Breakdown (with Individual Due Dates)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Total: {record.items.length} Registered Items
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 font-bold">
                      <th className="py-3 px-2 text-[10px] uppercase">No.</th>
                      <th className="py-3 px-3 text-[10px] uppercase">Item Name / Note</th>
                      <th className="py-3 px-2 text-[10px] uppercase">Order Date</th>
                      <th className="py-3 px-2 text-[10px] uppercase">Due Date</th>
                      <th className="py-3 px-2 text-[10px] uppercase text-right">Principal</th>
                      <th className="py-3 px-2 text-[10px] uppercase text-right">Daily Rate</th>
                      <th className="py-3 px-2 text-[10px] uppercase text-right">Accrued Interest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {record.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                          No itemized assets registered. Single consolidated agreement applies.
                        </td>
                      </tr>
                    ) : (
                      record.items.map((item, idx) => {
                        const itemInterest = item.calculatedInterest || 0;
                        const itemDailyRate = item.dailyInterestRate !== undefined && item.dailyInterestRate > 0
                          ? (item.interestType === 'percentage' ? `${item.dailyInterestRate}%/d` : `RM${item.dailyInterestRate}/d`)
                          : (record.interestType === 'percentage' ? `${record.dailyInterestRate || 0}%/d` : `Standard`);
                        const itemEffectiveDueDate = item.dueDate || record.endDate || 'N/A';
                        const itemIsPastDue = (item.overdueDays || 0) > 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-2 font-mono text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-[#0F2C59]">
                              <div>{item.name}</div>
                              {item.note && <div className="text-[9px] text-slate-400 italic">{item.note}</div>}
                            </td>
                            <td className="py-3 px-2 font-mono text-slate-500 text-[10px]">{item.date}</td>
                            <td className="py-3 px-2 font-mono text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded font-bold ${itemIsPastDue ? 'bg-rose-50 text-rose-600' : 'text-slate-600'}`}>
                                {itemEffectiveDueDate}
                                {itemIsPastDue && ` (+${item.overdueDays}d)`}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right text-[#0F2C59] font-bold">
                              RM{item.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-[10px] text-slate-500">
                              {itemDailyRate}
                            </td>
                            <td className="py-3 px-2 text-right text-amber-700 font-bold">
                              {itemInterest > 0 ? `+RM${itemInterest.toLocaleString()}` : 'RM0'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold">
                      <td colSpan={4} className="py-3.5 px-3 text-right uppercase text-[10px] text-slate-600">
                        Total Order Valuation & Sum of Interests:
                      </td>
                      <td className="py-3.5 px-2 text-right text-sm text-[#0F2C59]">
                        RM{record.totalAmount.toLocaleString()}
                      </td>
                      <td></td>
                      <td className="py-3.5 px-2 text-right text-sm text-amber-700">
                        +RM{calculatedInterest.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Page 2 Footer */}
              <div className="relative z-10 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
                <p>{brandTitle} Private Financial System • Page 2 of 3 (Order Ledger & Item Interests)</p>
                <div className="text-right font-mono text-[10px]">AUTHORIZED BOND RECORD</div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 3: Payment History & Execution Proof with Authorized Stamp */}
          {/* ============================================================ */}
          <div className="w-full flex flex-col items-center">
            <div className="text-[10px] font-bold text-[#0F2C59]/60 uppercase tracking-[0.3em] mb-2">Page 3: Payment History & Official Seal</div>
            <div
              ref={page3Ref}
              className="w-[720px] h-[1018px] bg-white rounded-[20px] shadow-2xl p-12 relative flex flex-col justify-between text-[#0F2C59] border border-blue-100 overflow-hidden"
              style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
            >
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-[#B8A17D]/15 to-transparent rounded-tl-[140px] pointer-events-none" />

              {/* Page 3 Header */}
              <div className="relative z-10 border-b border-slate-200 pb-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {logoImage && (
                    <img src={logoImage} alt="Brand Logo" className="w-12 h-12 rounded-xl object-contain bg-white border border-blue-100 p-1 shadow-sm" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B8A17D]">
                      Transaction History & Settlement
                    </span>
                    <h2 className="text-2xl font-bold text-[#0F2C59]">Payment History & Execution Proof</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#0F2C59]">{record.userName}</p>
                  <p className="text-[10px] font-mono text-slate-400">PAGE 03 / 03</p>
                </div>
              </div>

              {/* Payment Records Table */}
              <div className="relative z-10 flex-1 py-6">
                <div className="mb-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Capital Injections Log
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Total: {record.payments.length} Verified Entries
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-600 font-bold">
                      <th className="py-3 px-4 text-[10px] uppercase">Seq.</th>
                      <th className="py-3 px-4 text-[10px] uppercase">Payment Method</th>
                      <th className="py-3 px-4 text-[10px] uppercase">Transaction Date</th>
                      <th className="py-3 px-4 text-[10px] uppercase">Reference Note</th>
                      <th className="py-3 px-4 text-[10px] uppercase text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {record.payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                          No payment entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      record.payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#0F2C59]">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] text-[10px]">
                              {p.method}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{p.date}</td>
                          <td className="py-3 px-4 text-slate-500 italic text-[11px]">{p.note || 'Settlement verified'}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-bold text-sm">
                            +RM{p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold">
                      <td colSpan={4} className="py-3.5 px-4 text-right uppercase text-[10px] text-slate-600">
                        Total Capital Settled:
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-base text-emerald-600">
                        RM{record.paidAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Final Sign-off Box on Page 3 with Custom Signature Stamp */}
                <div className="mt-10 p-8 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-8 items-end">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#0F2C59]">Official Statement Certification</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Generated by {brandTitle} Private Ledger Terminal. Any alterations invalidate this bond. Valid bank transaction statements serve as authoritative proof.
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 pt-1">
                      OTP Protocol Guarded • Cryptographic SHA-256
                    </p>
                  </div>
                  <div className="flex flex-col justify-end items-end space-y-1">
                    {signatureImage ? (
                      <div className="w-48 h-20 flex items-center justify-center p-1">
                        <img src={signatureImage} alt="Official Seal" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-48 h-16 border-b-2 border-slate-400 pb-1 text-center font-bold text-base text-[#0F2C59] flex items-end justify-center">
                        {brandTitle} Seal
                      </div>
                    )}
                    <div className="w-48 border-t border-slate-300 pt-1 text-center">
                      <p className="text-xs font-bold text-[#0F2C59]">{signerName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                        {signerTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 3 Footer */}
              <div className="relative z-10 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
                <p>{brandTitle} Private Financial System • Page 3 of 3 (Settlement Logs & Sign-off)</p>
                <div className="text-right font-mono text-[10px]">END OF DOCUMENT</div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default PDFExportModal;
