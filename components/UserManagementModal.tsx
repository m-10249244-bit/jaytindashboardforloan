import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, ShieldCheck, Loader2, AlertCircle, DatabaseZap, Terminal } from 'lucide-react';
import { db } from '../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as signOutSecondary, deleteUser } from 'firebase/auth';
import { collection, query, getDocs, setDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Secondary app to manage other users without logging out current user
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuth');
const secondaryAuth = getAuth(secondaryApp);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CloudUser {
  id: string;
  username: string;
  created_at: string;
}

const PRESET_USERS: CloudUser[] = [
  { id: 'usr-master-1', username: '1 (Master Passcode)', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'usr-admin-jayden', username: 'jaydenting60', created_at: '2024-01-01T00:00:00.000Z' }
];

const UserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<CloudUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setIsSchemaMissing(false);
    setError(null);

    // Load local team users first
    let localList: CloudUser[] = [];
    try {
      const stored = localStorage.getItem('jaytin_local_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        localList = parsed.map((u: any) => ({
          id: u.id || `local-${u.username}`,
          username: u.username,
          created_at: u.created_at || new Date().toISOString()
        }));
      }
    } catch (e) {
      // ignore
    }

    try {
      const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const cloudData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CloudUser[];

      // Merge presets, cloud, and local
      const mergedMap = new Map<string, CloudUser>();
      PRESET_USERS.forEach(u => mergedMap.set(u.username, u));
      localList.forEach(u => mergedMap.set(u.username, u));
      cloudData.forEach(u => mergedMap.set(u.username, u));

      setUsers(Array.from(mergedMap.values()));
    } catch (e: any) {
      console.warn("Cloud users fetch notice:", e.message);
      // Fallback to presets + local users
      const mergedMap = new Map<string, CloudUser>();
      PRESET_USERS.forEach(u => mergedMap.set(u.username, u));
      localList.forEach(u => mergedMap.set(u.username, u));
      setUsers(Array.from(mergedMap.values()));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setIsAdding(true);
    setError(null);

    // Save locally first so it always works immediately
    try {
      const existingRaw = localStorage.getItem('jaytin_local_users');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [
        ...existing.filter((u: any) => u.username.toLowerCase() !== newUsername.toLowerCase()),
        {
          id: `local-${Date.now()}`,
          username: newUsername,
          password: newPassword,
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem('jaytin_local_users', JSON.stringify(updated));
    } catch (e) {
      console.warn("Local user save notice:", e);
    }

    // Attempt Firebase Auth & Firestore sync if configured
    try {
      const email = `${newUsername.toLowerCase()}@jaytin.private`;
      // 1. Create in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newPassword);
      const uid = userCredential.user.uid;
      
      // 2. Record in Firestore
      await setDoc(doc(db, 'users', uid), {
        username: newUsername,
        created_at: new Date().toISOString()
      });

      // 3. Sign out of secondary instance
      await signOutSecondary(secondaryAuth);
    } catch (e: any) {
      console.warn("Firebase user sync notice:", e.message);
    } finally {
      setNewUsername('');
      setNewPassword('');
      setIsAdding(false);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username.startsWith('1 ') || username === '1') {
      alert('Master system passcode (1) cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to revoke access for ${username}?`)) return;

    // Remove from local storage
    try {
      const existingRaw = localStorage.getItem('jaytin_local_users');
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        const filtered = existing.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
        localStorage.setItem('jaytin_local_users', JSON.stringify(filtered));
      }
    } catch (e) {
      // ignore
    }

    try {
      if (!id.startsWith('local-') && !id.startsWith('usr-')) {
        await deleteDoc(doc(db, 'users', id));
      }
    } catch (e: any) {
      console.warn("Firebase delete notice:", e.message);
    }
    fetchUsers();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0F2C59]/40 backdrop-blur-xl" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="glass-card w-full max-w-2xl h-[80vh] rounded-[48px] overflow-hidden border border-white/80 shadow-2xl relative z-10 flex flex-col bg-white"
        style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}
      >
        <div className="p-10 pb-6 border-b border-blue-50 flex justify-between items-center bg-blue-50/40">
          <div>
            <h3 className="text-3xl font-bold text-[#0F2C59]">Identity Management</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] mt-2">Authorized Protocol Personnel</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all group active-scale">
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {isSchemaMissing ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="p-6 bg-rose-50 rounded-[32px] border border-rose-100 shadow-inner">
                <DatabaseZap className="w-12 h-12 text-rose-500" />
              </div>
              <div className="max-w-md space-y-3">
                <h4 className="text-xl font-bold text-[#0F2C59]">Vault Uninitialized</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">The required database table <code className="text-rose-500 font-bold bg-rose-50 px-1.5 rounded">users</code> was not found. Cloud identity injection is currently disabled.</p>
                <div className="bg-[#0F2C59] p-4 rounded-2xl text-left border border-blue-200 mt-4 overflow-hidden relative group">
                  <Terminal className="w-3.5 h-3.5 text-[#B8A17D] absolute top-3 right-3 opacity-30" />
                  <p className="text-[9px] text-[#B8A17D] font-bold uppercase tracking-widest mb-2">Protocol Solution</p>
                  <p className="text-[11px] text-slate-300 font-mono leading-tight">Enable Email/Password in Firebase Authentication to synchronize cloud accounts.</p>
                </div>
              </div>
              <button onClick={fetchUsers} className="flex items-center space-x-2 text-[10px] font-bold text-[#1E3A8A] uppercase tracking-[0.3em] hover:underline">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Check Vault Status</span>
              </button>
            </div>
          ) : (
            <>
              {/* Add User Section */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-[0.2em] flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" /> Inject New Protocol Identity
                </h4>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    required type="text" placeholder="Identity UID" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-blue-50/40 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] text-[#0F2C59]"
                  />
                  <input 
                    required type="password" placeholder="Protocol Key" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-blue-50/40 border border-blue-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] text-[#0F2C59]"
                  />
                  <button 
                    type="submit" disabled={isAdding}
                    className="bg-[#0F2C59] hover:bg-[#153A6B] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authorize</span>}
                  </button>
                </form>
                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">{error}</p>
                  </motion.div>
                )}
              </section>

              {/* User List Section */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Identities</h4>
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#1E3A8A] animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {users.length === 0 ? (
                      <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No identities preserved in cloud vault.</p>
                    ) : users.map(u => (
                      <motion.div 
                        key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-3xl bg-blue-50/30 border border-blue-100 flex justify-between items-center group hover:bg-blue-50/60 transition-all shadow-sm"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#0F2C59] rounded-2xl flex items-center justify-center border border-blue-200 shadow-inner group-hover:border-[#1E3A8A] transition-colors">
                            <ShieldCheck className="w-6 h-6 text-[#B8A17D]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0F2C59]">{u.username}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Authorized: {new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <div className="p-8 bg-blue-50/30 border-t border-blue-50 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">JayTIN Private Security Protocol</p>
        </div>
      </motion.div>
    </div>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

export default UserManagementModal;
