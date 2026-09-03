'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

export interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
}

export interface ThemeContextType {
  theme: Theme | string;
  setTheme: (theme: Theme | string) => void;
  resolvedTheme: 'light' | 'dark';
  themes: string[];
  systemTheme?: 'light' | 'dark';
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (key: string, fallback: Theme): Theme | string => {
  if (typeof window === 'undefined') return fallback;
  try {
    return (localStorage.getItem(key) as Theme) || fallback;
  } catch {
    return fallback;
  }
};

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange: _disableTransitionOnChange = false,
  storageKey = 'theme',
  themes = ['light', 'dark'],
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme | string>(() =>
    getStoredTheme(storageKey, defaultTheme)
  );
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(getSystemTheme);

  const resolvedTheme: 'light' | 'dark' = React.useMemo(() => {
    if (theme === 'system') return systemTheme;
    return theme === 'light' ? 'light' : 'dark';
  }, [theme, systemTheme]);

  // Synchronize DOM with resolvedTheme without triggering cascading render warnings
  React.useEffect(() => {
    const root = document.documentElement;
    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    } else {
      root.setAttribute(attribute, resolvedTheme);
    }
  }, [attribute, resolvedTheme]);

  // Listen to system theme changes
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemTheme(media.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  // Listen to storage changes across tabs
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  const setTheme = React.useCallback(
    (newTheme: Theme | string) => {
      const performUpdate = () => {
        setThemeState(newTheme);
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch {}
      };

      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(
          performUpdate
        );
      } else {
        performUpdate();
      }
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: enableSystem ? [...themes, 'system'] : themes,
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, themes, enableSystem, systemTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'system',
      setTheme: () => {},
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'dark',
    };
  }
  return context;
}
