import { supabase } from '@/core/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { CreatePlayerDTO } from '../types/Player';

// Exportando a interface Player para ser usada em outros componentes
export interface Player {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  nickname?: string;
  created_by: string;
  avatar_url?: string;
  isCreatedByOtherUser?: boolean;
  sharedPlayer?: boolean;
  isPrimary?: boolean;
  [key: string]: any; // Para permitir propriedades adicionais
}

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
   * Lista todos os jogadores do usuário atual, incluindo os compartilhados
   * @param options Opções de paginação, ordenação e filtro
   */
  async list(options: {
    page?: number;
    pageSize?: number;
    sortBy?: keyof Player;
    sortOrder?: 'asc' | 'desc';
    searchTerm?: string;
    includeShared?: boolean;
    includeOwn?: boolean;
  } = {}): Promise<{ data: Player[]; total: number; page: number; pageSize: number }> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para listar seus jogadores');
      }
      
      console.log('Usuário autenticado:', user.id);
      
      // Configurações padrão
      const {
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        searchTerm = '',
        includeShared = true,
        includeOwn = true
      } = options;
      
      const startIndex = (page - 1) * pageSize;
      let allPlayers: Player[] = [];
      let totalCount = 0;
      
      // 1. Buscar jogadores criados pelo usuário
      if (includeOwn) {
        try {
          const { data: ownPlayers, error: ownError, count: ownCount } = await supabase
            .from('players')
            .select('*, user_player_relations(user_id, is_primary)', { count: 'exact' })
            .eq('created_by', user.id);
            
          if (searchTerm) {
            // Aplicar filtro de busca
            const filteredPlayers = ownPlayers?.filter(player => 
              player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              player.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              player.phone?.includes(searchTerm)
            ) || [];
            
            allPlayers = [
              ...allPlayers,
              ...filteredPlayers.map(player => ({
                ...player,
                isCreatedByOtherUser: false,
                sharedPlayer: false,
                isPrimary: player.user_player_relations?.[0]?.is_primary || false
              }))
            ];
            
            totalCount += filteredPlayers.length;
          } else {
            // Sem filtro de busca
            allPlayers = [
              ...allPlayers,
              ...(ownPlayers || []).map(player => ({
                ...player,
                isCreatedByOtherUser: false,
                sharedPlayer: false,
                isPrimary: player.user_player_relations?.[0]?.is_primary || false
              }))
            ];
            
            totalCount += ownCount || (ownPlayers?.length || 0);
          }
          
          if (ownError) {
            console.error('Erro ao buscar jogadores próprios:', ownError);
          } else {
            console.log(`Encontrados ${ownPlayers?.length || 0} jogadores próprios`);
          }
        } catch (ownError) {
          console.error('Erro ao processar jogadores próprios:', ownError);
        }
      }
      
      // 2. Buscar jogadores compartilhados com o usuário
      if (includeShared) {
        try {
          const { data: sharedPlayers, error: sharedError } = await supabase
            .rpc('fetch_shared_players', { 
              p_user_id: user.id,
              p_search_term: searchTerm || null
            });
            
          if (sharedError) {
            console.error('Erro ao carregar jogadores compartilhados:', sharedError);
          } else {
            allPlayers = [
              ...allPlayers,
              ...(sharedPlayers || []).map((player: any) => ({
                ...player,
                isCreatedByOtherUser: true,
                sharedPlayer: true,
                isPrimary: false // Jogadores compartilhados nunca são primários
              }))
            ];
            
            totalCount += sharedPlayers?.length || 0;
            console.log(`Encontrados ${sharedPlayers?.length || 0} jogadores compartilhados`);
          }
        } catch (sharedError) {
          console.error('Erro ao processar jogadores compartilhados:', sharedError);
        }
      }
      
      console.log(`Total de jogadores encontrados: ${allPlayers.length}`);
      
      // Aplicar ordenação
      allPlayers.sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      // Aplicar paginação
      const paginatedPlayers = allPlayers.slice(startIndex, startIndex + pageSize);
      
      return {
        data: paginatedPlayers,
        total: totalCount,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Erro ao listar jogadores:', error);
      throw error instanceof Error ? error : new Error('Ocorreu um erro ao listar os jogadores');
    }
  },
  
  /**
   * Busca um jogador pelo ID com verificações de permissão
   * @param id ID do jogador a ser buscado
   * @returns O jogador com informações adicionais de relacionamento
   * @throws {Error} Se o usuário não estiver autenticado ou não tiver permissão
   */
  async getById(id: string): Promise<PlayerWithRelation | null> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para ver os detalhes do jogador');
      }
      
      // Usar uma função RPC para buscar o jogador com verificações de permissão
      const { data: playerData, error: fetchError } = await supabase
        .rpc('get_player_by_id', {
          p_player_id: id,
          p_user_id: user.id
        });
      
      if (fetchError || !playerData || playerData.length === 0) {
        console.error('Erro ao buscar jogador:', fetchError);
        throw new Error('Jogador não encontrado ou você não tem permissão para acessá-lo');
      }
      
      // Extrair os dados do jogador
      const player = playerData[0];
      
      // Determinar o relacionamento do usuário com o jogador
      const isCreatedByCurrentUser = player.created_by === user.id;
      const isSharedWithCurrentUser = player.is_shared_with_user;
      const isPrimaryForUser = player.is_primary;
      
      // Verificar se o usuário tem permissão para acessar este jogador
      if (!isCreatedByCurrentUser && !isSharedWithCurrentUser) {
        console.error('Acesso negado: usuário não tem permissão para acessar este jogador');
        throw new Error('Você não tem permissão para acessar este jogador');
      }
      
      // Montar o objeto de retorno com as informações adicionais
      return {
        ...player,
        isCreatedByOtherUser: !isCreatedByCurrentUser,
        sharedPlayer: isSharedWithCurrentUser,
        isPrimary: isPrimaryForUser || false,
        // Garantir que as relações estejam no formato esperado
        user_player_relations: [
          {
            user_id: user.id,
            is_primary: isPrimaryForUser || false,
            player_id: id
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao buscar jogador por ID:', error);
      throw new Error('Ocorreu um erro ao buscar o jogador');
    }
  },
  
  /**
   * Cria um novo jogador ou vincula um jogador existente ao usuário atual
   * @param player Dados do jogador a ser criado
   * @returns O jogador criado ou vinculado
   * @throws {Error} Se o usuário não estiver autenticado ou ocorrer um erro na criação
   */
  async create(player: CreatePlayerDTO): Promise<Player> {
    try {
      // Validar dados de entrada
      if (!player.name || !player.phone) {
        throw new Error('Nome e telefone são obrigatórios');
      }
      
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para criar um jogador');
      }
      
      // Usar uma função RPC para criar ou vincular o jogador em uma transação
      const { data: result, error: createError } = await supabase.rpc('create_or_link_player', {
        p_name: player.name,
        p_nickname: player.nickname || null,
        p_phone: player.phone,
        p_avatar_url: player.avatar_url || null,
        p_user_id: user.id
      });
      
      if (createError) {
        console.error('Erro ao criar/vincular jogador:', createError);
        throw new Error(createError.message || 'Não foi possível criar ou vincular o jogador');
      }
      
      if (!result || result.length === 0) {
        throw new Error('Ocorreu um erro inesperado ao processar o jogador');
      }
      
      const createdPlayer = result[0];
      
      // Verificar se o jogador foi criado ou vinculado com sucesso
      if (createdPlayer.error_message) {
        throw new Error(createdPlayer.error_message);
      }
      
      // Retornar o jogador no formato esperado
      return {
        id: createdPlayer.id,
        name: createdPlayer.name,
        nickname: createdPlayer.nickname || null,
        phone: createdPlayer.phone,
        avatar_url: createdPlayer.avatar_url || null,
        created_at: createdPlayer.created_at,
        created_by: createdPlayer.created_by,
        isCreatedByOtherUser: createdPlayer.created_by !== user.id,
        sharedPlayer: createdPlayer.is_shared,
        isPrimary: createdPlayer.is_primary || false,
        user_player_relations: [
          {
            user_id: user.id,
            player_id: createdPlayer.id,
            is_primary: createdPlayer.is_primary || false
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao criar jogador:', error);
      throw new Error('Ocorreu um erro ao criar o jogador');
    }
  },
  
  /**
   * Atualiza um jogador existente
   */
  async update(id: string, playerUpdates: Partial<Player>): Promise<Player> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para atualizar um jogador');
      }
      
      // Buscar o jogador existente para verificar permissões
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('created_by')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Erro ao buscar jogador:', fetchError);
        throw new Error('Não foi possível encontrar o jogador para atualização');
      }
      
      // Verificar se o usuário é o criador do jogador ou um administrador
      const isAdmin = user.user_metadata?.role === 'admin';
      const isCreator = existingPlayer.created_by === user.id;
      
      if (!isAdmin && !isCreator) {
        console.error('Usuário não autorizado a atualizar este jogador');
        throw new Error('Você não tem permissão para atualizar este jogador');
      }
      
      // Atualizar o jogador
      const { data: updatedPlayer, error: updateError } = await supabase
        .from('players')
        .update({
          ...playerUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Erro ao atualizar jogador:', updateError);
        throw new Error('Não foi possível atualizar o jogador');
      }
      
      return updatedPlayer;
    } catch (error) {
      console.error('Erro ao atualizar jogador:', error);
      throw error instanceof Error ? error : new Error('Ocorreu um erro ao atualizar o jogador');
    }
  },
  
  /**
   * Exclui um jogador
   */
  async delete(id: string): Promise<void> {
    try {
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para excluir um jogador');
      }
      
      // Buscar o jogador para verificar permissões
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('players')
        .select('created_by')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Erro ao buscar jogador:', fetchError);
        throw new Error('Não foi possível encontrar o jogador para exclusão');
      }
      
      // Verificar se o usuário é o criador do jogador ou um administrador
      const isAdmin = user.user_metadata?.role === 'admin';
      const isCreator = existingPlayer.created_by === user.id;
      
      if (!isAdmin && !isCreator) {
        console.error('Usuário não autorizado a excluir este jogador');
        throw new Error('Você não tem permissão para excluir este jogador');
      }
      
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
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Erro ao excluir jogador:', deleteError);
        throw new Error('Não foi possível excluir o jogador');
      }
    } catch (error) {
      console.error('Erro ao excluir jogador:', error);
      throw error instanceof Error ? error : new Error('Ocorreu um erro ao excluir o jogador');
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
      
      // Verificar se o jogador existe e se o usuário tem acesso a ele
      const { data: playerRelation, error: relationCheckError } = await supabase
        .from('user_player_relations')
        .select('*')
        .eq('user_id', user.id)
        .eq('player_id', playerId)
        .single();
      
      if (relationCheckError || !playerRelation) {
        console.error('Jogador não encontrado ou usuário sem permissão:', relationCheckError);
        throw new Error('Jogador não encontrado ou você não tem permissão para acessá-lo');
      }
      
      // Iniciar uma transação para garantir a consistência dos dados
      const { data, error: transactionError } = await supabase.rpc('set_primary_player_transaction', {
        p_user_id: user.id,
        p_player_id: playerId
      });
      
      if (transactionError) {
        console.error('Erro na transação de definição de jogador primário:', transactionError);
        throw new Error('Não foi possível definir o jogador como primário');
      }
      
      // Se a função RPC não retornou sucesso, lançar um erro
      if (!data || !data.success) {
        console.error('Erro ao definir jogador primário:', data?.message || 'Erro desconhecido');
        throw new Error(data?.message || 'Não foi possível definir o jogador como primário');
      }
    } catch (error) {
      console.error('Erro ao definir jogador primário:', error);
      throw error instanceof Error ? error : new Error('Ocorreu um erro ao definir o jogador primário');
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
      
      // Buscar o jogador primário usando uma consulta mais robusta com RPC
      const { data: primaryPlayerData, error } = await supabase
        .rpc('get_primary_player', { p_user_id: user.id });
      
      if (error) {
        // Se não encontrar nenhum jogador primário, não é um erro, retorna null
        if (error.code === 'PGRST116' || error.code === 'P0003') {
          return null;
        }
        console.error('Erro ao buscar jogador primário:', error);
        throw new Error('Não foi possível buscar o jogador primário');
      }
      
      // Se não encontrou nenhum jogador primário, retorna null
      if (!primaryPlayerData || primaryPlayerData.length === 0) {
        return null;
      }
      
      // Retorna o primeiro jogador (deveria haver apenas um)
      return primaryPlayerData[0] as Player;
    } catch (error) {
      console.error('Erro ao obter jogador primário:', error);
      throw new Error('Ocorreu um erro ao obter o jogador primário');
    }
  }
};
