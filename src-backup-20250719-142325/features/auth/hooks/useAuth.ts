/**
 * Este arquivo reexporta o hook useAuth do AuthProvider para manter a compatibilidade
 * com os componentes que o importam deste caminho.
 */

import { useAuth } from '@/core/contexts/AuthProvider';

export { useAuth };
