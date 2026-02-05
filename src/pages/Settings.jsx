import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function Settings() {
  const { user, profile } = useAuth();
  const { currency, setCurrency, currencies } = useCurrency();
  const { t, i18n } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });

  const isPro = profile?.subscription_status === 'pro';
  const isPending = profile?.subscription_status === 'pending';
  const expiryDate = profile?.subscription_expires_at 
    ? new Date(profile.subscription_expires_at).toLocaleDateString('fr-FR')
    : null;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleUpgradeToPro = async (method) => {
    setPaymentMethod(method);
    
    if (method === 'stripe' || method === 'flutterwave') {
      alert(`Redirection vers ${method}... (À configurer)`);
      return;
    }
    
    if (method === 'manual') {
      setShowPaymentInfo(true);
      
      try {
        await setDoc(doc(db, 'subscription_requests', user.uid), {
          userId: user.uid,
          userEmail: user.email,
          status: 'pending',
          payment_method: 'manual',
          requested_at: new Date().toISOString()
        });
        
        await setDoc(doc(db, 'users', user.uid), {
          subscription_status: 'pending'
        }, { merge: true });
        
        alert('✅ Demande envoyée ! Veuillez effectuer le paiement et nous contacter.');
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Erreur');
      }
    }
  };

  const handleSendMessage = () => {
    if (!contactForm.subject || !contactForm.message) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const whatsappMessage = `📩 *Nouveau message de ${user.email}*

📌 *Sujet:* ${contactForm.subject}

💬 *Message:*
${contactForm.message}

---
Email: ${user.email}
Date: ${new Date().toLocaleString('fr-FR')}`;

    const whatsappUrl = `https://wa.me/237674095062?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    setContactForm({ subject: '', message: '' });
    setShowContactForm(false);
    alert('✅ Votre message va être envoyé sur WhatsApp !');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black mb-2">⚙️ {t('settings')}</h2>
        <p className="text-indigo-100">Configurez votre compte</p>
      </div>

      {/* Abonnement */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-black text-lg mb-4">💎 {t('subscription')}</h3>
        
        <div className="space-y-4">
          <div className="bg-slate-50 p-6 rounded-2xl">
            <p className="text-sm text-slate-600 mb-2">{t('currentStatus')}</p>
            <div className="flex items-center gap-3">
              {isPro ? (
                <>
                  <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black text-lg shadow-lg">
                    🌟 PREMIUM
                  </span>
                  {expiryDate && (
                    <span className="text-sm text-slate-600">
                      Expire le <span className="font-bold">{expiryDate}</span>
                    </span>
                  )}
                </>
              ) : isPending ? (
                <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-black">
                  ⏳ Demande en attente
                </span>
              ) : (
                <span className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-black">
                  ⚪ GRATUIT
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-2xl">
              <p className="text-xs text-indigo-600 font-bold mb-1">{t('members')}</p>
              <p className="text-2xl font-black text-indigo-600">
                {isPro ? '∞' : '5 max'}
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl">
              <p className="text-xs text-emerald-600 font-bold mb-1">Fonctionnalités</p>
              <p className="text-2xl font-black text-emerald-600">
                {isPro ? 'Toutes' : 'Limitées'}
              </p>
            </div>
          </div>

          {/* Passer Premium */}
          {!isPro && !isPending && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200">
              <h4 className="font-black text-lg mb-3 text-amber-900">🚀 Passer en Premium</h4>
              <p className="text-sm text-amber-800 mb-4">Débloquez toutes les fonctionnalités:</p>
              <ul className="space-y-2 text-sm text-amber-900 mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  Membres illimités
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  Rapports PDF avancés
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  Support prioritaire
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  Sauvegardes automatiques
                </li>
              </ul>

              <div className="space-y-3">
                <p className="font-bold text-amber-900">Choisissez votre moyen de paiement:</p>
                
                <div className="w-full flex justify-center">
  <stripe-buy-button
    buy-button-id="buy_btn_1SxZne0xylvxJgKUiwM0DNho"
    publishable-key="pk_live_51Swh800xylvxJgKUViyH1UJriRS7nQpIqke987D7mb2P3JtZXg1IcWqidG7DeofP9AydrVrNboBEx6tsEbExyFZp00tBlStzJt"
  >
  </stripe-buy-button>
</div>


                <button
                  onClick={() => handleUpgradeToPro('flutterwave')}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  🌍 Mobile Money (Flutterwave)
                </button>

                <button
                  onClick={() => handleUpgradeToPro('manual')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  💰 Paiement Manuel
                </button>
              </div>
            </div>
          )}

          {/* Instructions paiement manuel */}
          {showPaymentInfo && (
            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl">
              <h4 className="font-black text-lg mb-3 text-blue-900">📋 Instructions de Paiement</h4>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <p className="font-bold">Mobile Money (MTN/Orange):</p>
                  <p className="font-mono bg-white px-3 py-2 rounded mt-1">+237 674 095 062</p>
                </div>
                <div>
                  <p className="font-bold">PayPal:</p>
                  <p className="font-mono bg-white px-3 py-2 rounded mt-1">j_nguetsop@yahoo.com</p>
                </div>
                <div>
                  <p className="font-bold">Montant:</p>
                  <p className="font-mono bg-white px-3 py-2 rounded mt-1">10 000 FCFA / mois</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <p className="font-bold">⚠️ Important:</p>
                  <p>Après paiement, envoyez une capture d'écran par WhatsApp au +237 674 095 062 avec votre email ({user?.email})</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Préférences */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-black text-lg mb-4">🎨 Préférences</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              💱 {t('currency')}
            </label>
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full max-w-xs px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              💡 La devise sera automatiquement appliquée à toutes les pages
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              🌍 {t('language')}
            </label>
            <select 
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="w-full max-w-xs px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              💡 La langue sera synchronisée sur toutes les pages
            </p>
          </div>
        </div>
      </div>

      {/* Contact Admin - NOUVEAU */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-black text-lg mb-4">📞 {t('contactAdmin')}</h3>
        
        {!showContactForm ? (
          <button
            onClick={() => setShowContactForm(true)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">💬</span>
            Nous Contacter
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                📌 Sujet de votre demande *
              </label>
              <select
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              >
                <option value="">Sélectionnez un sujet...</option>
                <option value="Question Technique">Question Technique</option>
                <option value="Problème de Paiement">Problème de Paiement</option>
                <option value="Demande d'Activation PRO">Demande d'Activation PRO</option>
                <option value="Bug / Erreur">Bug / Erreur</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                💬 Votre message *
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Décrivez votre demande en détail..."
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
              />
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl">
              <p className="text-sm text-indigo-800">
                ℹ️ Votre message sera envoyé directement sur notre WhatsApp. 
                Vous recevrez une réponse dans les 24h.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowContactForm(false);
                  setContactForm({ subject: '', message: '' });
                }}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Icon name="send" className="w-5 h-5" />
                Envoyer sur WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informations compte */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-black text-lg mb-4">👤 Mon Compte</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-bold">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">ID Utilisateur</p>
            <p className="font-mono text-sm">{user?.uid}</p>
          </div>
        </div>
      </div>
    </div>
  );
}