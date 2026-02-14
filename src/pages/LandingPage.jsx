import React from 'react';
import { Link } from 'react-router-dom';

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    arrow: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💰</span>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Tontine Pour Tous
            </span>
          </div>
          <Link
            to="/login"
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Connexion
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-black mb-6">
          Gérez votre tontine
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            en toute simplicité
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          L'application complète pour gérer vos membres, cotisations, prêts, et rotations. 
          Rapports PDF professionnels en un clic.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-lg shadow-2xl hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2"
          >
            Commencer gratuitement
            <Icon name="arrow" className="w-6 h-6" />
          </Link>
          <a
            href="https://wa.me/393299639430"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all"
          >
            💬 Nous contacter
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div>
            <p className="text-4xl font-black text-indigo-600">100%</p>
            <p className="text-slate-600">Gratuit au départ</p>
          </div>
          <div>
            <p className="text-4xl font-black text-purple-600">1€</p>
            <p className="text-slate-600">Par mois Premium</p>
          </div>
          <div>
            <p className="text-4xl font-black text-emerald-600">∞</p>
            <p className="text-slate-600">Membres Premium</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-16">
            Tout ce dont vous avez besoin
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "👥",
                title: "Gestion des membres",
                description: "Ajoutez vos membres avec contacts (téléphone, email). Appels et WhatsApp directs.",
                color: "indigo"
              },
              {
                icon: "💰",
                title: "Suivi des cotisations",
                description: "Enregistrez cotisations, épargne, fonds de caisse. Graphiques en temps réel.",
                color: "emerald"
              },
              {
                icon: "🏦",
                title: "Gestion des prêts",
                description: "Créez des prêts avec intérêts automatiques. Détection des retards.",
                color: "blue"
              },
              {
                icon: "📄",
                title: "Rapports PDF",
                description: "Générez des rapports professionnels. Partagez sur WhatsApp en un clic.",
                color: "purple"
              },
              {
                icon: "🔄",
                title: "Rotations",
                description: "Planifiez vos séances avec calendrier. Exportez en PDF.",
                color: "orange"
              },
              {
                icon: "💱",
                title: "Multi-devises",
                description: "FCFA, EUR, USD, GBP... Plus de 10 devises supportées.",
                color: "amber"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-slate-50 p-8 rounded-2xl hover:shadow-xl transition-all">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-black mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-4">
            Tarifs simples et transparents
          </h2>
          <p className="text-center text-slate-600 mb-16">
            Commencez gratuitement, passez Premium quand vous êtes prêt
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Gratuit */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h3 className="text-2xl font-black mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-5xl font-black">0€</span>
                <span className="text-slate-600">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Jusqu'à 5 membres",
                  "Toutes les fonctionnalités",
                  "Rapports PDF",
                  "Multi-devises",
                  "Support par email"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icon name="check" className="text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full py-3 bg-slate-100 text-center rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-sm font-black">
                POPULAIRE
              </div>
              <h3 className="text-2xl font-black mb-2">Premium</h3>
              <div className="mb-6">
                <span className="text-5xl font-black">1€</span>
                <span className="text-indigo-100">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Membres illimités ∞",
                  "Toutes les fonctionnalités",
                  "Rapports PDF avancés",
                  "Multi-devises",
                  "Support prioritaire WhatsApp",
                  "Sauvegardes automatiques"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icon name="check" className="text-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full py-3 bg-white text-indigo-600 text-center rounded-xl font-black hover:shadow-lg transition-all"
              >
                Essayer Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black text-center mb-16">
            Comment ça marche ?
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Créez votre compte", desc: "En 30 secondes avec votre email" },
              { step: "2", title: "Ajoutez vos membres", desc: "Jusqu'à 5 gratuitement" },
              { step: "3", title: "Enregistrez les cotisations", desc: "Suivi en temps réel" },
              { step: "4", title: "Générez des rapports", desc: "PDF professionnel en 1 clic" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-black text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <h2 className="text-4xl font-black mb-4">
              Prêt à digitaliser votre tontine ?
            </h2>
            <p className="text-xl mb-8 text-indigo-100">
              Rejoignez des centaines d'utilisateurs qui gèrent leur tontine facilement
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-black text-lg hover:shadow-2xl transition-all"
            >
              Commencer gratuitement →
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-black mb-6">Contactez-nous</h2>
              <div className="space-y-4">
                <a
                  href="https://wa.me/393299639430"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-lg hover:text-green-400 transition-colors"
                >
                  <span className="text-2xl">💬</span>
                  WhatsApp: +39 329 963 9430
                </a>
                <a
                  href="mailto:j_nguetsop@yahoo.com"
                  className="flex items-center gap-3 text-lg hover:text-blue-400 transition-colors"
                >
                  <span className="text-2xl">✉️</span>
                  j_nguetsop@yahoo.com
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black mb-6">Moyens de paiement</h3>
              <div className="space-y-3 text-slate-300">
                <p>💳 Carte bancaire (Stripe)</p>
                <p>📱 Mobile Money: +237 651 495 483</p>
                <p>💰 PayPal: j_nguetsop@yahoo.com</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400">
            <p>© 2026 Tontine Pour Tous. Tous droits réservés.</p>
          </div>
        </div>
      </section>
    </div>
  );
}