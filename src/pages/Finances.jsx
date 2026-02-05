import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function Finances() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const handleEdit = (tx) => {
    setEditingTx(tx.id);
    setEditForm({
      memberId: tx.memberId,
      type: tx.type,
      amount: Math.abs(tx.amount),
      direction: tx.direction || (tx.amount >= 0 ? 'in' : 'out'),
      date: tx.date
    });
  };

  const handleSaveEdit = async () => {
    try {
      const txRef = doc(db, 'transactions', editingTx);
      await updateDoc(txRef, {
        memberId: editForm.memberId,
        type: editForm.type,
        amount: Number(editForm.amount),
        direction: editForm.direction,
        date: editForm.date,
        updatedAt: new Date().toISOString()
      });
      setEditingTx(null);
      alert('✅ Transaction modifiée');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette transaction ?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
        alert('✅ Transaction supprimée');
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Erreur lors de la suppression');
      }
    }
  };

  const filteredTransactions = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const stats = {
    totalContributions: transactions.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
    totalSavings: transactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0),
    cashFund: transactions.filter(t => t.type === 'cash_fund').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0)
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black mb-2">💰 Finances</h2>
        <p className="text-emerald-100">Historique des transactions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Cotisations</p>
          <p className="text-2xl font-black text-blue-600">{formatAmount(stats.totalContributions)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Épargne</p>
          <p className="text-2xl font-black text-emerald-600">{formatAmount(stats.totalSavings)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Fonds</p>
          <p className="text-2xl font-black text-amber-600">{formatAmount(stats.cashFund)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex gap-2 mb-6">
          {['all', 'contribution', 'savings', 'cash_fund'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' && 'Toutes'}
              {f === 'contribution' && 'Cotisations'}
              {f === 'savings' && 'Épargne'}
              {f === 'cash_fund' && 'Fonds'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="font-bold">Aucune transaction</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const member = members.find(m => m.id === tx.memberId);
              const isEditing = editingTx === tx.id;

              return (
                <div key={tx.id} className="p-4 bg-slate-50 rounded-xl">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={editForm.memberId}
                          onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })}
                          className="px-3 py-2 bg-white rounded-lg border-2 border-slate-200 font-bold"
                        >
                          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="px-3 py-2 bg-white rounded-lg border-2 border-slate-200 font-bold"
                        >
                          <option value="contribution">Cotisation</option>
                          <option value="savings">Épargne</option>
                          <option value="cash_fund">Fonds</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          className="px-3 py-2 bg-white rounded-lg border-2 border-slate-200 font-bold"
                        />
                        <select
                          value={editForm.direction}
                          onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })}
                          className="px-3 py-2 bg-white rounded-lg border-2 border-slate-200 font-bold"
                        >
                          <option value="in">Entrée</option>
                          <option value="out">Sortie</option>
                        </select>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="px-3 py-2 bg-white rounded-lg border-2 border-slate-200 font-bold"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2"
                        >
                          <Icon name="check" className="w-4 h-4" />
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingTx(null)}
                          className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-bold">{member?.name || 'Membre inconnu'}</p>
                        <p className="text-sm text-slate-500">
                          {tx.date} • {tx.type === 'contribution' ? 'Cotisation' : tx.type === 'savings' ? 'Épargne' : 'Fonds'} • {tx.direction === 'in' ? 'Entrée' : 'Sortie'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`font-black text-xl ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatAmount(Math.abs(tx.amount))}
                        </p>
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600"
                        >
                          <Icon name="edit" className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 hover:bg-rose-100 rounded-lg text-rose-600"
                        >
                          <Icon name="trash" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}