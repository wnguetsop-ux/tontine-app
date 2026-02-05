import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function Loans() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [form, setForm] = useState({
    memberId: '',
    amount: '',
    interestRate: '5',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });
  const [payment, setPayment] = useState({ amount: '' });

  useEffect(() => {
    if (!user) return;

    const q1 = query(collection(db, 'members'), where('userId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q2 = query(collection(db, 'loans'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  // Détection automatique des retards
  useEffect(() => {
    if (!user || loans.length === 0) return;

    const checkOverdueLoans = async () => {
      const today = new Date();
      
      for (const loan of loans) {
        if (loan.status === 'active' && new Date(loan.dueDate) < today) {
          try {
            const loanRef = doc(db, 'loans', loan.id);
            await updateDoc(loanRef, {
              status: 'overdue'
            });
            console.log('Prêt en retard détecté:', loan.id);
          } catch (error) {
            console.error('Erreur mise à jour statut:', error);
          }
        }
      }
    };

    checkOverdueLoans();
  }, [loans, user]);

  const handleAddLoan = async () => {
    if (!form.memberId || !form.amount || !form.dueDate) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const principal = Number(form.amount);
    const interest = principal * (Number(form.interestRate) / 100);
    const totalDue = principal + interest;

    await addDoc(collection(db, 'loans'), {
      userId: user.uid,
      memberId: form.memberId,
      principalAmount: principal,
      interestRate: Number(form.interestRate),
      totalAmountDue: totalDue,
      amountPaid: 0,
      amountRemaining: totalDue,
      startDate: form.startDate,
      dueDate: form.dueDate,
      status: 'active',
      createdAt: new Date().toISOString()
    });

    setForm({ memberId: '', amount: '', interestRate: '5', startDate: new Date().toISOString().split('T')[0], dueDate: '' });
    setShowModal(false);
  };

  const handleAddPayment = async () => {
    if (!payment.amount || Number(payment.amount) <= 0) {
      alert('Montant invalide');
      return;
    }

    const newPaid = selectedLoan.amountPaid + Number(payment.amount);
    const newRemaining = selectedLoan.totalAmountDue - newPaid;
    const newStatus = newRemaining <= 0 ? 'paid' : 'active';

    await updateDoc(doc(db, 'loans', selectedLoan.id), {
      amountPaid: newPaid,
      amountRemaining: Math.max(0, newRemaining),
      status: newStatus,
      lastPaymentDate: new Date().toISOString()
    });

    setPayment({ amount: '' });
    setShowPaymentModal(false);
    setSelectedLoan(null);
  };

  const stats = {
    active: loans.filter(l => l.status === 'active').length,
    totalLent: loans.reduce((s, l) => s + l.principalAmount, 0),
    totalRemaining: loans.filter(l => l.status === 'active').reduce((s, l) => s + l.amountRemaining, 0),
    overdue: loans.filter(l => l.status === 'overdue').length
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">🏦 Gestion des Prêts</h2>
          <p className="text-slate-600">Suivez les prêts et remboursements</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg">
          + Nouveau prêt
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Actifs</p>
          <p className="text-4xl font-black">{stats.active}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Prêté</p>
          <p className="text-2xl font-black">{formatAmount(stats.totalLent)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Restant</p>
          <p className="text-2xl font-black">{formatAmount(stats.totalRemaining)}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">En Retard</p>
          <p className="text-4xl font-black">{stats.overdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loans.map((loan) => {
          const member = members.find(m => m.id === loan.memberId);
          const isOverdue = loan.status === 'overdue';
          const isPaid = loan.status === 'paid';
          const progress = ((loan.amountPaid / loan.totalAmountDue) * 100).toFixed(0);

          return (
            <div key={loan.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden">
              <div className={`p-6 ${isPaid ? 'bg-emerald-50' : isOverdue ? 'bg-rose-50' : 'bg-indigo-50'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg">{member?.name || 'Membre inconnu'}</h3>
                    <p className="text-sm text-slate-600">{formatAmount(loan.principalAmount)} @ {loan.interestRate}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    isPaid ? 'bg-emerald-200 text-emerald-800' :
                    isOverdue ? 'bg-rose-200 text-rose-800' :
                    'bg-indigo-200 text-indigo-800'
                  }`}>
                    {isPaid ? '✓ Payé' : isOverdue ? '⚠️ Retard' : '● Actif'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Progression</span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{width: `${progress}%`}}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Total dû</p>
                      <p className="font-black">{formatAmount(loan.totalAmountDue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Restant</p>
                      <p className="font-black text-rose-600">{formatAmount(loan.amountRemaining)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Échéance</p>
                      <p className="font-bold">{new Date(loan.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Payé</p>
                      <p className="font-black text-emerald-600">{formatAmount(loan.amountPaid)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {loan.status !== 'paid' && (
                <div className="p-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                  >
                    Enregistrer paiement
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex justify-between mb-6">
              <h3 className="text-2xl font-black">Nouveau Prêt</h3>
              <button onClick={() => setShowModal(false)}><Icon name="close" /></button>
            </div>
            
            <div className="space-y-4">
              <select value={form.memberId} onChange={(e) => setForm({...form, memberId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 focus:border-indigo-600 outline-none font-bold">
                <option value="">Sélectionner membre *</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <input type="number" placeholder="Montant du prêt *" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 focus:border-indigo-600 outline-none font-bold" />

              <div>
                <label className="block text-sm font-bold mb-2">Taux d'intérêt (%)</label>
                <input type="number" value={form.interestRate} onChange={(e) => setForm({...form, interestRate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 focus:border-indigo-600 outline-none font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Date début</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 focus:border-indigo-600 outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Échéance *</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 focus:border-indigo-600 outline-none font-bold" />
                </div>
              </div>

              {form.amount && form.interestRate && (
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <p className="text-sm text-indigo-600 font-bold mb-1">Calcul automatique</p>
                  <p className="text-xs">Intérêts: {formatAmount(Number(form.amount) * Number(form.interestRate) / 100)}</p>
                  <p className="text-lg font-black text-indigo-600">Total dû: {formatAmount(Number(form.amount) + Number(form.amount) * Number(form.interestRate) / 100)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button>
              <button onClick={handleAddLoan} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold">Créer</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex justify-between mb-6">
              <h3 className="text-2xl font-black">Enregistrer Paiement</h3>
              <button onClick={() => { setShowPaymentModal(false); setSelectedLoan(null); }}><Icon name="close" /></button>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl mb-6">
              <p className="font-bold">{members.find(m => m.id === selectedLoan.memberId)?.name}</p>
              <p className="text-sm text-indigo-600">Restant: {formatAmount(selectedLoan.amountRemaining)}</p>
            </div>

            <input type="number" placeholder="Montant du paiement" value={payment.amount} onChange={(e) => setPayment({amount: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 focus:border-indigo-600 outline-none font-bold mb-6" />

            <div className="flex gap-3">
              <button onClick={() => { setShowPaymentModal(false); setSelectedLoan(null); }} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Annuler</button>
              <button onClick={handleAddPayment} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}