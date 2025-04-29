import { colors as darkColors } from './colors';

// Cores para o tema claro
export const lightColors = {
    // Cores principais
    primary: '#8257E5', // Mantemos a cor primária para manter a identidade visual
    secondary: '#F5F5FA',
    tertiary: '#E1E1E6',
    accent: '#00875F',
    
    // Variações de verde (accent)
    accentLight: '#00B37E',
    accentLighter: '#04D361',
    accentDark: '#015F43',
    accentDarker: '#00291D',
    
    // Variações de cinza
    gray100: '#121214',
    gray200: '#29292E',
    gray300: '#505059',
    gray400: '#7C7C8A',
    gray500: '#8D8D99',
    gray600: '#C4C4CC',
    gray700: '#E1E1E6',
    gray800: '#F0F0F5',
    gray900: '#FFFFFF',
    
    // Cores de status
    success: '#22C55E',
    warning: '#FBA94C',
    error: '#FF3333',
    info: '#3294F8',
    
    // Cores de texto
    textPrimary: '#121214',
    textSecondary: '#29292E',
    textTertiary: '#505059',
    textDisabled: '#8D8D99',
    
    // Cores de fundo
    backgroundLight: '#FFFFFF',
    backgroundMedium: '#F5F5FA',
    backgroundDark: '#E1E1E6',
    
    // Cores de borda
    border: '#C4C4CC',
    borderLight: '#E1E1E6',
    borderDark: '#8D8D99',
    
    // Cores de overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',
    
    // Cores de destaque
    highlight: '#00875F',
    highlightLight: '#00B37E',
    highlightDark: '#015F43',
} as const;

// Exporta os temas
export const themes = {
    dark: darkColors,
    light: lightColors
};

// Tipo para os temas
export type ThemeType = 'dark' | 'light';

// Tipo para as cores
export type ColorType = typeof darkColors;
