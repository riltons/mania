// Definindo o tipo do tema
export interface ThemeType {
  colors: {
    background: string;
    backgroundDark: string;
    backgroundMedium: string;
    backgroundLight: string;
    card: string;
    text: string;
    textSecondary: string;
    success: string;
    textPrimary: string;
    primary: string;
    accent: string;
    error: string;
    white: string;
    gray100: string;
    gray300: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
}

const theme: ThemeType = {
  colors: {
    background: '#ffffff',
    backgroundDark: '#1a1a2e',
    backgroundMedium: '#16213e',
    backgroundLight: '#e9ecef',
    card: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    success: '#28a745',
    textPrimary: '#007bff',
    primary: '#4cc9f0',
    accent: '#007bff',
    error: '#dc3545',
    white: '#ffffff',
    gray100: '#f8f9fa',
    gray300: '#dee2e6',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
};

export default theme;
