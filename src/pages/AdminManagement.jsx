import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';

const ADMIN_EMAILS = ['wnguetsop@gmail.com', 'admin@tontine.com'];

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    crown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  };
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>{icons[name]}</svg>;
};

export default function AdminManagement() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  useEffect(() => {
    if (!isAdmin) return;

    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const requestsQuery = query(
      collection(db, 'subscription_requests'),
      where('status', '==', 'pending')
    );
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const paymentsQuery = query(collection(db, 'payments'));
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubRequests();
      unsubPayments();
    };
  }, [isAdmin]);

  const handleActivatePro = async (userId, requestId = null) => {
    if (!expiryDate) {
      alert('Veuillez choisir une date d\'expiration');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscription_status: 'pro',
        subscription_expires_at: new Date(expiryDate).toISOString(),
        updated_at: new Date().toISOString()
      });

      if (requestId) {
        const requestRef = doc(db, 'subscription_requests', requestId);
        await updateDoc(requestRef, {
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user.email
        });
      }

      alert('✅ Compte PRO activé avec succès !');
      setShowModal(false);
      setSelectedUser(null);
      setExpiryDate('');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Erreur lors de l\'activation');
    }
  };

  const handleRevokePro = async (userId) => {
    if (!window.confirm('Révoquer le statut PRO de cet utilisateur ?')) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscription_status: 'free',
        subscription_expires_at: null,
        updated_at: new Date().toISOString()
      });

      alert('✅ Statut PRO révoqué');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Erreur');
    }
  };

  const contactClient = (client) => {
    const subject = 'Tontine Pour Tous - Besoin d\'aide ?';
    const body = `Bonjour,

Nous avons remarqué que vous utilisez Tontine Pour Tous.

Avez-vous besoin d'aide ou d'informations supplémentaires sur nos fonctionnalités Premium ?

N'hésitez pas à nous répondre, nous serons ravis de vous aider !

Cordialement,
L'équipe Tontine Pour Tous`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const filteredUsers = users.filter(userItem => {
    if (filter !== 'all' && userItem.subscription_status !== filter) return false;
    if (search && !userItem.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: users.length,
    free: users.filter(u => u.subscription_status === 'free').length,
    pro: users.filter(u => u.subscription_status === 'pro').length,
    pending: users.filter(u => u.subscription_status === 'pending').length,
    revenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  const isNewPro = (userDate) => {
    if (!userDate) return false;
    const date = new Date(userDate);
    const now = new Date();
    const diff = (now - date) / (1000 * 60 * 60);
    return diff < 24;
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-rose-50 border-2 border-rose-200 p-8 rounded-3xl text-center max-w-md">
          <p className="text-5xl mb-4">🔒</p>
          <p className="font-black text-rose-800 text-2xl mb-2">Accès Refusé</p>
          <p className="text-rose-600 mb-4">Cette page est réservée aux administrateurs.</p>
          <p className="text-sm text-rose-500">Email actuel: {user?.email}</p>
          <p className="text-xs text-slate-500 mt-4">
            Pour devenir admin, ajoutez votre email dans AdminManagement.jsx ligne 7
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Icon name="crown" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black">👨‍💼 Gestion Admin</h2>
            <p className="text-white/80">Gérez les clients et abonnements</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-indigo-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Total Clients</p>
          <p className="text-3xl font-black text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-slate-400">
          <p className="text-xs text-slate-500 font-bold mb-1">Gratuits</p>
          <p className="text-3xl font-black text-slate-600">{stats.free}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-600">
          <p className="text-xs text-slate-500 font-bold mb-1">PRO</p>
          <p className="text-3xl font-black text-amber-600">{stats.pro}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange-600">
          <p className="text-xs text-slate-500 font-bold mb-1">En Attente</p>
          <p className="text-3xl font-black text-orange-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-600">
          <p className="text-xs text-slate-500 font-bold mb-1">Revenus</p>
          <p className="text-3xl font-black text-emerald-600">{stats.revenue}€</p>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <span className="animate-pulse">🔔</span>
            Demandes d'Activation PRO ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map((req) => {
              const reqUser = users.find(u => u.id === req.userId);
              return (
                <div key={req.id} className="bg-white p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{req.userEmail}</p>
                    <p className="text-xs text-slate-500">
                      Demandé le {new Date(req.requested_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(reqUser);
                      setShowModal(true);
                    }}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600"
                  >
                    Activer PRO
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'free', 'pro', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' && '📊 Tous'}
              {f === 'free' && '⚪ Gratuits'}
              {f === 'pro' && '🌟 PRO'}
              {f === 'pending' && '⏳ En attente'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Rechercher par email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Client</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Inscription</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Expiration</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((userItem) => {
                const isExpired = userItem.subscription_expires_at && new Date(userItem.subscription_expires_at) < new Date();
                const showNewBadge = isNewPro(userItem.updated_at) && userItem.subscription_status === 'pro';

                return (
                  <tr key={userItem.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Icon name="user" className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{userItem.email}</p>
                          <p className="text-xs text-slate-500">ID: {userItem.id?.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {userItem.subscription_status === 'pro' && (
                          <>
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black flex items-center gap-1">
                              <Icon name="crown" className="w-3 h-3" />
                              PRO
                            </span>
                            {showNewBadge && (
                              <span className="animate-pulse px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-xs font-black">
                                ✨ NEW
                              </span>
                            )}
                            {isExpired && (
                              <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-black">
                                Expiré
                              </span>
                            )}
                          </>
                        )}
                        {userItem.subscription_status === 'pending' && (
                          <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-black">
                            ⏳ En attente
                          </span>
                        )}
                        {userItem.subscription_status === 'free' && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black">
                            Gratuit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-600">
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-600">
                        {userItem.subscription_expires_at
                          ? new Date(userItem.subscription_expires_at).toLocaleDateString('fr-FR')
                          : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {userItem.subscription_status !== 'pro' && (
                          <button
                            onClick={() => {
                              setSelectedUser(userItem);
                              setShowModal(true);
                            }}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100"
                          >
                            Activer PRO
                          </button>
                        )}
                        {userItem.subscription_status === 'pro' && (
                          <button
                            onClick={() => handleRevokePro(userItem.id)}
                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100"
                          >
                            Révoquer
                          </button>
                        )}
                        <button
                          onClick={() => contactClient(userItem)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100"
                          title="Contacter le client"
                        >
                          📧
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-black mb-6">Activer PRO</h3>
            
            <div className="bg-indigo-50 p-4 rounded-2xl mb-6">
              <p className="font-bold text-indigo-900">{selectedUser.email}</p>
              <p className="text-sm text-indigo-600">ID: {selectedUser.id}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Date d'expiration *
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-600 outline-none font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 1);
                    setExpiryDate(date.toISOString().split('T')[0]);
                  }}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold"
                >
                  +1 mois
                </button>
                <button
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 6);
                    setExpiryDate(date.toISOString().split('T')[0]);
                  }}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold"
                >
                  +6 mois
                </button>
                <button
                  onClick={() => {
                    const date = new Date();
                    date.setFullYear(date.getFullYear() + 1);
                    setExpiryDate(date.toISOString().split('T')[0]);
                  }}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold"
                >
                  +1 an
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setExpiryDate('');
                }}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const request = requests.find(r => r.userId === selectedUser.id);
                  handleActivatePro(selectedUser.id, request?.id);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold shadow-lg"
              >
                Activer PRO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}