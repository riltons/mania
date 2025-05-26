// Definindo o tipo do tema
interface ThemeType {
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    success: string;
    backgroundLight: string;
    textPrimary: string;
    accent: string;
    error: string;
    white: string;
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
    card: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    success: '#28a745',
    backgroundLight: '#e9ecef',
    textPrimary: '#007bff',
    accent: '#007bff',
    error: '#dc3545',
    white: '#ffffff',
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
