import { supabase } from '@/core/lib/supabase';

// Definição do tipo Player para uso interno
export interface Player {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  nickname?: string;
  created_by: string;
  avatar_url?: string;
  [key: string]: any; // Para permitir propriedades adicionais
}

/**
 * Normaliza um número de telefone para formato consistente
 * - Remove caracteres não numéricos
 * - Remove o código do país (55) se presente
 * - Remove todos os zeros à esquerda
 * - Garante que apenas dígitos sejam armazenados
 * 
 * @param phone O número de telefone a ser normalizado
 * @returns O número de telefone normalizado
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  let normalizedPhone = phone.replace(/\D/g, '');
  
  // Remove o código do país (55) se presente
  if (normalizedPhone.startsWith('55')) {
    normalizedPhone = normalizedPhone.substring(2);
  }
  
  // Remove todos os zeros à esquerda
  normalizedPhone = normalizedPhone.replace(/^0+/, '');
  
  // Garante o formato correto para telefones brasileiros
  // DDD (2 dígitos) + número (8-9 dígitos)
  if (normalizedPhone.length >= 10) {
    console.log(`Telefone normalizado: ${phone} -> ${normalizedPhone}`);
  } else {
    console.log(`Telefone com formato potencialmente inválido: ${phone} -> ${normalizedPhone}`);
  }
  
  return normalizedPhone;
}

/**
 * IMPORTANTE: Serviço para resolver o problema de jogadores duplicados
 * 
 * Este serviço usa funções RPC do Supabase para:
 * 1. Encontrar jogadores existentes mesmo com variações no número de telefone
 * 2. Vincular jogadores existentes a novos usuários sem criar duplicatas
 * 
 * COMO USAR:
 * 
 * // No lugar de criar um novo jogador diretamente:
 * // const { data, error } = await supabase.from('players').insert(...)
 * 
 * // Primeiro, verifique se o jogador já existe:
 * const existingPlayer = await playerRpcService.findPlayerByPhone(phoneNumber);
 * 
 * if (existingPlayer) {
 *   // Se existe, vincule ao usuário atual
 *   await playerRpcService.linkPlayerToUser(existingPlayer.id, userId);
 *   // Retorne o jogador existente
 *   return existingPlayer;
 * } else {
 *   // Somente se não existir, crie um novo
 *   const { data: newPlayer } = await supabase.from('players').insert(...)
 * }
 */

/**
 * Funções de consulta RPC para jogadores
 * Estas funções utilizam as funções PostgreSQL criadas no Supabase
 * que implementam lógicas avançadas de busca e vinculação
 */
