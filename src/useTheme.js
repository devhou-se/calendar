import { useState, useEffect, useCallback } from 'react';

// Same rules as the blog (www-jp head.html / baseof.html): a saved 'theme' in
// localStorage wins, otherwise follow the OS colour scheme. 't' toggles.
const getPreferredTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) {
    // storage unavailable (private mode etc.) - fall through to OS preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function useTheme(forcedTheme) {
  const [theme, setTheme] = useState(() => forcedTheme || getPreferredTheme());

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => {
    if (forcedTheme) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      let saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
      if (!saved) setTheme(e.matches ? 'dark' : 'light');
    };
    const handleKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 't' || e.key === 'T') toggleTheme();
    };

    media.addEventListener('change', handleChange);
    window.addEventListener('keydown', handleKey);
    return () => {
      media.removeEventListener('change', handleChange);
      window.removeEventListener('keydown', handleKey);
    };
  }, [forcedTheme, toggleTheme]);

  return { theme, toggleTheme };
}
