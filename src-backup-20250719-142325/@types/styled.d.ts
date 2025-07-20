import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      card: string;
      text: string;
      textSecondary: string;
      success: string;
      backgroundLight: string;
      textPrimary: string;
      accent: string;
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
}
