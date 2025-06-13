/**
 * Tipos relacionados ao tema da aplicação
 */

// Interface para o tema da aplicação
export interface AppTheme {
  mode: 'light' | 'dark';
  colors: {
    // Cores primárias
    primary: string;
    secondary: string;
    accent: string;
    
    // Cores de fundo
    background: string;
    backgroundMedium: string;
    backgroundDark: string;
    
    // Cores de texto
    text: string;
    textPrimary: string;
    textSecondary: string;
    
    // Cores semânticas
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Cores de estado
    disabled: string;
    placeholder: string;
    border: string;
  };
  
  // Configurações de espaçamento
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // Configurações de fonte
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
  
  // Configurações de borda
  border: {
    radius: {
      sm: number;
      md: number;
      lg: number;
      full: number;
    };
    width: {
      thin: number;
      normal: number;
      thick: number;
    };
  };
}

// Interface para propriedades de componentes estilizados que usam tema
export interface ThemeProps {
  theme: AppTheme;
}
