import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();
  const [activeDate, setActiveDate] = useState('');
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    memberId: '',
    type: ''
  });

  const [quickEntry, setQuickEntry] = useState({
    memberId: '',
    type: 'contribution',
    amount: '',
    direction: 'in'
  });

  useEffect(() => {
    if (!user) return;

    const q1 = query(collection(db, 'members'), where('userId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q2 = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q3 = query(collection(db, 'loans'), where('userId', '==', user.uid));
    const unsub3 = onSnapshot(q3, (snap) => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  const handleQuickEntry = async () => {
    if (!quickEntry.memberId || !quickEntry.amount || !activeDate) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    await addDoc(collection(db, 'transactions'), {
      userId: user.uid,
      memberId: quickEntry.memberId,
      type: quickEntry.type,
      amount: Number(quickEntry.amount),
      direction: quickEntry.direction,
      date: activeDate,
      createdAt: new Date().toISOString()
    });

    setQuickEntry({ ...quickEntry, amount: '' });
  };

  const filteredTransactions = transactions.filter(t => {
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    if (filters.memberId && t.memberId !== filters.memberId) return false;
    if (filters.type && t.type !== filters.type) return false;
    return true;
  });

  const stats = {
    totalMembers: members.length,
    totalContributions: filteredTransactions.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
    totalSavings: filteredTransactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0),
    cashFund: filteredTransactions.filter(t => t.type === 'cash_fund').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0),
    activeLoans: loans.filter(l => l.status === 'active').length,
    totalLoans: loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.amountRemaining || 0), 0)
  };

  // NOUVEAU: Tous les graphiques en Bar Chart
  const contributionsByDate = Object.entries(
    filteredTransactions
      .filter(t => t.type === 'contribution')
      .reduce((acc, t) => {
        acc[t.date] = (acc[t.date] || 0) + t.amount;
        return acc;
      }, {})
  ).map(([date, montant]) => ({ date, montant })).sort((a, b) => a.date.localeCompare(b.date));

  const savingsByMember = members.map(m => ({
    name: m.name.split(' ')[0],
    montant: filteredTransactions.filter(t => t.type === 'savings' && t.memberId === m.id).reduce((s, t) => s + t.amount, 0)
  })).filter(m => m.montant > 0);

  const cashFundByDate = Object.entries(
    filteredTransactions
      .filter(t => t.type === 'cash_fund')
      .reduce((acc, t) => {
        acc[t.date] = (acc[t.date] || 0) + (t.direction === 'in' ? t.amount : -t.amount);
        return acc;
      }, {})
  ).map(([date, montant]) => ({ date, montant })).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black mb-2">📊 {t('dashboard')}</h2>
        <p className="text-indigo-100">Vue d'ensemble de votre tontine</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-indigo-100 relative">
        {!activeDate && (
          <div className="absolute -top-3 right-24 animate-bounce z-10">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
              ⬇️ {t('chooseDate')}
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-indigo-600 mb-1">📅 {t('activeSession')}</h3>
            <p className="text-sm text-slate-600">{t('chooseDate')}</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-200 font-bold focus:border-indigo-600 outline-none"
            />
            {activeDate && (
              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold">
                ✓ {t('active')}
              </span>
            )}
          </div>
        </div>
      </div>

      {activeDate && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border-2 border-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚡</span>
            <h3 className="font-black text-lg">{t('quickEntry')} - {activeDate}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <select value={quickEntry.memberId} onChange={(e) => setQuickEntry({...quickEntry, memberId: e.target.value})} className="px-4 py-3 bg-white rounded-xl border-2 border-slate-200 font-bold">
              <option value="">{t('member')}...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={quickEntry.type} onChange={(e) => setQuickEntry({...quickEntry, type: e.target.value})} className="px-4 py-3 bg-white rounded-xl border-2 border-slate-200 font-bold">
              <option value="contribution">{t('contributions')}</option>
              <option value="savings">{t('savings')}</option>
              <option value="cash_fund">Fonds</option>
            </select>
            <input type="number" placeholder={t('amount')} value={quickEntry.amount} onChange={(e) => setQuickEntry({...quickEntry, amount: e.target.value})} className="px-4 py-3 bg-white rounded-xl border-2 border-slate-200 font-bold" />
            <select value={quickEntry.direction} onChange={(e) => setQuickEntry({...quickEntry, direction: e.target.value})} className="px-4 py-3 bg-white rounded-xl border-2 border-slate-200 font-bold">
              <option value="in">Entrée (+)</option>
              <option value="out">Sortie (-)</option>
            </select>
            <button onClick={handleQuickEntry} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">{t('save')}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-indigo-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('members')}</p>
          <p className="text-3xl font-black text-indigo-600">{stats.totalMembers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('contributions')}</p>
          <p className="text-xl font-black text-blue-600">{formatAmount(stats.totalContributions)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-emerald-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('savings')}</p>
          <p className="text-xl font-black text-emerald-600">{formatAmount(stats.totalSavings)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-amber-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Fonds</p>
          <p className="text-xl font-black text-amber-600">{formatAmount(stats.cashFund)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-purple-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('loans')}</p>
          <p className="text-2xl font-black text-purple-600">{stats.activeLoans}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-rose-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Montant</p>
          <p className="text-xl font-black text-rose-600">{formatAmount(stats.totalLoans)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="font-black text-lg mb-4">🎛️ {t('advancedFilters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-200 font-bold outline-none" placeholder={t('startDate')} />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-200 font-bold outline-none" placeholder={t('endDate')} />
          <select value={filters.memberId} onChange={(e) => setFilters({...filters, memberId: e.target.value})} className="px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-200 font-bold outline-none">
            <option value="">{t('allMembers')}</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="px-4 py-2 bg-slate-50 rounded-xl border-2 border-slate-200 font-bold outline-none">
            <option value="">{t('allTypes')}</option>
            <option value="contribution">{t('contributions')}</option>
            <option value="savings">{t('savings')}</option>
            <option value="cash_fund">Fonds</option>
          </select>
        </div>
        <button onClick={() => setFilters({startDate:'',endDate:'',memberId:'',type:''})} className="mt-4 px-6 py-2 bg-slate-100 rounded-xl font-bold">{t('resetFilters')}</button>
      </div>

      {contributionsByDate.length > 0 || savingsByMember.length > 0 || cashFundByDate.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {contributionsByDate.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-black mb-4">📊 {t('contributions')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contributionsByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" style={{fontSize:'12px'}} />
                  <YAxis style={{fontSize:'12px'}} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="montant" fill="#3b82f6" name={t('amount')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {savingsByMember.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-black mb-4">📊 {t('savings')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={savingsByMember}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{fontSize:'12px'}} />
                  <YAxis style={{fontSize:'12px'}} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="montant" fill="#10b981" name={t('amount')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {cashFundByDate.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="font-black mb-4">📊 {t('cashFund')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cashFundByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" style={{fontSize:'12px'}} />
                  <YAxis style={{fontSize:'12px'}} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="montant" fill="#f59e0b" name={t('amount')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="font-bold text-slate-400">{t('noData')}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="font-black mb-4">📋 {t('recentTransactions')}</h3>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="font-bold">{t('noData')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.slice(0, 10).map((t) => {
              const member = members.find(m => m.id === t.memberId);
              return (
                <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold">{member?.name || 'Membre inconnu'}</p>
                    <p className="text-sm text-slate-500">{t.date} • {t.type}</p>
                  </div>
                  <p className={`font-black ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.amount >= 0 ? '+' : ''}{formatAmount(t.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}