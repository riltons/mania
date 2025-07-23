import { supabase } from '@/core/lib/supabase';
import { Player } from '../types/Player';
import { v4 as uuidv4 } from 'uuid';

export interface PlayerWithRelation extends Player {
  user_player_relations?: {
    user_id: string;
    is_primary: boolean;
  }[];
  isCreatedByOtherUser?: boolean;
  sharedPlayer?: boolean;
}

export const playersService = {
  /**
   * Lista todos os jogadores do usuário atual
   */
  async list(): Promise<PlayerWithRelation[]> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para ver seus jogadores');
      }
      
      // Buscar jogadores criados pelo usuário
      const { data: myCreatedPlayers, error: myCreatedPlayersError } = await supabase
        .from('players')
        .select('*, user_player_relations(user_id, is_primary)')
        .eq('created_by', user.id);
      
      if (myCreatedPlayersError) {
        console.error('Erro ao buscar jogadores criados pelo usuário:', myCreatedPlayersError);
        throw new Error('Não foi possível carregar seus jogadores');
      }
      
      // Buscar jogadores compartilhados com o usuário (criados por outros usuários)
      const { data: sharedPlayers, error: sharedPlayersError } = await supabase
        .rpc('get_shared_players', { user_id: user.id });
      
      if (sharedPlayersError) {
        console.error('Erro ao buscar jogadores compartilhados:', sharedPlayersError);
        throw new Error('Não foi possível carregar jogadores compartilhados');
      }
      
      // Processar jogadores criados pelo usuário
      const processedMyPlayers = myCreatedPlayers?.map(player => ({
        ...player,
        isCreatedByOtherUser: false,
        sharedPlayer: false
      })) || [];
      
      // Processar jogadores compartilhados
      const processedSharedPlayers = sharedPlayers?.map(player => ({
        ...player,
        isCreatedByOtherUser: true,
        sharedPlayer: true
      })) || [];
      
      // Combinar os dois conjuntos de jogadores
      return [...processedMyPlayers, ...processedSharedPlayers];
    } catch (error) {
      console.error('Erro ao listar jogadores:', error);
      throw new Error('Ocorreu um erro ao listar os jogadores');
    }
  },
  
  /**
   * Busca um jogador pelo ID
   */
  async getById(id: string): Promise<PlayerWithRelation | null> {
    try {
      const { data: player, error } = await supabase
        .from('players')
        .select('*, user_player_relations(user_id, is_primary)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar jogador:', error);
        throw new Error('Não foi possível encontrar o jogador');
      }
      
      return player;
    } catch (error) {
      console.error('Erro ao buscar jogador por ID:', error);
      throw new Error('Ocorreu um erro ao buscar o jogador');
    }
  },
  
  /**
   * Cria um novo jogador
   */
  async create(player: Omit<Player, 'id' | 'created_at' | 'created_by'>): Promise<Player> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para criar um jogador');
      }
      
      // Verificar se já existe um jogador com o mesmo nome e telefone
      const { data: existingPlayers, error: searchError } = await supabase
        .from('players')
        .select('id')
        .eq('name', player.name)
        .eq('phone', player.phone);
      
      if (searchError) {
        console.error('Erro ao verificar jogadores existentes:', searchError);
        throw new Error('Não foi possível verificar jogadores existentes');
      }
      
      // Se encontrar um jogador existente, vincular ao usuário atual em vez de criar um novo
      if (existingPlayers && existingPlayers.length > 0) {
        const existingPlayerId = existingPlayers[0].id;
        
        // Verificar se o jogador já está vinculado ao usuário
        const { data: existingRelation, error: relationCheckError } = await supabase
          .from('user_player_relations')
          .select('*')
          .eq('user_id', user.id)
          .eq('player_id', existingPlayerId);
        
        if (relationCheckError) {
          console.error('Erro ao verificar relação existente:', relationCheckError);
          throw new Error('Não foi possível verificar relações existentes');
        }
        
        // Se não estiver vinculado, criar a relação
        if (!existingRelation || existingRelation.length === 0) {
          const { error: relationError } = await supabase
            .from('user_player_relations')
            .insert({
              user_id: user.id,
              player_id: existingPlayerId,
              is_primary: false
            });
          
          if (relationError) {
            console.error('Erro ao vincular jogador existente:', relationError);
            throw new Error('Não foi possível vincular ao jogador existente');
          }
        }
        
        // Buscar o jogador completo
        const { data: existingPlayer, error: getPlayerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', existingPlayerId)
          .single();
        
        if (getPlayerError) {
          console.error('Erro ao buscar jogador existente:', getPlayerError);
          throw new Error('Não foi possível buscar o jogador existente');
        }
        
        return existingPlayer;
      }
      
      // Criar um novo jogador
      const newPlayer = {
        ...player,
        id: uuidv4(),
        created_by: user.id
      };
      
      const { data, error } = await supabase
        .from('players')
        .insert(newPlayer)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar jogador:', error);
        throw new Error('Não foi possível criar o jogador');
      }
      
      // Criar relação entre usuário e jogador
      const { error: relationError } = await supabase
        .from('user_player_relations')
        .insert({
          user_id: user.id,
          player_id: data.id,
          is_primary: false
        });
      
      if (relationError) {
        console.error('Erro ao criar relação usuário-jogador:', relationError);
        throw new Error('Não foi possível vincular o jogador ao usuário');
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao criar jogador:', error);
      throw new Error('Ocorreu um erro ao criar o jogador');
    }
  },
  
  /**
   * Atualiza um jogador existente
   */
  async update(id: string, player: Partial<Player>): Promise<Player> {
    try {
      const { data, error } = await supabase
        .from('players')
        .update(player)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar jogador:', error);
        throw new Error('Não foi possível atualizar o jogador');
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar jogador:', error);
      throw new Error('Ocorreu um erro ao atualizar o jogador');
    }
  },
  
  /**
   * Exclui um jogador
   */
  async delete(id: string): Promise<void> {
    try {
      // Primeiro, excluir todas as relações do jogador
      const { error: relationsError } = await supabase
        .from('user_player_relations')
        .delete()
        .eq('player_id', id);
      
      if (relationsError) {
        console.error('Erro ao excluir relações do jogador:', relationsError);
        throw new Error('Não foi possível excluir as relações do jogador');
      }
      
      // Depois, excluir o jogador
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir jogador:', error);
        throw new Error('Não foi possível excluir o jogador');
      }
    } catch (error) {
      console.error('Erro ao excluir jogador:', error);
      throw new Error('Ocorreu um erro ao excluir o jogador');
    }
  },
  
  /**
   * Define um jogador como primário para o usuário atual
   */
  async setPrimaryPlayer(playerId: string): Promise<void> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para definir um jogador primário');
      }
      
      // Primeiro, remover o status de primário de todos os jogadores do usuário
      const { error: updateError } = await supabase
        .from('user_player_relations')
        .update({ is_primary: false })
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Erro ao atualizar relações:', updateError);
        throw new Error('Não foi possível atualizar as relações de jogadores');
      }
      
      // Depois, definir o jogador selecionado como primário
      const { error } = await supabase
        .from('user_player_relations')
        .update({ is_primary: true })
        .eq('user_id', user.id)
        .eq('player_id', playerId);
      
      if (error) {
        console.error('Erro ao definir jogador primário:', error);
        throw new Error('Não foi possível definir o jogador como primário');
      }
    } catch (error) {
      console.error('Erro ao definir jogador primário:', error);
      throw new Error('Ocorreu um erro ao definir o jogador primário');
    }
  },
  
  /**
   * Obtém o jogador primário do usuário atual
   */
  async getPrimaryPlayer(): Promise<Player | null> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para obter seu jogador primário');
      }
      
      // Buscar o jogador primário
      const { data, error } = await supabase
        .from('user_player_relations')
        .select('players(*)')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum jogador primário encontrado
          return null;
        }
        console.error('Erro ao buscar jogador primário:', error);
        throw new Error('Não foi possível buscar o jogador primário');
      }
      
      return data?.players;
    } catch (error) {
      console.error('Erro ao obter jogador primário:', error);
      throw new Error('Ocorreu um erro ao obter o jogador primário');
    }
  }
};
