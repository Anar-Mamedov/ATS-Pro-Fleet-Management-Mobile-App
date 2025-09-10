import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '@tamagui/core';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ThemeName = 'light' | 'dark';

type ThemeContextValue = {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  toggleTheme: () => void;
  isHydrated: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setThemeNameState(saved);
        }
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemeName = themeName === 'light' ? 'dark' : 'light';
    setThemeName(next);
  }, [themeName, setThemeName]);

  const value = useMemo(() => ({ themeName, setThemeName, toggleTheme, isHydrated }), [themeName, setThemeName, toggleTheme, isHydrated]);

  return (
    <ThemeContext.Provider value={value}>
      <Theme name={themeName}>{children}</Theme>
    </ThemeContext.Provider>
  );
}

export function useThemeController() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeController must be used within ThemeProvider');
  return ctx;
}
