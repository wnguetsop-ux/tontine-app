import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => {
    // Charger depuis localStorage au démarrage
    return localStorage.getItem('theme') || 'light';
  });
  const [mounted, setMounted] = useState(false);

  // Appliquer le thème au montage
  useEffect(() => {
    setMounted(true);
    applyTheme(theme);
  }, []);

  // Charger le thème de l'utilisateur depuis Firestore
  useEffect(() => {
    if (user) {
      loadUserTheme();
    }
  }, [user]);

  // Appliquer le thème à chaque changement
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  const loadUserTheme = async () => {
    try {
      const docRef = doc(db, 'userPreferences', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().theme) {
        const savedTheme = docSnap.data().theme;
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Sauvegarder dans Firestore si user connecté
    if (user) {
      try {
        await setDoc(doc(db, 'userPreferences', user.uid), {
          theme: newTheme,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  const setThemeMode = async (newTheme) => {
    setTheme(newTheme);
    
    // Sauvegarder dans Firestore si user connecté
    if (user) {
      try {
        await setDoc(doc(db, 'userPreferences', user.uid), {
          theme: newTheme,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isDark: theme === 'dark'
  };

  // Ne pas rendre avant le montage pour éviter le flash
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}