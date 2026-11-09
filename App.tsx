
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  LogOut,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Users,
  Globe,
  CloudCheck,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { LedgerRecord, DashboardStats, MonthlyTrend, AppSettings } from './types';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import RecordFormModal from './components/RecordFormModal';
import UserManagementModal from './components/UserManagementModal';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import { db, auth } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

const stringifyError = (err: any): string => {
  if (!err) return "Unknown Protocol Error";
  const errMsg = err.message || '';
  if (errMsg.includes('Insufficient permissions')) return "Security Protocol Violation: Access Denied.";
  return String(err);
};

const DEFAULT_SEED_RECORDS: LedgerRecord[] = [
  {
    id: 'JT-202401-001',
    shareKey: 'seed_alexander_vanderbilt_001',
    userName: 'Alexander Vanderbilt',
    type: 'Installment',
    totalAmount: 25000,
    paidAmount: 10000,
    paymentCycle: 'Monthly',
    nextPaymentDate: '2024-11-15',
    startDate: '2024-01-10',
    interestEnabled: true,
    dailyInterestRate: 15,
    interestType: 'fixed',
    accessOtp: '888666',
    items: [
      { id: 'I-01', name: 'Diamond Chronograph XL', amount: 15000, date: '2024-01-10', note: 'Gift collection', dailyInterestRate: 10, interestType: 'fixed' },
      { id: 'I-02', name: 'Bespoke Cufflinks', amount: 10000, date: '2024-01-10', dailyInterestRate: 5, interestType: 'fixed' }
    ],
    payments: [
      { id: 'P-01', amount: 5000, method: 'BANK', date: '2024-01-10', note: 'Initial Deposit' },
      { id: 'P-02', amount: 5000, method: 'BANK', date: '2024-02-10', note: 'Feb Installment' }
    ],
    notes: [
      { id: 'N-01', timestamp: '2024-01-10 14:00', content: 'Account established with priority status.' }
    ],
    attachments: [],
    status: 'Active'
  },
  {
    id: 'JT-202405-042',
    shareKey: 'seed_elena_petrova_042',
    userName: 'Elena Petrova',
    type: 'Delayed',
    totalAmount: 8400,
    paidAmount: 2000,
    startDate: '2024-05-22',
    endDate: '2024-12-30',
    interestEnabled: true,
    dailyInterestRate: 8,
    interestType: 'fixed',
    accessOtp: '123456',
    items: [
      { id: 'I-03', name: 'Silk Evening Gown', amount: 8400, date: '2024-05-22', dailyInterestRate: 8, interestType: 'fixed' }
    ],
    payments: [
      { id: 'P-03', amount: 2000, method: 'Cash', date: '2024-05-22' }
    ],
    notes: [],
    attachments: [],
    status: 'Active'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  brandName: 'JayTIN TEAM',
  logoUrl: '/assets/aistudio/Brown_and_Yellow_Cute_and_Fun_Photo_Studio_Logo_7949798d.jpg',
  signatureUrl: null,
  signerName: 'Jayden Ting',
  signerTitle: 'Managing Director & Auditor'
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('jaytin_auth') === 'true');
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isManagingUsers, setIsManagingUsers] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('jaytin_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.logoUrl && parsed.logoUrl.startsWith('/public/assets/')) {
          parsed.logoUrl = parsed.logoUrl.replace('/public/assets/', '/assets/');
        }
        return parsed;
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });

  const [publicRecord, setPublicRecord] = useState<LedgerRecord | null>(null);
  const [isPublicMode, setIsPublicMode] = useState(() => window.location.hash.startsWith('#/share/'));
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [userOtpInput, setUserOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const syncTimeoutRef = useRef<number | null>(null);

  // Automatic overdue detection and daily interest compounding per order item
  // Each order item's interest is calculated: item.overdueDays (since item.dueDate) x daily rate
  const processAutoOverdue = (inputRecords: LedgerRecord[]): LedgerRecord[] => {
    const now = new Date();
    // Normalize time to calendar date
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return inputRecords.map(record => {
      const remainingPrincipal = Math.max(0, record.totalAmount - record.paidAmount);

      // Already settled or zero balance
      if (record.status === 'Settled' || remainingPrincipal <= 0) {
        const settledItems = (record.items || []).map(item => ({
          ...item,
          overdueDays: 0,
          calculatedInterest: 0
        }));
        return {
          ...record,
          items: settledItems,
          calculatedInterest: 0,
          overdueDays: 0,
          status: 'Settled' as const
        };
      }

      // Check protocol-level maturity date
      let protocolOverdueDays = 0;
      if (record.endDate) {
        const pParts = record.endDate.split('-');
        const pDate = new Date(Number(pParts[0]), Number(pParts[1]) - 1, Number(pParts[2]));
        if (today.getTime() > pDate.getTime()) {
          protocolOverdueDays = Math.max(1, Math.floor((today.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      const isInterestActive = record.interestEnabled !== false && !record.waiveInterest;
      const protocolRate = record.dailyInterestRate ?? 10;
      const protocolType = record.interestType || 'fixed';

      let maxItemOverdueDays = 0;
      let totalItemsAccruedInterest = 0;

      // Calculate each individual item's overdue days and single interest
      const updatedItems = (record.items || []).map(item => {
        // Individual due date: item's own dueDate if set, otherwise falls back to protocol endDate
        const effectiveDueStr = item.dueDate || record.endDate;
        let itemOverdueDays = 0;

        if (effectiveDueStr) {
          const parts = effectiveDueStr.split('-');
          const itemDueDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          if (today.getTime() > itemDueDate.getTime()) {
            itemOverdueDays = Math.max(1, Math.floor((today.getTime() - itemDueDate.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        if (itemOverdueDays > maxItemOverdueDays) {
          maxItemOverdueDays = itemOverdueDays;
        }

        let itemInterest = 0;
        if (isInterestActive && itemOverdueDays > 0) {
          if (item.dailyInterestRate !== undefined && item.dailyInterestRate > 0) {
            // Item has its own custom daily interest policy
            if (item.interestType === 'percentage') {
              itemInterest = Math.round(item.amount * (item.dailyInterestRate / 100) * itemOverdueDays);
            } else {
              itemInterest = Math.round(itemOverdueDays * item.dailyInterestRate);
            }
          } else {
            // Follows protocol interest rate
            if (protocolType === 'percentage') {
              itemInterest = Math.round(item.amount * (protocolRate / 100) * itemOverdueDays);
            } else {
              const proportion = record.totalAmount > 0 ? (item.amount / record.totalAmount) : (1 / Math.max(1, record.items.length));
              itemInterest = Math.round(itemOverdueDays * protocolRate * proportion);
            }
          }
        }

        totalItemsAccruedInterest += itemInterest;
        return {
          ...item,
          overdueDays: itemOverdueDays,
          calculatedInterest: itemInterest
        };
      });

      const effectiveOverdueDays = Math.max(protocolOverdueDays, maxItemOverdueDays);
      const isPastDue = effectiveOverdueDays > 0;

      let finalCalculatedInterest = 0;
      if (isInterestActive && isPastDue) {
        if (updatedItems.length > 0) {
          finalCalculatedInterest = totalItemsAccruedInterest;
        } else {
          if (protocolType === 'percentage') {
            finalCalculatedInterest = Math.round(remainingPrincipal * (protocolRate / 100) * effectiveOverdueDays);
          } else {
            finalCalculatedInterest = Math.round(effectiveOverdueDays * protocolRate);
          }
        }
      }

      return {
        ...record,
        items: updatedItems,
        overdueDays: effectiveOverdueDays,
        calculatedInterest: finalCalculatedInterest,
        status: isPastDue ? 'Overdue' : (remainingPrincipal <= 0 ? 'Settled' : 'Active')
      };
    });
  };

  // Local storage loader with default fallback
  useEffect(() => {
    if (isPublicMode) return;
    const saved = localStorage.getItem('jaytin_ledgers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(processAutoOverdue(parsed));
        } else {
          setRecords(processAutoOverdue(DEFAULT_SEED_RECORDS));
          localStorage.setItem('jaytin_ledgers', JSON.stringify(DEFAULT_SEED_RECORDS));
        }
      } catch (e) {
        setRecords(processAutoOverdue(DEFAULT_SEED_RECORDS));
      }
    } else {
      setRecords(processAutoOverdue(DEFAULT_SEED_RECORDS));
      localStorage.setItem('jaytin_ledgers', JSON.stringify(DEFAULT_SEED_RECORDS));
    }
    setIsLoading(false);
  }, [isPublicMode]);

  useEffect(() => {
    const handleRoute = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/share/')) {
        const key = hash.replace('#/share/', '');
        if (key && key.length >= 20) {
          setIsPublicMode(true);
          setIsLoading(true);
          try {
            // Priority fetch from Firestore
            const q = query(collection(db, 'ledgers'), where('shareKey', '==', key));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const matched = querySnapshot.docs[0].data() as LedgerRecord;
              const processed = processAutoOverdue([matched])[0];
              setPublicRecord(processed);
            } else {
              // Local storage fallback
              const saved = localStorage.getItem('jaytin_ledgers');
              let foundLocal: LedgerRecord | null = null;
              if (saved) {
                const list: LedgerRecord[] = JSON.parse(saved);
                foundLocal = list.find(r => r.shareKey === key) || null;
              }
              if (!foundLocal) {
                foundLocal = DEFAULT_SEED_RECORDS.find(r => r.shareKey === key) || null;
              }

              if (foundLocal) {
                setPublicRecord(processAutoOverdue([foundLocal])[0]);
              } else {
                setPublicRecord(null);
              }
            }
          } catch (e) {
            console.warn("Vault access notice, fallback to local:", e);
            const saved = localStorage.getItem('jaytin_ledgers');
            let foundLocal: LedgerRecord | null = null;
            if (saved) {
              const list: LedgerRecord[] = JSON.parse(saved);
              foundLocal = list.find(r => r.shareKey === key) || null;
            }
            if (!foundLocal) {
              foundLocal = DEFAULT_SEED_RECORDS.find(r => r.shareKey === key) || null;
            }
            if (foundLocal) {
              setPublicRecord(processAutoOverdue([foundLocal])[0]);
            } else {
              setPublicRecord(null);
            }
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsPublicMode(false);
          setPublicRecord(null);
        }
      } else {
        setIsPublicMode(false);
        setPublicRecord(null);
      }
    };

    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    return () => window.removeEventListener('hashchange', handleRoute);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        localStorage.setItem('jaytin_auth', 'true');
      } else {
        // If logged in via ID 1 or local master credential, maintain authorization
        const localAuth = localStorage.getItem('jaytin_auth');
        if (localAuth === 'true') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchFromCloud = async () => {
    if (isPublicMode) {
      setIsLoading(false);
      return;
    }
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }
    setIsSyncing(true);
    try {
      const q = query(
        collection(db, 'ledgers'), 
        where('ownerId', '==', auth.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const cloudRecords = processAutoOverdue(
        querySnapshot.docs.map(doc => doc.data() as LedgerRecord)
      );
      if (cloudRecords.length > 0) {
        setRecords(cloudRecords);
        localStorage.setItem('jaytin_ledgers', JSON.stringify(cloudRecords));
      }
    } catch (e: any) {
      console.warn(stringifyError(e));
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isPublicMode && auth.currentUser) {
      fetchFromCloud();
    } else if (!isPublicMode) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isPublicMode]);

  const syncAllToCloud = async (currentRecords: LedgerRecord[]) => {
    if (!auth.currentUser || isPublicMode) return;
    setIsSyncing(true);
    try {
      // Sync each record as a document
      const promises = currentRecords.map(r => {
        const ledgerRef = doc(db, 'ledgers', r.id);
        return setDoc(ledgerRef, {
          ...r,
          ownerId: auth.currentUser!.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      await Promise.all(promises);
    } catch (e: any) {
      console.error(stringifyError(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRecordUpdate = (newRecords: LedgerRecord[]) => {
    const processed = processAutoOverdue(newRecords);
    setRecords(processed);
    localStorage.setItem('jaytin_ledgers', JSON.stringify(processed));
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      syncAllToCloud(processed);
    }, 1500);
  };

  const stats: DashboardStats = useMemo(() => {
    const totalValuation = records.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = records.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalOutstanding = totalValuation - totalPaid;
    
    const now = new Date();
    const collectedThisMonth = records.reduce((acc, curr) => 
      acc + (curr.payments || []).reduce((pAcc, p) => {
        const pDate = new Date(p.date);
        return (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) ? pAcc + p.amount : pAcc;
      }, 0)
    , 0);

    const overdueAmount = records
      .filter(r => r.status === 'Overdue')
      .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

    const totalInterestAmount = records.reduce((acc, curr) => acc + (curr.calculatedInterest || 0), 0);

    const monthlyTrend: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const mLabel = d.toLocaleString('en-US', { month: 'short' });
      const mValue = records.reduce((acc, curr) => 
        acc + (curr.payments || []).reduce((pAcc, p) => {
          const pDate = new Date(p.date);
          return (pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear()) ? pAcc + p.amount : pAcc;
        }, 0)
      , 0);
      monthlyTrend.push({ month: mLabel, amount: mValue });
    }

    return {
      totalValuation,
      totalOutstanding,
      activeCustomers: records.filter(r => r.status !== 'Settled').length,
      collectedThisMonth,
      collectionRate: totalValuation > 0 ? (totalPaid / totalValuation) * 100 : 0,
      overdueAmount,
      totalInterestAmount,
      monthlyTrend
    };
  }, [records]);

  const handleLogin = async (user: string, pass: string): Promise<boolean> => {
    const trimmedUser = user.trim();
    const trimmedPass = pass.trim();

    // 1. Master credential quick entry: ID "1" and Key "1"
    if (trimmedUser === '1' && trimmedPass === '1') {
      setIsAuthenticated(true);
      localStorage.setItem('jaytin_auth', 'true');
      localStorage.setItem('jaytin_user', '1');
      return true;
    }

    // 2. Secondary preset: jaydenting60 & JaydenTing0307
    if (trimmedUser.toLowerCase() === 'jaydenting60' && trimmedPass === 'JaydenTing0307') {
      setIsAuthenticated(true);
      localStorage.setItem('jaytin_auth', 'true');
      localStorage.setItem('jaytin_user', 'jaydenting60');
      return true;
    }

    // 3. Check custom local accounts created in User Management
    try {
      const storedUsersRaw = localStorage.getItem('jaytin_local_users');
      if (storedUsersRaw) {
        const storedUsers = JSON.parse(storedUsersRaw);
        const match = storedUsers.find((u: any) => 
          u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === trimmedPass
        );
        if (match) {
          setIsAuthenticated(true);
          localStorage.setItem('jaytin_auth', 'true');
          localStorage.setItem('jaytin_user', trimmedUser);
          return true;
        }
      }
    } catch (e) {
      // ignore
    }

    // 4. Try Firebase Auth
    try {
      const email = `${trimmedUser.toLowerCase()}@jaytin.private`;
      await signInWithEmailAndPassword(auth, email, trimmedPass);
      setIsAuthenticated(true);
      localStorage.setItem('jaytin_auth', 'true');
      localStorage.setItem('jaytin_user', trimmedUser);
      return true;
    } catch (e) { 
      console.warn("Firebase Auth login attempt:", e);
      return false; 
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('jaytin_auth');
    localStorage.removeItem('jaytin_user');
    setIsAuthenticated(false);
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    localStorage.setItem('jaytin_ledgers', JSON.stringify(next));
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'ledgers', id));
      } catch (e) {
        console.error("Delete failure", e);
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#EBFAFF]"><Loader2 className="w-10 h-10 text-[#B8A17D] animate-spin" /></div>;

  // Public client viewing route: Protected by 6-digit OTP
  if (isPublicMode && publicRecord) {
    const requiredOtp = publicRecord.accessOtp || '';
    const needsVerification = !!requiredOtp && !isOtpVerified;

    if (needsVerification) {
      const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (userOtpInput.trim() === requiredOtp.trim()) {
          setIsOtpVerified(true);
          setOtpError(null);
        } else {
          setOtpError("Invalid 6-digit access code. Please request the latest code from your administrator.");
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#EBFAFF]" style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-[460px] rounded-[40px] p-10 border border-white/80 shadow-2xl relative overflow-hidden bg-white/85"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0F2C59] text-[#B8A17D] rounded-3xl mx-auto flex items-center justify-center mb-4 border border-[#B8A17D]/30 shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-[#0F2C59] tracking-tight">JayTIN Secure Ledger Access</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1">
                One-Time Access Protocol
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-600 mb-6 space-y-1">
              <p className="font-bold text-amber-800">🔒 Protected Private Financial Record</p>
              <p className="text-[11px] text-slate-500">
                You are accessing the ledger for <span className="font-bold text-[#0F2C59]">[{publicRecord.userName}]</span>.
                Please enter the <span className="font-bold text-amber-700">6-digit One-Time Passcode</span> provided by your administrator.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1 text-center">
                  Enter 6-Digit One-Time Passcode (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="••••••"
                  value={userOtpInput}
                  onChange={(e) => {
                    setUserOtpInput(e.target.value.replace(/\D/g, ''));
                    setOtpError(null);
                  }}
                  className="w-full text-center tracking-[0.5em] font-bold text-3xl py-4 bg-blue-50/40 border border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/40 text-[#0F2C59]"
                />
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-600 font-bold">
                  {otpError}
                </div>
              )}

              <button
                type="submit"
                disabled={userOtpInput.length !== 6}
                className="w-full bg-[#0F2C59] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-[#153A6B] active-scale disabled:opacity-40 transition-all"
              >
                Unlock & View Statement
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => { window.location.hash = ''; }}
                className="text-xs text-slate-400 hover:text-[#0F2C59] font-bold tracking-wider"
              >
                ← Return to Home
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#EBFAFF]">
        <CustomerDetail 
          record={publicRecord} 
          isViewOnly={true} 
          onClose={() => { window.location.hash = ''; }} 
          onUpdateRecord={() => {}} 
          stats={stats} 
          settings={settings}
        />
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen px-4 py-8 md:px-12 md:py-12 flex flex-col items-center bg-[#EBFAFF]" style={{ fontFamily: "'DynaPuff', 'Fredoka', cursive, sans-serif" }}>
      <header className="w-full max-w-7xl flex flex-col space-y-6 mb-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3.5">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="Brand Logo" 
                className="w-12 h-12 object-contain rounded-2xl bg-white/80 p-1 shadow-sm border border-blue-100" 
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#0F2C59] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                CRE
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0F2C59] tracking-tight">{settings.brandName || 'JayTIN TEAM'}</h1>
              <p className="text-[10px] font-bold text-[#1E3A8A] tracking-[0.2em] uppercase opacity-75">Financial & Ledger Terminal</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2.5 text-[#1E3A8A] bg-white rounded-xl border border-blue-100 active-scale shadow-sm hover:bg-blue-50/50" 
              title="Branding & Signature Settings"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsManagingUsers(true)} className="p-2.5 text-[#1E3A8A] bg-white rounded-xl border border-blue-100 active-scale shadow-sm hover:bg-blue-50/50" title="Manage Users"><Users className="w-5 h-5" /></motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-500 transition-all active-scale" title="Sign Out / Disconnect"><LogOut className="w-5 h-5" /></motion.button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search protocol..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-5 py-3.5 bg-white/60 border border-blue-100 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]" />
          </div>
          <button onClick={() => setIsAddingRecord(true)} className="flex items-center justify-center space-x-3 bg-[#0F2C59] hover:bg-[#153A6B] text-white px-8 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest active-scale shadow-md transition-colors">
            <Plus className="w-4.5 h-4.5" /><span>New Registry</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl space-y-10">
        <Dashboard stats={stats} />
        <CustomerList records={records.filter(r => r.userName.toLowerCase().includes(searchQuery.toLowerCase()))} onSelect={setSelectedRecordId} selectedId={selectedRecordId} />
      </main>

      <AnimatePresence>
        {selectedRecordId && records.find(r => r.id === selectedRecordId) && (
          <CustomerDetail 
            record={records.find(r => r.id === selectedRecordId)!} 
            onClose={() => setSelectedRecordId(null)}
            onUpdateRecord={(updated) => {
              const next = records.map(r => r.id === updated.id ? updated : r);
              handleRecordUpdate(next);
            }}
            onDeleteRecord={handleDeleteRecord}
            stats={stats}
            allRecords={records}
            settings={settings}
          />
        )}
      </AnimatePresence>

      <RecordFormModal isOpen={isAddingRecord} onClose={() => setIsAddingRecord(false)} onSave={(newRecord) => {
        handleRecordUpdate([newRecord, ...records]);
        setIsAddingRecord(false);
      }} />
      <UserManagementModal isOpen={isManagingUsers} onClose={() => setIsManagingUsers(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onSave={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('jaytin_settings', JSON.stringify(newSettings));
        }} 
      />
    </div>
  );
};

export default App;
