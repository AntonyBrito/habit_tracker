import React, { createContext, useState, useMemo } from 'react';
import { Appearance } from 'react-native';

export const lightTheme = {
  background: ['#F3F4F6', '#E5E7EB'],
  card: ['#FFFFFF', '#F9FAFB'],
  text: '#1F2937',
  subtext: '#6B7280',
  primary: '#8E2DE2',
  accent: '#10B981',
  locked: '#D1D5DB',
};

export const darkTheme = {
  background: ['#1F2937', '#111827'],
  card: ['#374151', '#1F2937'],
  text: '#F9FAFB',
  subtext: '#9CA3AF',
  primary: '#A78BFA',
  accent: '#34D399',
  locked: '#4B5563',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(Appearance.getColorScheme() || 'light');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const themeData = useMemo(() => (theme === 'light' ? lightTheme : darkTheme), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: themeData }}>
      {children}
    </ThemeContext.Provider>
  );
};