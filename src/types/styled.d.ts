import 'styled-components';
import { ColorType } from '@/styles/themes';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: ColorType;
    theme: 'light' | 'dark';
  }
}
