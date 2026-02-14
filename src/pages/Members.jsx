import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from 'react-i18next';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
    whatsapp: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function Members() {
  const { user, profile } = useAuth();
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'member'
  });

  const isPro = profile?.subscription_status === 'pro';

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

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const handleAddMember = async () => {
    if (!form.name) {
      alert('Le nom est obligatoire');
      return;
    }

    if (!isPro && members.length >= 5) {
      alert(`❌ ${t('memberLimit')} (5 max).\n\n${t('upgradeToPro')} !`);
      return;
    }

    await addDoc(collection(db, 'members'), {
      userId: user.uid,
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: form.role,
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    setForm({ name: '', phone: '', email: '', role: 'member' });
    setShowModal(false);
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm(`${t('delete')} ?`)) {
      await deleteDoc(doc(db, 'members', id));
    }
  };

  const getMemberStats = (memberId) => {
    const memberTx = transactions.filter(t => t.memberId === memberId);
    return {
      contributions: memberTx.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
      savings: memberTx.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0),
      cashFund: memberTx.filter(t => t.type === 'cash_fund').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0)
    };
  };

  const stats = {
    total: members.length,
    withEmail: members.filter(m => m.email).length,
    withPhone: members.filter(m => m.phone).length
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">👥 {t('members')}</h2>
          <p className="text-slate-600">
            {isPro ? `${t('members')} ${t('unlimited')}` : `${members.length}/5 ${t('members')}`}
            {!isPro && members.length >= 5 && (
              <span className="ml-2 text-orange-600 font-bold">⚠️ {t('memberLimit')}</span>
            )}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          disabled={!isPro && members.length >= 5}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + {t('newMember')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('total')}</p>
          <p className="text-3xl font-black text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('withEmail')}</p>
          <p className="text-3xl font-black text-emerald-600">{stats.withEmail}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('withPhone')}</p>
          <p className="text-3xl font-black text-blue-600">{stats.withPhone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const memberStats = getMemberStats(member.id);
          const initial = member.name.charAt(0).toUpperCase();
          
          return (
            <div key={member.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{initial}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-lg">{member.name}</h3>
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-bold">
                      {member.role === 'president' ? '👑 Président' : member.role === 'treasurer' ? '💰 Trésorier' : '👤 Membre'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Cotis.</p>
                    <p className="text-sm font-black text-blue-600">{formatAmount(memberStats.contributions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Épargne</p>
                    <p className="text-sm font-black text-emerald-600">{formatAmount(memberStats.savings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Fonds</p>
                    <p className="text-sm font-black text-amber-600">{formatAmount(memberStats.cashFund)}</p>
                  </div>
                </div>

                {member.phone && (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${member.phone}`}
                      className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-center text-sm hover:bg-blue-100 flex items-center justify-center gap-2"
                    >
                      <Icon name="phone" className="w-4 h-4" />
                      {t('callMember')}
                    </a>
                    <a
                      href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-center text-sm hover:bg-green-100 flex items-center justify-center gap-2"
                    >
                      <Icon name="whatsapp" className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100"
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">{t('newMember')}</h3>
              <button onClick={() => setShowModal(false)}>
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom complet *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              />

              <input
                type="tel"
                placeholder="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              />

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              />

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              >
                <option value="member">👤 Membre</option>
                <option value="treasurer">💰 Trésorier</option>
                <option value="president">👑 Président</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">{selectedMember.name}</h3>
              <button onClick={() => setSelectedMember(null)}>
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              {transactions
                .filter(t => t.memberId === selectedMember.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold">{t.type}</p>
                      <p className="text-sm text-slate-500">{t.date}</p>
                    </div>
                    <p className={`font-black text-xl ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatAmount(Math.abs(t.amount))}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
