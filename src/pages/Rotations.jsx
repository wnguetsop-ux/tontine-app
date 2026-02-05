import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function Rotations() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [members, setMembers] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sessionDate: '',
    hostMemberId: '',
    beneficiaryMemberId: '',
    location: ''
  });

  useEffect(() => {
    if (!user) return;

    const q1 = query(collection(db, 'members'), where('userId', '==', user.uid));
    const unsub1 = onSnapshot(q1, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const q2 = query(collection(db, 'rotations'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      setRotations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const handleAddRotation = async () => {
    if (!form.sessionDate || !form.hostMemberId || !form.beneficiaryMemberId) {
      return;
    }

    const existing = rotations.find(r => r.sessionDate === form.sessionDate);
    if (existing) {
      return;
    }

    await addDoc(collection(db, 'rotations'), {
      userId: user.uid,
      sessionDate: form.sessionDate,
      hostMemberId: form.hostMemberId,
      beneficiaryMemberId: form.beneficiaryMemberId,
      location: form.location,
      status: 'planned',
      reminderSent: false,
      createdAt: new Date().toISOString()
    });

    setForm({ sessionDate: '', hostMemberId: '', beneficiaryMemberId: '', location: '' });
    setShowModal(false);
  };

  const handleDeleteRotation = async (id) => {
    await deleteDoc(doc(db, 'rotations', id));
  };

  const exportToPDF = () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('CALENDRIER DES ROTATIONS', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 30, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      const sortedRotations = [...rotations].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
      
      const tableData = sortedRotations.map(r => {
        const host = members.find(m => m.id === r.hostMemberId);
        const beneficiary = members.find(m => m.id === r.beneficiaryMemberId);
        const isPast = new Date(r.sessionDate) < new Date();
        
        return [
          new Date(r.sessionDate).toLocaleDateString('fr-FR'),
          host?.name || 'N/A',
          beneficiary?.name || 'N/A',
          r.location || '-',
          isPast ? 'Termine' : 'A venir'
        ];
      });

      // Remplacement de doc.autoTable par autoTable(doc, ...)
      autoTable(doc, {
        startY: 45,
        head: [['Date', 'Hote', 'Beneficiaire', 'Lieu', 'Statut']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
        styles: { fontSize: 10 }
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
      }

      doc.save(`Rotations_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erreur PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const rotationsByMonth = rotations.reduce((acc, r) => {
    const month = r.sessionDate.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(r);
    return acc;
  }, {});

  const sortedMonths = Object.keys(rotationsByMonth).sort();

  const getMonthName = (yearMonth) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  const stats = {
    total: rotations.length,
    planned: rotations.filter(r => r.status === 'planned').length,
    completed: rotations.filter(r => r.status === 'completed').length,
    upcoming: rotations.filter(r => r.status === 'planned' && new Date(r.sessionDate) > new Date()).length
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">🔄 Calendrier des Rotations</h2>
            <p className="text-amber-100">Planifiez les séances de tontine</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              disabled={loading || rotations.length === 0}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Icon name="download" />
              {loading ? 'Génération...' : 'PDF'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-white text-amber-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              + Programmer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Total</p>
          <p className="text-3xl font-black text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Planifiées</p>
          <p className="text-3xl font-black text-amber-600">{stats.planned}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Terminées</p>
          <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-600">
          <p className="text-xs text-slate-500 font-bold mb-1">À venir</p>
          <p className="text-3xl font-black text-purple-600">{stats.upcoming}</p>
        </div>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl text-center shadow-sm">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="calendar" className="w-10 h-10 text-amber-600" />
          </div>
          <p className="font-black text-xl text-slate-800 mb-2">Aucune séance programmée</p>
          <p className="text-slate-500 mb-6">Commencez par programmer votre première séance</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold shadow-lg"
          >
            Programmer une séance
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((month) => (
            <div key={month} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b">
                <h3 className="font-black text-lg text-indigo-900 capitalize">
                  📅 {getMonthName(month)}
                </h3>
              </div>
              
              <div className="p-6 space-y-3">
                {rotationsByMonth[month]
                  .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
                  .map((rotation) => {
                    const host = members.find(m => m.id === rotation.hostMemberId);
                    const beneficiary = members.find(m => m.id === rotation.beneficiaryMemberId);
                    const isPast = new Date(rotation.sessionDate) < new Date();
                    const isToday = rotation.sessionDate === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={rotation.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isToday
                            ? 'bg-amber-50 border-amber-300'
                            : isPast
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : 'bg-indigo-50 border-indigo-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                isToday
                                  ? 'bg-amber-200 text-amber-800'
                                  : isPast
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-indigo-200 text-indigo-800'
                              }`}>
                                {isToday ? '📍 Aujourd\'hui' : isPast ? '✓ Passé' : '📅 À venir'}
                              </span>
                              <span className="font-black text-lg">
                                {new Date(rotation.sessionDate).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-500 font-bold mb-1">🏠 Hôte</p>
                                <p className="font-black text-indigo-900">{host?.name || 'Non défini'}</p>
                                {host?.phone && <p className="text-xs text-slate-500">{host.phone}</p>}
                              </div>
                              <div>
                                <p className="text-slate-500 font-bold mb-1">🎯 Bénéficiaire</p>
                                <p className="font-black text-emerald-600">{beneficiary?.name || 'Non défini'}</p>
                                {beneficiary?.phone && <p className="text-xs text-slate-500">{beneficiary.phone}</p>}
                              </div>
                              {rotation.location && (
                                <div className="md:col-span-2">
                                  <p className="text-slate-500 font-bold mb-1">📍 Lieu</p>
                                  <p className="font-bold">{rotation.location}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteRotation(rotation.id)}
                            className="p-2 hover:bg-rose-100 rounded-xl text-rose-600 transition-colors"
                            title="Supprimer"
                          >
                            <Icon name="trash" className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">Programmer une Séance</h3>
              <button onClick={() => setShowModal(false)}>
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date de la séance *</label>
                <input
                  type="date"
                  value={form.sessionDate}
                  onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Membre hôte *</label>
                <select
                  value={form.hostMemberId}
                  onChange={(e) => setForm({ ...form, hostMemberId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
                >
                  <option value="">Choisir un membre...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Qui organise la réunion</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bénéficiaire *</label>
                <select
                  value={form.beneficiaryMemberId}
                  onChange={(e) => setForm({ ...form, beneficiaryMemberId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
                >
                  <option value="">Choisir un membre...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Qui reçoit les fonds</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Lieu (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Chez Marie, Salle communautaire..."
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleAddRotation}
                className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl"
              >
                Programmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}