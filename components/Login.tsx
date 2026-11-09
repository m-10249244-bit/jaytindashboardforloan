import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

interface Props {
  onLogin: (user: string, pass: string) => Promise<boolean> | boolean;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [user, setUser] = useState('1');
  const [pass, setPass] = useState('1');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(false);
    
    try {
      const success = await onLogin(user, pass);
      if (!success) {
        setError(true);
        setTimeout(() => setError(false), 2500);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 2500);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const setQuickCredentials = (u: string, p: string) => {
    setUser(u);
    setPass(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#EBFAFF]" style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="glass-card w-full max-w-[440px] rounded-[48px] p-12 border border-white/80 shadow-[0_40px_100px_-20px_rgba(15,44,89,0.12)] relative overflow-hidden bg-white/80"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#1E3A8A]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center mb-10 relative">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-blue-50 rounded-3xl mx-auto flex items-center justify-center mb-5 border border-blue-100 shadow-inner"
          >
            <ShieldCheck className="w-10 h-10 text-[#1E3A8A]" />
          </motion.div>
          <h1 className="text-4xl font-bold text-[#0F2C59] mb-2 tracking-tight">JayTIN TEAM</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Vault Access Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Identity UID</label>
              <span className="text-[9px] font-bold text-[#1E3A8A] tracking-wider">Default: 1</span>
            </div>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors" />
              <input 
                required
                disabled={isAuthenticating}
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="1 or Username"
                className="w-full bg-blue-50/40 border border-blue-100 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all disabled:opacity-50 text-[#0F2C59]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Protocol Key</label>
              <span className="text-[9px] font-bold text-[#1E3A8A] tracking-wider">Default: 1</span>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors" />
              <input 
                required
                disabled={isAuthenticating}
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="1 or Password"
                className="w-full bg-blue-50/40 border border-blue-100 rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all disabled:opacity-50 text-[#0F2C59]"
              />
            </div>
          </div>

          {/* Quick preset selector buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setQuickCredentials('1', '1')}
              className="flex-1 py-2 px-3 text-[10px] font-bold rounded-xl bg-blue-50/80 border border-blue-100 text-[#0F2C59] hover:bg-white hover:text-[#1E3A8A] active-scale transition-all flex items-center justify-center space-x-1"
            >
              <span>Quick Fill: 1 / 1</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickCredentials('jaydenting60', 'JaydenTing0307')}
              className="py-2 px-3 text-[10px] font-bold rounded-xl bg-blue-50/40 border border-blue-100 text-slate-500 hover:bg-white active-scale transition-all"
            >
              <span>jaydenting60</span>
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest justify-center"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Authentication Failed · Default ID: 1, Key: 1</span>
            </motion.div>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isAuthenticating}
            type="submit"
            className="w-full bg-[#0F2C59] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-[#153A6B] flex items-center justify-center space-x-2 group disabled:opacity-70 transition-all active-scale"
          >
            {isAuthenticating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Authorize & Sign In</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Private Financial System • Authorized Personnel
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
