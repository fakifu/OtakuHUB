import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const getSystemTheme = () => {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    };

    const [themePref, setThemePref] = useState(() => {
        const savedTheme = localStorage.getItem('app_theme');
        return savedTheme || 'dark';
    });

    const [theme, setTheme] = useState(() => {
        if (themePref === 'system' || themePref === 'auto') return getSystemTheme();
        return themePref;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (themePref === 'system' || themePref === 'auto') setTheme(getSystemTheme());
        };
        if (themePref === 'system' || themePref === 'auto') {
            setTheme(getSystemTheme());
        } else {
            setTheme(themePref);
        }
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themePref]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('app_theme', themePref);
    }, [theme, themePref]);

    const toggleTheme = () => {
        setThemePref((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            themePref,
            setTheme: setThemePref,
            toggleTheme,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
