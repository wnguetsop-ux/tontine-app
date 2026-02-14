import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-black mb-2">ℹ️ À propos</h2>
        <p className="text-indigo-100">Découvrez Tontine Pour Tous</p>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-black mb-4">🎯 Notre Mission</h3>
        <p className="text-lg text-slate-700 mb-4">
          <strong>Tontine Pour Tous</strong> est née d'un constat simple : gérer une tontine traditionnellement 
          prend beaucoup de temps et peut être source d'erreurs.
        </p>
        <p className="text-slate-600 mb-4">
          Notre mission est de <strong>digitaliser et simplifier la gestion des tontines</strong> pour permettre 
          aux trésoriers et membres de se concentrer sur l'essentiel : <strong>l'entraide et la solidarité</strong>.
        </p>
        <p className="text-slate-600">
          Grâce à notre application, vous pouvez gérer vos cotisations, prêts, rotations et rapports en quelques clics, 
          tout en gardant une trace complète et professionnelle de toutes vos transactions.
        </p>
      </div>

      {/* Fonctionnalités */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-black mb-6">✨ Fonctionnalités principales</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="text-4xl">👥</div>
            <div>
              <h4 className="font-bold mb-2">Gestion des membres</h4>
              <p className="text-sm text-slate-600">
                Ajoutez vos membres avec leurs coordonnées. Appel et WhatsApp direct depuis l'app.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-4xl">💰</div>
            <div>
              <h4 className="font-bold mb-2">Suivi des cotisations</h4>
              <p className="text-sm text-slate-600">
                Enregistrez cotisations, épargne, fonds de caisse. Graphiques temps réel.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-4xl">🏦</div>
            <div>
              <h4 className="font-bold mb-2">Gestion des prêts</h4>
              <p className="text-sm text-slate-600">
                Créez des prêts avec calcul automatique des intérêts. Détection des retards.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-4xl">📄</div>
            <div>
              <h4 className="font-bold mb-2">Rapports PDF</h4>
              <p className="text-sm text-slate-600">
                Générez des rapports professionnels en un clic. Partagez sur WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-4xl">🔄</div>
            <div>
              <h4 className="font-bold mb-2">Rotations</h4>
              <p className="text-sm text-slate-600">
                Planifiez vos séances avec hôtes et bénéficiaires. Calendrier exportable.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-4xl">💱</div>
            <div>
              <h4 className="font-bold mb-2">Multi-devises</h4>
              <p className="text-sm text-slate-600">
                FCFA, EUR, USD, GBP... Plus de 10 devises disponibles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarifs */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-black mb-6">💎 Tarifs</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-slate-200 rounded-2xl p-6">
            <h4 className="text-xl font-black mb-2">Version Gratuite</h4>
            <p className="text-3xl font-black text-indigo-600 mb-4">0€ <span className="text-base text-slate-600 font-normal">/mois</span></p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Jusqu'à 5 membres
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Toutes les fonctionnalités
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Rapports PDF
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Multi-devises
              </li>
            </ul>
          </div>

          <div className="border-2 border-amber-400 rounded-2xl p-6 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-black">Version Premium</h4>
              <span className="px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-black">
                POPULAIRE
              </span>
            </div>
            <p className="text-3xl font-black text-amber-600 mb-4">
              1€ <span className="text-base text-slate-600 font-normal">/mois</span>
              <span className="block text-sm text-slate-600 font-normal">ou 1 000 FCFA/mois</span>
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <strong>Membres illimités ∞</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Toutes les fonctionnalités
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Rapports PDF avancés
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Support prioritaire
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                Sauvegardes automatiques
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Moyens de paiement */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-black mb-6">💳 Moyens de paiement</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl">
            <span className="text-3xl">💳</span>
            <div>
              <h4 className="font-bold">Carte bancaire (Stripe)</h4>
              <p className="text-sm text-slate-600">Paiement sécurisé par carte Visa, Mastercard, etc.</p>
              <a
                href="https://buy.stripe.com/14AdR1gMt05YbvmgygaVa00"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Payer par carte →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
            <span className="text-3xl">📱</span>
            <div>
              <h4 className="font-bold">Mobile Money</h4>
              <p className="text-sm text-slate-600 mb-1">MTN, Orange Money</p>
              <p className="font-mono text-sm font-bold">+237 651 495 483</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl">
            <span className="text-3xl">💰</span>
            <div>
              <h4 className="font-bold">PayPal</h4>
              <p className="font-mono text-sm font-bold">j_nguetsop@yahoo.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-black mb-6">📞 Nous contacter</h3>
        
        <div className="space-y-4">
          <a
            href="https://wa.me/393299639430"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all"
          >
            <span className="text-4xl">💬</span>
            <div>
              <h4 className="font-bold">WhatsApp</h4>
              <p className="text-sm text-slate-600">+39 329 963 9430 (Italie)</p>
            </div>
          </a>

          <a
            href="mailto:j_nguetsop@yahoo.com"
            className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
          >
            <span className="text-4xl">✉️</span>
            <div>
              <h4 className="font-bold">Email</h4>
              <p className="text-sm text-slate-600">j_nguetsop@yahoo.com</p>
            </div>
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-black mb-6">❓ Questions fréquentes</h3>
        
        <div className="space-y-4">
          <details className="group">
            <summary className="cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 font-bold">
              Est-ce vraiment gratuit ?
            </summary>
            <p className="p-4 text-slate-600">
              Oui ! La version gratuite vous permet de gérer jusqu'à 5 membres avec toutes les fonctionnalités. 
              Passez Premium à 1€/mois pour des membres illimités.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 font-bold">
              Puis-je changer de devise ?
            </summary>
            <p className="p-4 text-slate-600">
              Oui ! Vous pouvez choisir parmi plus de 10 devises (FCFA, EUR, USD, GBP, etc.) 
              et la changer à tout moment dans les paramètres.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 font-bold">
              Mes données sont-elles sécurisées ?
            </summary>
            <p className="p-4 text-slate-600">
              Absolument ! Nous utilisons Firebase (Google) pour stocker vos données de manière sécurisée. 
              Vos données sont chiffrées et sauvegardées automatiquement.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 font-bold">
              Puis-je annuler mon abonnement Premium ?
            </summary>
            <p className="p-4 text-slate-600">
              Oui, à tout moment ! Contactez-nous sur WhatsApp et nous annulerons votre abonnement immédiatement.
            </p>
          </details>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
        <h3 className="text-2xl font-black mb-4">Prêt à commencer ?</h3>
        <p className="mb-6">Créez votre compte gratuitement en 30 secondes</p>
        <Link
          to="/register"
          className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-xl font-black hover:shadow-xl transition-all"
        >
          Créer mon compte →
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-500">
        <p>© 2026 Tontine Pour Tous. Tous droits réservés.</p>
        <p className="mt-2">
          <a href="https://wa.me/393299639430" className="hover:text-indigo-600">Contact</a>
          {" • "}
          <Link to="/" className="hover:text-indigo-600">Accueil</Link>
        </p>
      </div>
    </div>
  );
}