import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    email: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    sessionReminders: true,
    contributionReminders: true,
    loanReminders: true,
    monthlyReports: true,
    transactionAlerts: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'notificationSettings', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await setDoc(doc(db, 'notificationSettings', user.uid), {
        ...settings,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });
      
      alert('✅ Paramètres sauvegardés !');
    } catch (error) {
      console.error('Error saving:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Icon name="bell" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black">🔔 Notifications</h2>
            <p className="text-indigo-100">Configurez vos préférences de notifications</p>
          </div>
        </div>
      </div>

      {/* Canaux de notification */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-black text-lg mb-4">📢 Canaux de notification</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Icon name="email" className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-bold">Email</p>
                <p className="text-sm text-slate-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailEnabled')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.emailEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.emailEnabled ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Icon name="phone" className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold">SMS</p>
                <p className="text-sm text-slate-600">Notifications par SMS (bientôt disponible)</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('smsEnabled')}
              disabled
              className={`relative w-14 h-8 rounded-full transition-colors opacity-50 cursor-not-allowed ${
                settings.smsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.smsEnabled ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Icon name="bell" className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-bold">Notifications in-app</p>
                <p className="text-sm text-slate-600">Alertes dans l'application</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('inAppEnabled')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.inAppEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.inAppEnabled ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Types de notifications */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-black text-lg mb-4">🎯 Types de notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold">📅 Rappels de séance</p>
              <p className="text-sm text-slate-600">Notification 24h avant chaque séance</p>
            </div>
            <button
              onClick={() => handleToggle('sessionReminders')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.sessionReminders ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.sessionReminders ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold">⚠️ Cotisations en retard</p>
              <p className="text-sm text-slate-600">Alerte si aucune cotisation depuis 30 jours</p>
            </div>
            <button
              onClick={() => handleToggle('contributionReminders')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.contributionReminders ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.contributionReminders ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold">⏰ Échéances de prêt</p>
              <p className="text-sm text-slate-600">Rappel 7 jours avant l'échéance</p>
            </div>
            <button
              onClick={() => handleToggle('loanReminders')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.loanReminders ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.loanReminders ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold">📊 Rapports mensuels</p>
              <p className="text-sm text-slate-600">Résumé envoyé le 1er de chaque mois</p>
            </div>
            <button
              onClick={() => handleToggle('monthlyReports')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.monthlyReports ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.monthlyReports ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-bold">💰 Alertes de transactions</p>
              <p className="text-sm text-slate-600">Notification à chaque nouvelle transaction</p>
            </div>
            <button
              onClick={() => handleToggle('transactionAlerts')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.transactionAlerts ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.transactionAlerts ? 'translate-x-6' : ''
              }`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Exemples */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h3 className="font-black text-lg mb-4 text-blue-900">📬 Exemples de notifications</h3>
        
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border-l-4 border-blue-600">
            <p className="font-bold text-blue-900">🔔 Rappel de séance</p>
            <p className="text-sm text-slate-600 mt-1">
              "La prochaine séance de tontine aura lieu demain 15 février 2026 à 14h00"
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border-l-4 border-orange-600">
            <p className="font-bold text-orange-900">⚠️ Cotisation en retard</p>
            <p className="text-sm text-slate-600 mt-1">
              "Vous n'avez pas effectué de cotisation depuis plus de 30 jours"
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border-l-4 border-purple-600">
            <p className="font-bold text-purple-900">📊 Rapport mensuel</p>
            <p className="text-sm text-slate-600 mt-1">
              "Votre rapport de janvier 2026 est disponible: 45 000 FCFA de cotisations"
            </p>
          </div>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
      >
        {saving ? 'Sauvegarde...' : '💾 Sauvegarder les paramètres'}
      </button>

      {/* Info */}
      <div className="bg-slate-50 p-4 rounded-xl">
        <p className="text-sm text-slate-600">
          💡 <strong>Astuce :</strong> Les notifications vous aident à rester à jour avec votre tontine. 
          Activez au moins les rappels de séance et d'échéances pour ne rien manquer !
        </p>
      </div>
    </div>
  );
}