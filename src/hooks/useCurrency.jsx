// src/hooks/useCurrency.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

const CurrencyContext = createContext();

export function useCurrency() {
  return useContext(CurrencyContext);
}

const CURRENCIES = [
  { code: 'FCFA', symbol: 'F', name: 'Franc CFA' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar américain' },
  { code: 'GBP', symbol: '£', name: 'Livre sterling' },
  { code: 'CAD', symbol: 'C$', name: 'Dollar canadien' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc suisse' },
  { code: 'XOF', symbol: 'F', name: 'Franc CFA (UEMOA)' },
  { code: 'NGN', symbol: '₦', name: 'Naira nigérian' },
  { code: 'GHS', symbol: '₵', name: 'Cedi ghanéen' },
  { code: 'MAD', symbol: 'DH', name: 'Dirham marocain' }
];

export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState('FCFA');
  const [loading, setLoading] = useState(true);

  // Charger la devise de l'utilisateur depuis Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadCurrency = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().currency) {
          setCurrencyState(userSnap.data().currency);
        }
      } catch (error) {
        console.error('Error loading currency:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [user]);

  // Mettre à jour la devise et sauvegarder dans Firestore
  const setCurrency = async (newCurrency) => {
    setCurrencyState(newCurrency);
    
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { currency: newCurrency }, { merge: true });
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    }
  };

  // Formater un montant avec la devise actuelle
  const formatAmount = (amount) => {
    const currencyInfo = CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo ? currencyInfo.symbol : 'F';
    
    return `${amount.toLocaleString()} ${symbol}`;
  };

  // Obtenir les informations de la devise actuelle
  const getCurrencyInfo = () => {
    return CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  };

  const value = {
    currency,
    setCurrency,
    currencies: CURRENCIES,
    formatAmount,
    getCurrencyInfo,
    loading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {!loading && children}
    </CurrencyContext.Provider>
  );
}