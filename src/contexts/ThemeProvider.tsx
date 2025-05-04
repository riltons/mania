import React, { createContext, useContext, useState, useEffect } from 'react';
import { colors } from '../styles/colors';
import { DefaultTheme, ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeType, ColorType } from '../styles/themes';
import { useColorScheme } from 'react-native';

interface ThemeContextData {
  colors: ColorType;
  theme: ThemeType;
  toggleTheme: () => void;
  isDarkTheme: boolean;
}

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: ColorType;
    theme: ThemeType;
  }
}

const THEME_STORAGE_KEY = '@DommatchApp:theme';

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('dark');

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setTheme(savedTheme as ThemeType);
        } else {
          // Se não houver tema salvo, use o tema do dispositivo ou o tema escuro como padrão
          setTheme(deviceTheme === 'light' ? 'light' : 'dark');
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
        // Em caso de erro, use o tema escuro como fallback
        setTheme('dark');
      }
    }

    loadSavedTheme();
  }, [deviceTheme]);

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const currentColors = theme === 'dark' ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: currentColors,
        toggleTheme,
        isDarkTheme: theme === 'dark'
      }}
    >
      <StyledThemeProvider
        theme={{
          colors: currentColors,
          theme
        }}
      >
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}