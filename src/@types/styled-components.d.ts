import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      backgroundDark: string;
      backgroundMedium: string;
      card: string;
      text: string;
      textPrimary: string;
      textSecondary: string;
      success: string;
      backgroundLight: string;
      accent: string;
      primary: string;
      white: string;
      tertiary: string;
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
