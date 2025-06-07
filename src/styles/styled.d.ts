import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      white: string;
      textPrimary: string;
      textSecondary: string;
      textDisabled: string;
      backgroundLight: string;
      backgroundDark: string;
      backgroundMedium: string;
      card: string;
      text: string;
      success: string;
      error: string;
      warning: string;
      info: string;
      border: string;
      gray: string;
      gray900: string;
      [key: string]: string;
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

export interface ThemeProps {
  theme: DefaultTheme;
}

export interface ButtonProps extends ThemeProps {
  disabled?: boolean;
}

export type ThemedStyledProps<P = unknown> = P & ThemeProps;
