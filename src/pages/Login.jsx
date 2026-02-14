import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      // La redirection se fera automatiquement via useEffect
    } catch (err) {
      console.error('Auth error:', err);
      
      // Messages d'erreur en français
      if (err.code === 'auth/user-not-found') {
        setError('Aucun compte trouvé avec cet email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Mot de passe incorrect');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit contenir au moins 6 caractères');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email invalide');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <span className="text-4xl">💰</span>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Tontine Pour Tous
            </h1>
            <p className="text-slate-600 mt-2">
              {isRegister ? 'Créez votre compte' : 'Bienvenue !'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-bold">❌ {error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 outline-none transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 outline-none transition-colors"
                placeholder="••••••••"
              />
              {isRegister && (
                <p className="text-xs text-slate-500 mt-1">
                  Minimum 6 caractères
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isRegister ? 'Création...' : 'Connexion...'}
                </span>
              ) : (
                isRegister ? 'Créer mon compte' : 'Se connecter'
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isRegister 
                ? '← Déjà un compte ? Se connecter' 
                : 'Pas de compte ? Créer un compte →'}
            </button>
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-slate-500 text-sm hover:text-slate-700"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
          <p className="text-sm font-bold text-blue-900 mb-2">💡 Pour tester :</p>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>Email:</strong> demo@tontine.com</p>
            <p><strong>Mot de passe:</strong> demo123</p>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            (Créez d'abord ce compte si vous voulez l'utiliser)
          </p>
        </div>
      </div>
    </div>
  );
}