import 'styled-components';
import { AppTheme } from './theme';

/**
 * Definição de tipos para styled-components
 * Esta declaração de módulo permite que o TypeScript entenda o que é o tema
 * nas template strings do styled-components
 */
declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {
    // A interface AppTheme já contém todas as propriedades necessárias
  }
}
