import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

export default function CashFund() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q1 = query(collection(db, 'members'), where('userId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q2 = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'cash_fund'));
    const unsub2 = onSnapshot(q2, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const getMemberBalance = (memberId) => {
    return transactions
      .filter(t => t.memberId === memberId)
      .reduce((sum, t) => sum + (t.direction === 'in' ? t.amount : -t.amount), 0);
  };

  const globalBalance = transactions.reduce((sum, t) => sum + (t.direction === 'in' ? t.amount : -t.amount), 0);

  const memberBalances = members.map(m => ({
    ...m,
    balance: getMemberBalance(m.id)
  })).sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black mb-2">💼 Fonds de Caisse</h2>
        <p className="text-emerald-100">Suivi des mouvements du fonds de caisse</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
        <p className="text-sm text-slate-500 font-bold mb-2">Solde Global</p>
        <p className={`text-5xl font-black ${globalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {globalBalance.toLocaleString()} F
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberBalances.map((member) => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden"
          >
            <div className={`p-6 ${member.balance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                  member.balance >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                }`}>
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg">{member.name}</h3>
                  <p className="text-xs text-slate-500">Cliquez pour détails</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Solde</p>
                <p className={`text-3xl font-black ${member.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {member.balance >= 0 ? '+' : ''}{member.balance.toLocaleString()} F
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">{selectedMember.name}</h3>
              <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-100 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl mb-6 text-center">
              <p className="text-sm text-emerald-600 font-bold mb-1">Solde Fonds de Caisse</p>
              <p className={`text-4xl font-black ${selectedMember.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {selectedMember.balance >= 0 ? '+' : ''}{selectedMember.balance.toLocaleString()} F
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-black">Historique des mouvements</h4>
              {transactions
                .filter(t => t.memberId === selectedMember.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold">{t.direction === 'in' ? '💰 Entrée' : '💸 Sortie'}</p>
                      <p className="text-sm text-slate-500">{t.date}</p>
                    </div>
                    <p className={`font-black text-xl ${t.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.direction === 'in' ? '+' : '-'}{t.amount.toLocaleString()} F
                    </p>
                  </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-600 mb-2">💡 Astuce</p>
              <p className="text-xs text-slate-600">
                Utilisez le Dashboard pour enregistrer de nouveaux mouvements de fonds de caisse
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { startPayment } from '../services/payment';

// ... dans ton composant ...
<button 
  onClick={startPayment}
  className="bg-blue-600 text-white p-2 rounded"
>
  Cotiser via Stripe
</button>