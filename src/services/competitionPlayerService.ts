import { supabase } from '@/core/lib/supabase';
import { playerService } from './playerService';

/**
 * Serviço para gerenciar a relação entre competições e jogadores
 */
export const competitionPlayerService = {
  /**
   * Verifica se o usuário atual tem um perfil de jogador e cria um se necessário
   * Retorna o ID do jogador
   */
  async ensurePlayerProfileExists() {
    try {
      // Busca usuário autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.error('[competitionPlayerService] Erro de autenticação:', userError);
        throw new Error('Usuário não autenticado');
      }

      // Usa o método existente do playerService para garantir que o jogador existe
      const player = await playerService.getOrCreatePlayerForCurrentUser();
      console.log('[competitionPlayerService] Perfil de jogador garantido:', player.id);
      return player.id;
    } catch (error) {
      console.error('[competitionPlayerService] Erro ao garantir perfil de jogador:', error);
      throw error;
    }
  },

  /**
   * Adiciona o usuário atual como membro da competição
   */
  async addCurrentUserToCompetition(competitionId: string) {
    try {
      // Garante que o perfil de jogador existe
      const playerId = await this.ensurePlayerProfileExists();

      // Verifica se o jogador já é membro da competição
      const { data: existingMember, error: checkError } = await supabase
        .from('competition_members')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (checkError) {
        console.error('[competitionPlayerService] Erro ao verificar membro existente:', checkError);
        throw checkError;
      }

      // Se o jogador já é membro, retorna o registro existente
      if (existingMember) {
        console.log('[competitionPlayerService] Jogador já é membro da competição:', existingMember);
        return existingMember;
      }

      // Adiciona o jogador como membro da competição
      const { data, error } = await supabase
        .from('competition_members')
        .insert([{
          competition_id: competitionId,
          player_id: playerId
        }])
        .select();

      if (error) {
        console.error('[competitionPlayerService] Erro ao adicionar usuário à competição:', error);
        throw error;
      }

      console.log('[competitionPlayerService] Usuário adicionado à competição:', data);
      return data;
    } catch (error) {
      console.error('[competitionPlayerService] Erro ao adicionar usuário à competição:', error);
      throw error;
    }
  }
};