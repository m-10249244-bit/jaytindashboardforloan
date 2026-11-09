import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, PenTool, Check, Trash2, RotateCcw, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const DEFAULT_CRE_LOGO = '/assets/aistudio/Brown_and_Yellow_Cute_and_Fun_Photo_Studio_Logo_7949798d.jpg';

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [brandName, setBrandName] = useState(settings.brandName || 'JayTIN TEAM');
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logoUrl);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(settings.signatureUrl);
  const [signerName, setSignerName] = useState(settings.signerName || 'Jayden Ting');
  const [signerTitle, setSignerTitle] = useState(settings.signerTitle || 'Managing Director & Auditor');

  const [activeTab, setActiveTab] = useState<'logo' | 'signature' | 'brand'>('logo');
  const [isDrawing, setIsDrawing] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setBrandName(settings.brandName || 'JayTIN TEAM');
      setLogoUrl(settings.logoUrl);
      setSignatureUrl(settings.signatureUrl);
      setSignerName(settings.signerName || 'Jayden Ting');
      setSignerTitle(settings.signerTitle || 'Managing Director & Auditor');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  // Handle Logo File Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Signature Image Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas Drawing for Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0F2C59';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureUrl(null);
  };

  const handleSave = () => {
    const updated: AppSettings = {
      brandName: brandName.trim() || 'JayTIN TEAM',
      logoUrl,
      signatureUrl,
      signerName: signerName.trim() || 'Jayden Ting',
      signerTitle: signerTitle.trim() || 'Managing Director & Auditor',
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        onClick={onClose} className="absolute inset-0 bg-[#0F2C59]/40 backdrop-blur-md" 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-xl rounded-[40px] overflow-hidden border border-white/80 shadow-2xl relative z-10 bg-white flex flex-col"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        {/* Top Header */}
        <div className="p-8 border-b border-blue-50 flex justify-between items-center bg-blue-50/40">
          <div>
            <h3 className="text-2xl font-bold text-[#0F2C59]">System Brand & Stamp Settings</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              Configure Brand Logo & Authorized Seal for Website & 3-Page PDF
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors active-scale">
            <X className="w-5 h-5 text-slate-400 hover:text-[#0F2C59]" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-blue-50 px-8 bg-white/40">
          <button
            onClick={() => setActiveTab('logo')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
              activeTab === 'logo' ? 'text-[#1E3A8A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Brand Logo
            {activeTab === 'logo' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E3A8A] rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
              activeTab === 'signature' ? 'text-[#1E3A8A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Authorized Signature & Seal
            {activeTab === 'signature' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E3A8A] rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('brand')}
            className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
              activeTab === 'brand' ? 'text-[#1E3A8A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Organization Info
            {activeTab === 'brand' && <motion.div layoutId="setting-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E3A8A] rounded-t-full" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-1">Brand Logo Asset</label>
                <p className="text-[10px] text-slate-400 mb-4">
                  This logo displays on the terminal header and on all 3 pages of the official Canva PDF.
                </p>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-100 rounded-3xl bg-blue-50/20 hover:bg-blue-50/40 transition-all">
                  {logoUrl ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-md border border-blue-100 flex items-center justify-center p-2">
                        <img src={logoUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] text-xs font-bold rounded-xl transition-all"
                        >
                          Change Logo
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-bold rounded-xl transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => logoInputRef.current?.click()} 
                      className="cursor-pointer text-center py-6 space-y-2"
                    >
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-[#1E3A8A]">Click to Upload Custom Logo</p>
                      <p className="text-[9px] text-slate-400">PNG, JPG, SVG up to 5MB</p>
                    </div>
                  )}
                </div>

                {/* Preset Fast Selector: CRE Cartoon Logo */}
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={DEFAULT_CRE_LOGO} alt="CRE Logo" className="w-10 h-10 rounded-lg object-contain bg-white border border-blue-100 p-1" />
                    <div>
                      <p className="text-xs font-bold text-[#0F2C59]">Preset Cute "CRE" Bubble Logo</p>
                      <p className="text-[9px] text-slate-400">Use the uploaded colorful cartoon logo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl(DEFAULT_CRE_LOGO)}
                    className="px-3.5 py-1.5 bg-[#0F2C59] hover:bg-[#153A6B] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Use CRE Logo
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signature' && (
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-1">Official Stamp / Digital Signature</label>
                <p className="text-[10px] text-slate-400 mb-4">
                  Draw or upload an official signature or stamp. This is automatically stamped on Page 3 of the Canva PDF.
                </p>

                <input type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={handleSignatureUpload} />

                {/* Signature Preview & Drawing Pad */}
                <div className="border border-blue-100 rounded-3xl p-4 bg-blue-50/20 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <PenTool className="w-3.5 h-3.5 mr-1.5 text-[#1E3A8A]" />
                      Sign Directly on Screen or Upload Stamp
                    </span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="px-3 py-1 bg-white border border-blue-100 rounded-lg text-[10px] font-bold text-[#1E3A8A] hover:bg-blue-50"
                      >
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-3 py-1 bg-white border border-blue-100 rounded-lg text-[10px] font-bold text-slate-400 hover:text-rose-500"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-44 bg-white rounded-2xl border border-blue-100 overflow-hidden relative shadow-inner">
                    {signatureUrl && !isDrawing ? (
                      <div className="w-full h-full flex items-center justify-center relative p-3">
                        <img src={signatureUrl} alt="Signature Preview" className="max-w-full max-h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setSignatureUrl(null)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-xs"
                          title="Remove Signature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={176}
                        className="w-full h-full cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 text-center italic">
                    Tip: Use your mouse or touchscreen to sign in the box above, or upload a transparent PNG stamp.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-1">Authorized Signer Name</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Jayden Ting"
                    className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3 text-xs focus:outline-none text-[#0F2C59] font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-1">Signer Title / Role</label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Managing Director & Auditor"
                    className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-4 py-3 text-xs focus:outline-none text-[#0F2C59] font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#0F2C59] uppercase tracking-widest block mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="JayTIN TEAM"
                  className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none text-[#0F2C59] font-bold"
                />
                <p className="text-[9px] text-slate-400 mt-1.5">
                  Appears in the navigation bar, client vault title, and official PDF statements.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-[#1E3A8A] flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  PDF & Portal Synchronization
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  All branding changes update in real time. The 3-Page Canva PDF export will automatically render the company logo at the top of all 3 pages and embed your authorized signature/stamp in the Page 3 Certification Seal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 px-8 border-t border-blue-50 bg-blue-50/30 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#0F2C59] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-3.5 bg-[#0F2C59] hover:bg-[#153A6B] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl flex items-center space-x-2 transition-all active-scale"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Save Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
