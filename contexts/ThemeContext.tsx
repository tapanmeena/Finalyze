import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    shadow: string;
    modalOverlay: string;
    card: string;
  };
  dark: boolean;
}

// Light Theme
export const lightTheme: Theme = {
  name: 'Light',
  dark: false,
  colors: {
    primary: '#007AFF',
    secondary: '#34C759',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    accent: '#FF9500',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    border: '#E0E0E0',
    shadow: '#000000',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    card: '#ffffff',
  },
};

// Dark Theme
export const darkTheme: Theme = {
  name: 'Dark',
  dark: true,
  colors: {
    primary: '#0A84FF',
    secondary: '#32D74B',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#ADADB0',
    accent: '#FF9F0A',
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    border: '#48484A',
    shadow: '#000000',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    card: '#2C2C2E',
  },
};

// Ocean Theme
export const oceanTheme: Theme = {
  name: 'Ocean',
  dark: false,
  colors: {
    primary: '#006B96',
    secondary: '#3E92CC',
    background: '#F0F8FF',
    surface: '#ffffff',
    text: '#1B4965',
    textSecondary: '#5F8A8B',
    accent: '#FF7F7F',
    success: '#2E8B57',
    warning: '#DAA520',
    error: '#DC143C',
    border: '#B0E0E6',
    shadow: '#4682B4',
    modalOverlay: 'rgba(30, 144, 255, 0.3)',
    card: '#ffffff',
  },
};

// Sunset Theme
export const sunsetTheme: Theme = {
  name: 'Sunset',
  dark: false,
  colors: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    background: '#FFF8E1',
    surface: '#ffffff',
    text: '#5D4037',
    textSecondary: '#8D6E63',
    accent: '#FF5722',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    border: '#FFCC02',
    shadow: '#FF8A65',
    modalOverlay: 'rgba(255, 107, 53, 0.3)',
    card: '#ffffff',
  },
};

// Forest Theme
export const forestTheme: Theme = {
  name: 'Forest',
  dark: false,
  colors: {
    primary: '#2E7D32',
    secondary: '#4CAF50',
    background: '#F1F8E9',
    surface: '#ffffff',
    text: '#1B5E20',
    textSecondary: '#558B2F',
    accent: '#795548',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    border: '#A5D6A7',
    shadow: '#66BB6A',
    modalOverlay: 'rgba(46, 125, 50, 0.3)',
    card: '#ffffff',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
};

export type ThemeKey = keyof typeof themes;

interface ThemeContextType {
  theme: Theme;
  currentTheme: ThemeKey;
  setTheme: (themeName: ThemeKey) => void;
  toggleDarkMode: () => void;
  availableThemes: ThemeKey[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('light');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('selectedTheme');
      if (savedTheme && savedTheme in themes) {
        setCurrentTheme(savedTheme as ThemeKey);
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
  };

  const saveTheme = async (themeName: ThemeKey) => {
    try {
      await AsyncStorage.setItem('selectedTheme', themeName);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = (themeName: ThemeKey) => {
    setCurrentTheme(themeName);
    saveTheme(themeName);
  };

  const toggleDarkMode = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const availableThemes: ThemeKey[] = Object.keys(themes) as ThemeKey[];

  const value: ThemeContextType = {
    theme: themes[currentTheme],
    currentTheme,
    setTheme,
    toggleDarkMode,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};