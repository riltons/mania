// Importando apenas o que precisamos de cada arquivo
import { formatDate as formatDateFromDate } from './date';
import { formatDate as formatDateFromFormatter } from './dateFormatter';

// Re-exportando com nomes diferentes para evitar conflitos
export { formatDateFromDate, formatDateFromFormatter };

// Exportando o restante normalmente
export * from './environment';
export * from './errorBoundary';
