'use client';

import * as React from 'react';

const MEDIA = '(prefers-color-scheme: dark)';

export type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: 'class' | string;
  defaultTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
  nonce?: string;
};

export type ThemeContextValue = {
  theme?: string;
  setTheme: (theme: string) => void;
  themes: string[];
  forcedTheme?: string;
  resolvedTheme?: string;
  systemTheme?: 'light' | 'dark';
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

function resolveToColor(theme: string | undefined, enableSystem: boolean): 'light' | 'dark' {
  if (theme === 'system' && enableSystem) return getSystemTheme();
  if (theme === 'dark') return 'dark';
  return 'light';
}

/** Alinha com `globals.css`: `.light` = paleta clara; `dark` + `:root` = escuro + variantes Tailwind `dark:` */
function applyThemeClass(root: HTMLElement, resolved: 'light' | 'dark', attribute: string) {
  if (attribute !== 'class') return;
  root.classList.remove('light', 'dark');
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.add('light');
  }
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return { setTheme: () => {}, themes: [] };
  }
  return ctx;
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes: themesProp = ['light', 'dark'],
  forcedTheme,
}: ThemeProviderProps) {
  const themes = React.useMemo(
    () => (enableSystem ? [...themesProp, 'system'] : themesProp),
    [themesProp, enableSystem],
  );

  const [theme, setThemeState] = React.useState<string | undefined>(undefined);
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark' | undefined>(undefined);
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark' | undefined>(undefined);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const allowed = enableSystem ? [...themesProp, 'system'] : [...themesProp];
      if (stored && allowed.includes(stored)) {
        setThemeState(stored);
      } else {
        setThemeState(defaultTheme);
      }
    } catch {
      setThemeState(defaultTheme);
    }
  }, [storageKey, defaultTheme, enableSystem, themesProp]);

  React.useEffect(() => {
    const mq = window.matchMedia(MEDIA);
    const sync = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const activeTheme = forcedTheme ?? theme;

  React.useEffect(() => {
    if (activeTheme === undefined) return;

    const resolved = resolveToColor(activeTheme, enableSystem);
    setResolvedTheme(resolved);

    const root = document.documentElement;
    applyThemeClass(root, resolved, attribute);
    if (enableColorScheme) {
      root.style.colorScheme = resolved;
    }
  }, [activeTheme, enableSystem, attribute, enableColorScheme]);

  React.useEffect(() => {
    if (activeTheme !== 'system' || !enableSystem) return;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      const root = document.documentElement;
      applyThemeClass(root, resolved, attribute);
      if (enableColorScheme) {
        root.style.colorScheme = resolved;
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [activeTheme, enableSystem, attribute, enableColorScheme]);

  const setTheme = React.useCallback(
    (t: string) => {
      setThemeState(t);
      try {
        localStorage.setItem(storageKey, t);
      } catch {
        /* storage indisponível */
      }
    },
    [storageKey],
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      themes,
      forcedTheme,
      resolvedTheme,
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [theme, setTheme, themes, forcedTheme, resolvedTheme, systemTheme, enableSystem],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
