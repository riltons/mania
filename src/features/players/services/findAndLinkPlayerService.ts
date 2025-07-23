import { supabase } from '@/core/lib/supabase';
import { normalizePhoneNumber } from './playerRpcService';

/**
 * Interface do jogador retornado pela função find_and_link_player
 */
export interface LinkedPlayer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  nickname?: string;
  created_by: string;
  avatar_url?: string;
  is_shared: boolean;
  is_primary: boolean;
  error_message?: string;
}

/**
 * Busca um jogador pelo número de telefone e o vincula ao usuário atual
 * 
 * @param phone O número de telefone a buscar
 * @param userId ID do usuário atual
 * @returns O jogador encontrado e vinculado ou null se não encontrado
 */
export async function findAndLinkPlayerByPhone(
  phone: string, 
  userId: string, 
  traceId?: string
): Promise<LinkedPlayer | null> {
  const log = (message: string, data?: any) => {
    const prefix = traceId ? `[${traceId}]` : '';
    console.log(`${prefix} ${message}`, data);
  };
  
  try {
    log('Iniciando busca e vinculação de jogador por telefone', { phone, userId });
    
    if (!phone || !userId) {
      log('Telefone ou ID do usuário não fornecido');
      return null;
    }
    
    // Normaliza o telefone
    const normalizedPhone = normalizePhoneNumber(phone);
    log('Telefone normalizado', { original: phone, normalized: normalizedPhone });
    
    if (!normalizedPhone) {
      log('Falha ao normalizar o número de telefone');
      return null;
    }
    
    // Usar a função find_and_link_player para encontrar e vincular o jogador
    const { data: result, error } = await supabase.rpc(
      'find_and_link_player',
      { 
        p_phone: normalizedPhone,
        p_user_id: userId
      }
    );
    
    if (error) {
      log('Erro ao buscar e vincular jogador', { error: error.message, code: error.code });
      return null;
    }
    
    if (result && result.length > 0 && result[0].id) {
      log('Jogador encontrado e vinculado com sucesso', {
        playerId: result[0].id,
        name: result[0].name,
        phone: result[0].phone,
        isShared: result[0].is_shared
      });
      return result[0] as LinkedPlayer;
    }
    
    log('Nenhum jogador encontrado para vincular');
    return null;
  } catch (error) {
    log('Erro ao buscar e vincular jogador', { error });
    return null;
  }
}

export const findAndLinkPlayerService = {
  findAndLinkPlayerByPhone
};
