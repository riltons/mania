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
 * Normaliza um número de telefone para o formato brasileiro padrão
 * - Remove caracteres não numéricos
 * - Se começar com 55 (código do Brasil), remove esse prefixo
 * - Garante que o número tenha exatamente 11 dígitos (DDD + 9 + 8 dígitos)
 * - Valida se o terceiro dígito é '9' conforme padrão brasileiro atual
 * 
 * @param phoneNumber O número de telefone a ser normalizado
 * @returns O número de telefone normalizado, no formato brasileiro (11 dígitos)
 * @throws Error Se o número não puder ser normalizado para o formato brasileiro válido
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Verifica se o telefone foi fornecido
  if (!phoneNumber) {
    console.warn('ERRO: Telefone não fornecido');
    throw new Error('Telefone não fornecido');
  }
  
  // Remove todos os caracteres não numéricos
  let normalized = phoneNumber.replace(/\D/g, '');
  
  // Log do número original após remover caracteres não numéricos
  console.log(`Normalização: Número original sem caracteres especiais: ${normalized}`);
  
  // Se começar com 55 (código do Brasil), remove o prefixo
  if (normalized.startsWith('55') && normalized.length > 11) {
    normalized = normalized.substring(2);
    console.log(`Normalização: Removido prefixo 55, resultado: ${normalized}`);
  }
  
  // Se ainda tiver mais que 11 dígitos, mantém apenas os últimos 11
  if (normalized.length > 11) {
    const original = normalized;
    normalized = normalized.slice(-11);
    console.log(`Normalização: Número muito longo (${original.length} dígitos), truncado para os últimos 11: ${normalized}`);
  }
  
  // Validação rigorosa do formato brasileiro
  if (normalized.length !== 11) {
    console.warn(`ERRO: Telefone ${normalized} inválido - deve ter exatamente 11 dígitos, mas tem ${normalized.length}`);
    throw new Error(`Telefone inválido: deve ter exatamente 11 dígitos`);
  } 
  
  // Validar se o terceiro dígito é 9 (padrão brasileiro atual para celulares)
  if (normalized.charAt(2) !== '9') {
    console.warn(`ERRO: Telefone ${normalized} inválido - o terceiro dígito deve ser 9 no formato brasileiro atual`);
    throw new Error(`Telefone inválido: o terceiro dígito deve ser 9`);
  }
  
  // Validar se o DDD é válido (entre 11 e 99)
  const ddd = parseInt(normalized.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    console.warn(`ERRO: Telefone ${normalized} inválido - DDD ${ddd} não é válido no Brasil`);
    throw new Error(`Telefone inválido: DDD ${ddd} não é válido no Brasil`);
  }
  
  console.log(`Normalização concluída: ${phoneNumber} -> ${normalized}`);
  return normalized;
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
   * Agora com validação mais rigorosa para o formato brasileiro
   */
  isValidPhoneForSearch(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove todos os caracteres não numéricos
    const normalized = phone.replace(/\D/g, '');
    
    // Verifica se tem exatamente 11 dígitos (formato brasileiro completo)
    if (normalized.length !== 11) {
      console.log(`Telefone inválido para busca: ${normalized} - deve ter exatamente 11 dígitos`);
      return false;
    }
    
    // Verifica se o terceiro dígito é 9 (padrão brasileiro atual para celulares)
    if (normalized.charAt(2) !== '9') {
      console.log(`Telefone inválido para busca: ${normalized} - o terceiro dígito deve ser 9`);
      return false;
    }
    
    // Verifica se o DDD é válido (entre 11 e 99)
    const ddd = parseInt(normalized.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      console.log(`Telefone inválido para busca: ${normalized} - DDD ${ddd} não é válido no Brasil`);
      return false;
    }
    
    return true;
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
      
      // Validação inicial mais rigorosa
      if (!phone || typeof phone !== 'string') {
        log('Número de telefone não fornecido ou inválido', { phone });
        return null;
      }
      
      // Normalização do telefone para garantir formato brasileiro
      let normalizedPhone;
      try {
        normalizedPhone = normalizePhoneNumber(phone);
        log('Telefone normalizado com sucesso', { original: phone, normalized: normalizedPhone });
      } catch (error) {
        log('Erro ao normalizar telefone', { phone, error: (error as Error).message });
        return null;
      }
      
      // Validação adicional após normalização
      if (!this.isValidPhoneForSearch(normalizedPhone)) {
        log('Número de telefone normalizado inválido para busca', { normalizedPhone });
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
