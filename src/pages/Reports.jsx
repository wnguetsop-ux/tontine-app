import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function Reports() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [meetingNotes, setMeetingNotes] = useState('');
  const [certified, setCertified] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const generatePDF = () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('RAPPORT DE TONTINE', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Periode: ${filters.startDate} au ${filters.endDate}`, 105, 30, { align: 'center' });
      doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 37, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);

      let yPos = 50;

      const filteredTx = transactions.filter(t => 
        t.date >= filters.startDate && t.date <= filters.endDate
      );

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('RESUME FINANCIER', 20, yPos);
      yPos += 10;

      const totals = {
        contributions: filteredTx.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
        savings: filteredTx.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0),
        cashFund: filteredTx.filter(t => t.type === 'cash_fund').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0),
        loansActive: loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.amountRemaining || 0), 0)
      };

      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Montant']],
        body: [
          ['Cotisations', totals.contributions.toLocaleString() + ' F'],
          ['Epargne', totals.savings.toLocaleString() + ' F'],
          ['Fonds de Caisse', totals.cashFund.toLocaleString() + ' F'],
          ['Prets en cours', totals.loansActive.toLocaleString() + ' F'],
          ['TOTAL GENERAL', (totals.contributions + totals.savings + totals.cashFund).toLocaleString() + ' F']
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' }
      });

      yPos = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yPos + 60;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DETAIL PAR MEMBRE', 20, yPos);
      yPos += 10;

      const memberData = members.map(m => {
        const memberTx = filteredTx.filter(t => t.memberId === m.id);
        const cotis = memberTx.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0);
        const epargne = memberTx.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
        const fonds = memberTx.filter(t => t.type === 'cash_fund').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0);
        
        return [
          m.name,
          cotis.toLocaleString(),
          epargne.toLocaleString(),
          fonds.toLocaleString(),
          (cotis + epargne + fonds).toLocaleString()
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Membre', 'Cotisations', 'Epargne', 'Fonds', 'Total']],
        body: memberData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' }
      });

      if (loans.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('PRETS EN COURS', 20, yPos);
        yPos += 10;

        const loanData = loans
          .filter(l => l.status === 'active')
          .map(l => {
            const member = members.find(m => m.id === l.memberId);
            return [
              member?.name || 'Inconnu',
              l.principalAmount.toLocaleString(),
              l.interestRate + '%',
              l.totalAmountDue.toLocaleString(),
              (l.amountRemaining || 0).toLocaleString(),
              new Date(l.dueDate).toLocaleDateString('fr-FR')
            ];
          });

        if (loanData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            head: [['Membre', 'Principal', 'Taux', 'Total Du', 'Restant', 'Echeance']],
            body: loanData,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11], fontStyle: 'bold' }
          });
        }
      }

      if (meetingNotes) {
        doc.addPage();
        yPos = 20;
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('NOTES DE REUNION', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(meetingNotes, 170);
        doc.text(lines, 20, yPos);
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Tontine Pour Tous', 105, 285, { align: 'center' });
        
        if (certified) {
          doc.text('Rapport certifie conforme', 105, 280, { align: 'center' });
        }
      }

      doc.save(`Rapport_Tontine_${filters.startDate}_${filters.endDate}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    const message = `📊 Rapport de tontine du ${filters.startDate} au ${filters.endDate}\n\n✓ Consultez le PDF pour les détails complets.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredTx = transactions.filter(t => 
    t.date >= filters.startDate && t.date <= filters.endDate
  );

  const stats = {
    totalMembers: members.length,
    totalTransactions: filteredTx.length,
    totalAmount: filteredTx.reduce((s, t) => s + Math.abs(t.amount), 0)
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black mb-2">📄 {t('reports')}</h2>
        <p className="text-purple-100">Générez des rapports détaillés</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('members')}</p>
          <p className="text-3xl font-black text-indigo-600">{stats.totalMembers}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Transactions</p>
          <p className="text-3xl font-black text-emerald-600">{stats.totalTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-600">
          <p className="text-xs text-slate-500 font-bold mb-1">{t('amount')}</p>
          <p className="text-2xl font-black text-amber-600">{formatAmount(stats.totalAmount)}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm">
        <h3 className="font-black text-xl mb-6">{t('generateReport')}</h3>
        
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('startDate')}</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('endDate')}</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📝 {t('meetingNotes')}</label>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Décisions prises, annonces, problèmes discutés..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="w-5 h-5"
              id="certify"
            />
            <label htmlFor="certify" className="font-bold cursor-pointer">✓ {t('certifyReport')}</label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={generatePDF}
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  Génération...
                </>
              ) : (
                <>
                  <Icon name="download" className="w-6 h-6" />
                  {t('generateReport')}
                </>
              )}
            </button>
            
            <button
              onClick={shareWhatsApp}
              className="px-6 py-4 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl"
              title={t('shareWhatsApp')}
            >
              💬
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}