// src/i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Navigation
      dashboard: 'Tableau de Bord',
      members: 'Membres',
      finances: 'Finances',
      loans: 'Prêts',
      reports: 'Rapports',
      rotations: 'Rotations',
      cashFund: 'Fonds de Caisse',
      settings: 'Paramètres',
      admin: 'Administration',
      logout: 'Déconnexion',
      
      // Dashboard
      activeSession: 'Séance Active',
      chooseDate: 'Choisissez la date pour commencer la séance',
      quickEntry: 'Saisie Rapide',
      recentTransactions: 'Transactions Récentes',
      contributions: 'Cotisations',
      savings: 'Épargne',
      amount: 'Montant',
      date: 'Date',
      advancedFilters: 'Filtres Avancés',
      resetFilters: 'Réinitialiser',
      allMembers: 'Tous les membres',
      allTypes: 'Tous les types',
      noData: 'Aucune donnée',
      
      // Members
      newMember: 'Nouveau membre',
      total: 'Total',
      withEmail: 'Avec Email',
      withPhone: 'Avec Tél.',
      callMember: 'Appeler',
      whatsappMember: 'WhatsApp',
      memberLimit: 'Limite de membres atteinte',
      upgradeToPro: 'Passez en Premium pour continuer',
      unlimited: 'Illimités',
      
      // Loans
      newLoan: 'Nouveau prêt',
      principal: 'Principal',
      interestRate: 'Taux d\'intérêt',
      dueDate: 'Date d\'échéance',
      totalDue: 'Total dû',
      remaining: 'Restant',
      paid: 'Payé',
      overdue: 'En retard',
      active: 'Actif',
      recordPayment: 'Enregistrer paiement',
      
      // Reports
      generateReport: 'Générer le Rapport PDF',
      reportPeriod: 'Période',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      meetingNotes: 'Notes de réunion',
      certifyReport: 'Certifier le rapport',
      shareWhatsApp: 'Partager sur WhatsApp',
      
      // Settings
      currency: 'Devise',
      language: 'Langue',
      subscription: 'Abonnement',
      currentStatus: 'Statut actuel',
      contactAdmin: 'Contacter l\'Administrateur',
      
      // Admin
      clientManagement: 'Gestion des Clients',
      totalClients: 'Total Clients',
      freeUsers: 'Gratuits',
      proUsers: 'PRO',
      pendingRequests: 'En Attente',
      revenue: 'Revenus',
      activatePro: 'Activer PRO',
      revokePro: 'Révoquer',
      contactClient: 'Contacter',
      expiryDate: 'Date d\'expiration',
      
      // Common
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      actions: 'Actions',
      status: 'Statut'
    }
  },
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      members: 'Members',
      finances: 'Finances',
      loans: 'Loans',
      reports: 'Reports',
      rotations: 'Rotations',
      cashFund: 'Cash Fund',
      settings: 'Settings',
      admin: 'Administration',
      logout: 'Logout',
      
      // Dashboard
      activeSession: 'Active Session',
      chooseDate: 'Choose the date to start the session',
      quickEntry: 'Quick Entry',
      recentTransactions: 'Recent Transactions',
      contributions: 'Contributions',
      savings: 'Savings',
      amount: 'Amount',
      date: 'Date',
      advancedFilters: 'Advanced Filters',
      resetFilters: 'Reset',
      allMembers: 'All members',
      allTypes: 'All types',
      noData: 'No data',
      
      // Members
      newMember: 'New member',
      total: 'Total',
      withEmail: 'With Email',
      withPhone: 'With Phone',
      callMember: 'Call',
      whatsappMember: 'WhatsApp',
      memberLimit: 'Member limit reached',
      upgradeToPro: 'Upgrade to Premium to continue',
      unlimited: 'Unlimited',
      
      // Loans
      newLoan: 'New loan',
      principal: 'Principal',
      interestRate: 'Interest rate',
      dueDate: 'Due date',
      totalDue: 'Total due',
      remaining: 'Remaining',
      paid: 'Paid',
      overdue: 'Overdue',
      active: 'Active',
      recordPayment: 'Record payment',
      
      // Reports
      generateReport: 'Generate PDF Report',
      reportPeriod: 'Period',
      startDate: 'Start date',
      endDate: 'End date',
      meetingNotes: 'Meeting notes',
      certifyReport: 'Certify report',
      shareWhatsApp: 'Share on WhatsApp',
      
      // Settings
      currency: 'Currency',
      language: 'Language',
      subscription: 'Subscription',
      currentStatus: 'Current status',
      contactAdmin: 'Contact Administrator',
      
      // Admin
      clientManagement: 'Client Management',
      totalClients: 'Total Clients',
      freeUsers: 'Free',
      proUsers: 'PRO',
      pendingRequests: 'Pending',
      revenue: 'Revenue',
      activatePro: 'Activate PRO',
      revokePro: 'Revoke',
      contactClient: 'Contact',
      expiryDate: 'Expiry date',
      
      // Common
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      actions: 'Actions',
      status: 'Status'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;