export const playerRpcService = {
  /**
   * Valida se um número de telefone é válido para busca
   */
  isValidPhoneForSearch(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    // Considera válido se tiver pelo menos 10 dígitos (DDD + número)
    return phone.replace(/\D/g, '').length >= 10;
  },

  /**
   * Busca um jogador pelo número de telefone usando múltiplas estratégias
   * 1. Busca usando a função RPC do Supabase
   * 2. Busca direta pelo número normalizado
   * 3. Busca por sufixo do número (últimos 9 dígitos)
   * 4. Busca por partes do número
   */
  async findPlayerByPhone(phone: string): Promise<Player | null> {
    const startTime = Date.now();
    const searchId = Math.random().toString(36).substring(2, 8);
    
    const log = (message: string, data?: any) => {
      const timestamp = new Date().toISOString();
      const logData = data ? ` | ${JSON.stringify(data)}` : '';
      console.log(`[${timestamp}] [${searchId}] ${message}${logData}`);
    };
    
    try {
      log('Iniciando busca de jogador por telefone', { phone });
      
      // Validação inicial
      if (!this.isValidPhoneForSearch(phone)) {
        log('Número de telefone inválido para busca', { phone });
        return null;
      }
      
      // Normaliza o telefone
      const normalizedPhone = normalizePhoneNumber(phone);
      log('Telefone normalizado', { original: phone, normalized: normalizedPhone });
      
      if (!normalizedPhone) {
        log('Falha ao normalizar o número de telefone');
        return null;
      }
      
      // Estratégia 1: Busca usando a função RPC do Supabase
      log('Estratégia 1: Buscando com função RPC');
      try {
        const { data: matchedPlayers, error } = await supabase.rpc(
          'find_player_by_phone',
          { search_phone: normalizedPhone }
        );
        
        if (error) {
          log('Erro na busca RPC', { error: error.message, code: error.code });
        } else if (matchedPlayers?.length > 0) {
          log('Jogador encontrado via RPC', { 
            playerId: matchedPlayers[0].id,
            name: matchedPlayers[0].name,
            phone: matchedPlayers[0].phone
          });
          return matchedPlayers[0] as Player;
        } else {
          log('Nenhum resultado encontrado via RPC');
        }
      } catch (rpcError) {
        log('Erro ao executar busca RPC', { error: rpcError });
      }
      
      // Estratégia 2: Busca direta pelo telefone normalizado
      log('Estratégia 2: Busca direta pelo telefone normalizado');
      try {
        const { data: directMatch, error: directError } = await supabase
          .from('players')
          .select('*')
          .eq('phone', normalizedPhone)
          .maybeSingle();
        
        if (directError) {
          log('Erro na busca direta', { error: directError.message });
        } else if (directMatch) {
          log('Jogador encontrado na busca direta', {
            playerId: directMatch.id,
            name: directMatch.name,
            phone: directMatch.phone
          });
          return directMatch as Player;
        } else {
          log('Nenhum resultado na busca direta');
        }
      } catch (directError) {
        log('Erro na busca direta', { error: directError });
      }
      
      // Estratégia 3: Busca por sufixo (últimos 9 dígitos)
      if (normalizedPhone.length >= 9) {
        const suffix = normalizedPhone.substring(normalizedPhone.length - 9);
        log('Estratégia 3: Buscando por sufixo do telefone', { suffix });
        
        try {
          const { data: suffixMatches, error: suffixError } = await supabase
            .from('players')
            .select('*')
            .filter('phone', 'ilike', `%${suffix}`)
            .limit(5); // Limita para evitar sobrecarga
          
          if (suffixError) {
            log('Erro na busca por sufixo', { error: suffixError.message });
          } else if (suffixMatches?.length > 0) {
            log(`Encontrados ${suffixMatches.length} jogadores com sufixo`, { 
              count: suffixMatches.length,
              firstMatch: {
                id: suffixMatches[0].id,
                phone: suffixMatches[0].phone
              }
            });
            return suffixMatches[0] as Player;
          } else {
            log('Nenhum resultado na busca por sufixo');
          }
        } catch (suffixError) {
          log('Erro ao buscar por sufixo', { error: suffixError });
        }
      }
      
      // Estratégia 4: Busca por partes do número (apenas se necessário)
      if (normalizedPhone.length > 9) {
        log('Estratégia 4: Buscando por partes do número');
        
        // Tenta com os últimos 8 dígitos
        const part = normalizedPhone.substring(normalizedPhone.length - 8);
        try {
          const { data: partialMatches, error: partialError } = await supabase
            .from('players')
            .select('*')
            .filter('phone', 'ilike', `%${part}`)
            .limit(1);
            
          if (!partialError && partialMatches?.length > 0) {
            log('Jogador encontrado na busca parcial', {
              playerId: partialMatches[0].id,
              phone: partialMatches[0].phone
            });
            return partialMatches[0] as Player;
          }
        } catch (partialError) {
          log('Erro na busca parcial', { error: partialError });
        }
      }
      
      log('Nenhum jogador encontrado após todas as estratégias de busca', {
        strategiesUsed: 4,
        searchDurationMs: Date.now() - startTime
      });
      
      return null;
      
    } catch (error) {
      log('Erro inesperado ao buscar jogador', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    } finally {
      log('Busca finalizada', { durationMs: Date.now() - startTime });
    }
  },

  /**
   * Vincula um jogador a um usuário usando a função RPC do Supabase
   * Esta função verifica se a relação já existe e só cria se necessário
   * 
   * @param playerId ID do jogador a ser vinculado
   * @param userId ID do usuário ao qual o jogador será vinculado
   * @param isPrimary Se verdadeiro, define o jogador como principal para o usuário
   * @returns Promise<boolean> True se o vínculo foi criado/atualizado com sucesso
   * @throws Error Se ocorrer um erro inesperado
   */
  async linkPlayerToUser(playerId: string, userId: string, isPrimary: boolean = true): Promise<boolean> {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substring(2, 8);
    
    const log = (message: string, data?: any) => {
      const timestamp = new Date().toISOString();
      const logData = data ? ` | ${JSON.stringify(data)}` : '';
      console.log(`[${timestamp}] [Link:${operationId}] ${message}${logData}`);
    };
    
    try {
      log('Iniciando vínculo de jogador a usuário', { 
        playerId, 
        userId, 
        isPrimary 
      });
      
      // Validação dos parâmetros
      if (!playerId || !userId) {
        const errorMsg = 'IDs de jogador e usuário são obrigatórios';
        log('Erro de validação', { error: errorMsg });
        throw new Error(errorMsg);
      }
      
      log('Chamando função RPC link_player_to_user');
      const { data, error } = await supabase.rpc(
        'link_player_to_user',
        { 
          player_id: playerId, 
          user_id: userId, 
          is_primary: isPrimary 
        }
      );
      
      if (error) {
        // Se for um erro de chave duplicada, a relação já existe, então consideramos sucesso
        if (error.code === '23505') {
          log('Relação jogador-usuário já existe', { 
            code: error.code, 
            details: error.details 
          });
          return true;
        }
        
        // Para outros erros, registramos e propagamos
        log('Erro ao vincular jogador ao usuário (RPC)', { 
          code: error.code, 
          message: error.message,
          details: error.details
        });
        
        throw error;
      }
      
      log('Jogador vinculado com sucesso ao usuário', { 
        result: data,
        durationMs: Date.now() - startTime
      });
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      log('Falha ao vincular jogador ao usuário', {
        error: errorMessage,
        stack: errorStack,
        durationMs: Date.now() - startTime
      });
      
      // Relança o erro para tratamento posterior se necessário
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Falha ao vincular jogador ao usuário: ${errorMessage}`);
    }
  }
};
