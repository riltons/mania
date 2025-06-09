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
   * @param options Opções de ordenação e filtro
   */
  async list(options: {
    sortBy?: keyof Player;
    sortOrder?: 'asc' | 'desc';
    searchTerm?: string;
    includeShared?: boolean;
    includeOwn?: boolean;
  } = {}): Promise<{ myPlayers: Player[]; communityPlayers: Player[]; total: number }> {
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
        sortBy = 'name',
        sortOrder = 'asc',
        searchTerm = '',
        includeShared = true,
        includeOwn = true
      } = options;
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
        
        // 3. Buscar jogadores das comunidades em que o usuário é organizador
        try {
          // Primeiro, buscar as comunidades em que o usuário é organizador
          const { data: organizedCommunities, error: orgError } = await supabase
            .from('community_organizers')
            .select('community_id')
            .eq('user_id', user.id);
            
          if (orgError) {
            console.error('Erro ao buscar comunidades organizadas:', orgError);
          } else if (organizedCommunities && organizedCommunities.length > 0) {
            const communityIds = organizedCommunities.map(org => org.community_id);
            console.log(`Usuário é organizador em ${communityIds.length} comunidades`);
            
            // Buscar jogadores dessas comunidades
            const { data: communityPlayers, error: playersError } = await supabase
              .from('community_members')
              .select('player_id, players(id, name, phone, created_at, nickname, created_by, avatar_url)')
              .in('community_id', communityIds);
              
            if (playersError) {
              console.error('Erro ao buscar jogadores das comunidades organizadas:', playersError);
            } else if (communityPlayers && communityPlayers.length > 0) {
              // Filtrar jogadores válidos e remover duplicados
              const validPlayers = communityPlayers
                .filter(cp => cp.players) // Garantir que o jogador existe
                .map(cp => cp.players);
              
              // Remover jogadores que já estão na lista (próprios ou compartilhados)
              const existingPlayerIds = new Set(allPlayers.map(p => p.id));
              const newCommunityPlayers = validPlayers.filter(player => !existingPlayerIds.has(player.id));
              
              // Adicionar à lista de jogadores
              allPlayers = [
                ...allPlayers,
                ...newCommunityPlayers.map((player: any) => ({
                  ...player,
                  isCreatedByOtherUser: player.created_by !== user.id,
                  sharedPlayer: true,
                  communityPlayer: true, // Marca como jogador de comunidade
                  isPrimary: false
                }))
              ];
              
              totalCount += newCommunityPlayers.length;
              console.log(`Encontrados ${newCommunityPlayers.length} jogadores adicionais das comunidades organizadas`);
            }
          }
        } catch (communityError) {
          console.error('Erro ao processar jogadores das comunidades organizadas:', communityError);
        }
      }
      
      console.log(`Total de jogadores encontrados: ${totalCount}`);
      
      // Ordena por nome e prioridade
      const sortedPlayers = [...allPlayers].sort((a, b) => {
        // Primeiro ordenamos por isPrimary (jogadores primários primeiro)
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        
        // Depois ordenamos pelo nome
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';
        
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        return (aName < bName ? -1 : 1) * multiplier;
      });
      
      // Separar jogadores próprios dos jogadores de comunidade
      const myPlayers = sortedPlayers.filter(p => !p.sharedPlayer);
      const communityPlayers = sortedPlayers.filter(p => p.sharedPlayer);
      
      console.log(`Organização final: ${myPlayers.length} próprios, ${communityPlayers.length} compartilhados, ${communityPlayers.filter(p => p.communityPlayer).length} de comunidades`);
      console.log(`Finalizado carregamento de jogadores`);
      
      return {
        myPlayers,
        communityPlayers,
        total: totalCount
      };
    } catch (error) {
      console.error('Erro ao listar jogadores:', error);
      throw error instanceof Error ? error : new Error('Ocorreu um erro ao listar os jogadores');
    }
  },
  
  async listAll(): Promise<{ myPlayers: Player[]; communityPlayers: Player[] }> {
    // Este método garante que todos os jogadores sejam retornados sem paginação
    try {
      console.log('playersService.listAll: Iniciando busca de todos os jogadores...');
      
      // Buscando jogadores diretamente sem paginação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('playersService.listAll: Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar logado para ver jogadores');
      }

      console.log(`playersService.listAll: Usuário autenticado: ${user.id}`);
      
      // Verificar se o jogador já existe para o usuário atual
      console.log(`Jogador já existe: ${user.id}`);
      
      console.log('Buscando jogadores...');
      
      // Consulta para jogadores próprios (criados pelo usuário)
      const { data: myPlayersData, error: myPlayersError } = await supabase
        .from('players')
        .select('*')
        .eq('created_by', user.id);

      if (myPlayersError) {
        console.error('playersService.listAll: Erro ao buscar jogadores próprios:', myPlayersError);
        throw myPlayersError;
      }

      // Consulta para jogadores compartilhados (através da tabela user_player_relations)
      const { data: sharedPlayersData, error: sharedPlayersError } = await supabase
        .from('user_player_relations')
        .select('player_id, is_primary, players(*)')
        .eq('user_id', user.id)
        .neq('players.created_by', user.id);

      if (sharedPlayersError) {
        console.error('playersService.listAll: Erro ao buscar jogadores compartilhados:', sharedPlayersError);
        throw sharedPlayersError;
      }
      
      // Processar jogadores próprios
      const myPlayers = (myPlayersData || []).map(player => {
        // Buscar a relação para determinar se é primário
        return {
          ...player,
          isPrimary: false, // Valor padrão, será atualizado abaixo
          isMine: true,
          sharedPlayer: false,
          isCreatedByOtherUser: false
        };
      });
      
      console.log(`Encontrados ${myPlayers.length} jogadores próprios`);
      
      // Processar jogadores compartilhados
      const communityPlayers = (sharedPlayersData || []).map(relation => {
        const player = relation.players;
        return {
          ...player,
          isPrimary: relation.is_primary,
          isMine: false,
          sharedPlayer: true,
          isCreatedByOtherUser: true
        };
      });
      
      console.log(`Encontrados ${communityPlayers.length} jogadores compartilhados`);
      
      // Buscar comunidades onde o usuário é organizador
      // Primeiro, buscamos os jogadores associados ao usuário
      const { data: userPlayers, error: playersError } = await supabase
        .from('user_player_relations')
        .select('player_id')
        .eq('user_id', user.id);
      
      let organizerCommunities: Array<{ community_id: string }> = [];
      
      if (playersError) {
        console.error('playersService.listAll: Erro ao buscar jogadores do usuário:', playersError);
      } else if (userPlayers && userPlayers.length > 0) {
        const playerIds = userPlayers.map(up => up.player_id);
        
        // Agora buscamos as comunidades onde esses jogadores são membros
        const { data: communities, error: organizerError } = await supabase
          .from('community_members')
          .select('community_id')
          .in('player_id', playerIds);
          
        if (organizerError) {
          console.error('playersService.listAll: Erro ao buscar comunidades como organizador:', organizerError);
        } else if (communities) {
          organizerCommunities = communities;
        }
      }
      
      console.log(`Usuário é organizador em ${organizerCommunities?.length || 0} comunidades`);
      
      // Buscar jogadores das comunidades onde o usuário é organizador
      let communityPlayersData = [];
      if (organizerCommunities && organizerCommunities.length > 0) {
        const communityIds = organizerCommunities.map(c => c.community_id);
        
        const { data: communityMemberData, error: communityPlayersError } = await supabase
          .from('community_members')
          .select('player_id, players(*)')
          .in('community_id', communityIds);
        
        if (communityPlayersError) {
          console.error('playersService.listAll: Erro ao buscar jogadores das comunidades:', communityPlayersError);
        } else if (communityMemberData) {
          // Filtrar jogadores únicos
          const uniquePlayerIds = new Set();
          communityPlayersData = communityMemberData.filter(cp => {
            if (!cp.player_id || uniquePlayerIds.has(cp.player_id)) return false;
            uniquePlayerIds.add(cp.player_id);
            return true;
          }).map(cp => ({
            ...cp.players,
            isPrimary: false,
            isMine: cp.players.created_by === user.id,
            sharedPlayer: true,
            isCreatedByOtherUser: cp.players.created_by !== user.id
          }));
        }
      }
      
      console.log(`Encontrados ${communityPlayersData.length} jogadores adicionais das comunidades organizadas`);
      
      // Combinar todos os jogadores e remover duplicados
      const allPlayerIds = new Set(myPlayers.map(p => p.id));
      const allCommunityPlayers = [...communityPlayers];
      
      // Adicionar jogadores das comunidades que ainda não estão na lista
      communityPlayersData.forEach(player => {
        if (!allPlayerIds.has(player.id)) {
          allCommunityPlayers.push(player);
          allPlayerIds.add(player.id);
        }
      });
      
      console.log(`Total de jogadores encontrados: ${myPlayers.length + allCommunityPlayers.length}`);
      console.log(`Organização final: ${myPlayers.length} próprios, ${allCommunityPlayers.length} compartilhados, ${communityPlayersData.length} de comunidades`);
      
      // Atualizar o status de primário para jogadores próprios
      const { data: primaryRelations, error: primaryError } = await supabase
        .from('user_player_relations')
        .select('player_id, is_primary')
        .eq('user_id', user.id)
        .eq('is_primary', true);
      
      if (!primaryError && primaryRelations) {
        const primaryIds = new Set(primaryRelations.map(r => r.player_id));
        myPlayers.forEach(player => {
          player.isPrimary = primaryIds.has(player.id);
        });
      }
      
      // Ordenar jogadores: primário primeiro, depois por nome
      const sortedMyPlayers = [...myPlayers].sort((a, b) => {
        // Verificar se algum dos jogadores é primário
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        
        // Se ambos têm nome, ordena por nome
        if (a.name && b.name) {
          return a.name.localeCompare(b.name);
        }
        
        // Se algum não tem nome, coloca por último
        if (!a.name) return 1;
        if (!b.name) return -1;
        
        return 0;
      });

      // Ordenar jogadores da comunidade por nome, tratando valores nulos
      const sortedCommunityPlayers = [...allCommunityPlayers].sort((a, b) => {
        if (!a.name) return 1;
        if (!b.name) return -1;
        return a.name.localeCompare(b.name);
      });
      
      console.log('Finalizado carregamento de jogadores');
      
      return {
        myPlayers: sortedMyPlayers,
        communityPlayers: sortedCommunityPlayers
      };
    } catch (error) {
      console.error('Erro ao listar todos os jogadores:', error);
      console.log('Jogadores encontrados: 0');
      console.log('Nenhum jogador encontrado ou resultado inválido');
      console.log('Finalizado carregamento de jogadores');
      return { myPlayers: [], communityPlayers: [] };
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
      
      // Normalizar e validar o telefone brasileiro
      const normalizedPhone = this.normalizePhoneNumber(player.phone);
      console.log('[PlayerService] Telefone após remover caracteres especiais:', player.phone, '->', normalizedPhone);
      
      // Valida o telefone brasileiro
      const validation = this.validateBrazilianPhone(normalizedPhone);
      if (!validation.isValid) {
        console.error('Erro de validação de telefone:', validation.errorMessage);
        throw new Error(`Telefone inválido: ${validation.errorMessage}`);
      }
      
      // Atualiza o telefone com o valor normalizado
      player.phone = normalizedPhone;
      console.log('[PlayerService] Normalização concluída:', player.phone, '->', normalizedPhone);
      
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
   * Normaliza um número de telefone brasileiro, removendo caracteres não numéricos
   * @param phone Número de telefone a ser normalizado
   * @returns Número de telefone normalizado (apenas dígitos)
   */
  normalizePhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const normalizedPhone = phone.replace(/\D/g, '');
    console.log('[PlayerService] Telefone após remover caracteres especiais:', phone, '->', normalizedPhone);
    return normalizedPhone;
  },

  /**
   * Valida um número de telefone brasileiro
   * @param phone Número de telefone a ser validado (já normalizado)
   * @returns Um objeto com o resultado da validação e mensagem de erro se houver
   */
  validateBrazilianPhone(phone: string): {isValid: boolean, errorMessage?: string} {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    // Valida se tem 11 dígitos (padrão brasileiro com DDD e 9 no início)
    if (normalizedPhone.length !== 11) {
      return {
        isValid: false, 
        errorMessage: 'O telefone deve ter 11 dígitos incluindo DDD e o 9 inicial'
      };
    }
    
    // Valida se o terceiro dígito é 9 (padrão brasileiro para celulares)
    if (normalizedPhone.charAt(2) !== '9') {
      return {
        isValid: false, 
        errorMessage: 'O terceiro dígito deve ser 9 (padrão brasileiro para celulares)'
      };
    }
    
    // Valida se o DDD está entre 11 e 99
    const ddd = parseInt(normalizedPhone.substring(0, 2));
    if (ddd < 11 || ddd > 99) {
      return {
        isValid: false, 
        errorMessage: 'O DDD deve estar entre 11 e 99'
      };
    }
    
    return {isValid: true};
  },

  /**
   * Formata um número de telefone brasileiro para exibição
   * @param phone Número de telefone a ser formatado
   * @returns Número formatado no padrão (XX) XXXXX-XXXX
   */
  formatPhoneNumber(phone: string): string {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    if (normalizedPhone.length !== 11) return phone; // Retorna como está se não tiver 11 dígitos
    
    return `(${normalizedPhone.substring(0, 2)}) ${normalizedPhone.substring(2, 7)}-${normalizedPhone.substring(7)}`;
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
      
      // Verificar se há atualização de telefone e validar
      if (playerUpdates.phone) {
        // Normaliza o telefone
        const normalizedPhone = this.normalizePhoneNumber(playerUpdates.phone);
        console.log('[PlayerService] Telefone normalizado:', normalizedPhone);
        
        // Valida o telefone brasileiro
        const validation = this.validateBrazilianPhone(normalizedPhone);
        
        if (!validation.isValid) {
          console.error('Erro de validação de telefone:', validation.errorMessage);
          throw new Error(`Telefone inválido: ${validation.errorMessage}`);
        }
        
        // Substitui o telefone pelos dígitos normalizados
        playerUpdates.phone = normalizedPhone;
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
   * Exclui um jogador e todas as suas relações
   * @param id ID do jogador a ser excluído
   * @throws {Error} Se o usuário não estiver autenticado, não tiver permissão ou ocorrer um erro na exclusão
   */
  async delete(id: string): Promise<void> {
    console.log('[playersService] Iniciando exclusão do jogador:', id);

    if (!id) {
      console.error('[playersService] ID do jogador não fornecido');
      throw new Error('ID do jogador é obrigatório');
    }

    try {
      // 1. Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('[playersService] Erro ao obter usuário:', userError);
        throw new Error('Você precisa estar autenticado para excluir um jogador');
      }
      console.log('[playersService] Usuário autenticado:', user.id);

      // 2. Verificar permissões (buscando o jogador e quem o criou)
      console.log('[playersService] Verificando permissões...');
      const { data: playerData, error: fetchError } = await supabase
        .from('players')
        .select('id, created_by, name, is_active') // Adicionado is_active para log, se necessário
        .eq('id', id)
        .single();

      if (fetchError || !playerData) {
        console.error('[playersService] Jogador não encontrado:', fetchError);
        throw new Error('Jogador não encontrado');
      }

      const isAdmin = user.user_metadata?.role === 'admin';
      const isCreator = playerData.created_by === user.id;

      console.log('[playersService] Permissões verificadas:', {
        isAdmin,
        isCreator,
        playerCreatedBy: playerData.created_by,
        playerIsActive: playerData.is_active,
        currentUser: user.id
      });

      if (!isAdmin && !isCreator) {
        console.error('[playersService] Acesso negado: usuário não é admin nem criador');
        throw new Error('Você não tem permissão para excluir/inativar este jogador');
      }

      // 3. Verificar se o jogador tem jogos associados
      console.log('[playersService] Verificando se o jogador tem jogos associados...');
      const { count: gamePlayerCount, error: gamePlayerError } = await supabase
        .from('game_players')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', id);

      if (gamePlayerError) {
        console.error('[playersService] Erro ao verificar jogos do jogador:', gamePlayerError);
        throw new Error('Não foi possível verificar os jogos do jogador.');
      }

      const hasGames = gamePlayerCount && gamePlayerCount > 0;
      console.log(`[playersService] Jogador ${id} tem jogos: ${hasGames}`);

      // 4. Excluir relacionamento em user_player_relations para o usuário atual
      // Isso é feito independentemente de o jogador ser inativado ou excluído,
      // para remover a associação do jogador com o usuário que solicitou a exclusão.
      console.log('[playersService] Excluindo relacionamento usuário-jogador para o usuário atual...');
      const { error: relationsError } = await supabase
        .from('user_player_relations')
        .delete()
        .eq('player_id', id)
        .eq('user_id', user.id); // Garante que apenas a relação do usuário atual seja removida

      if (relationsError) {
        console.error('[playersService] Erro ao excluir relacionamento usuário-jogador:', relationsError);
        throw new Error('Não foi possível remover o relacionamento do jogador com o usuário.');
      }
      console.log(`[playersService] Relacionamento usuário-jogador para ${id} e ${user.id} excluído.`);

      // 5. Lógica condicional de exclusão ou inativação
      if (hasGames) {
        // Se tem jogos, apenas inativar o jogador na tabela 'players'
        console.log(`[playersService] Jogador ${id} tem jogos. Inativando...`);
        const { error: updateError } = await supabase
          .from('players')
          .update({ is_active: false })
          .eq('id', id);

        if (updateError) {
          console.error('[playersService] Erro ao inativar jogador:', updateError);
          throw new Error('Não foi possível inativar o jogador.');
        }
        console.log(`[playersService] Jogador ${id} inativado com sucesso.`);
      } else {
        // Se não tem jogos, excluir o jogador da tabela 'players'
        // A política RLS na tabela 'players' garantirá que apenas o criador ou admin possa fazer isso.
        console.log(`[playersService] Jogador ${id} não tem jogos. Excluindo fisicamente...`);
        const { error: deleteError } = await supabase
          .from('players')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('[playersService] Erro ao excluir jogador fisicamente:', deleteError);
          throw new Error('Não foi possível excluir o jogador fisicamente.');
        }
        console.log(`[playersService] Jogador ${id} excluído fisicamente com sucesso.`);
      }
    } catch (error: any) { // Adicionada tipagem 'any' para o erro do catch
      console.error('[playersService] Erro durante a exclusão:', error);
      throw error instanceof Error
        ? error
        : new Error('Ocorreu um erro inesperado ao excluir o jogador');
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário:', userError);
        return null;
      }
      
      // Buscar o jogador primário do usuário
      const { data: primaryPlayer, error } = await supabase
        .from('user_player_relations')
        .select('player:players(*)')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();
      
      if (error) {
        console.error('Erro ao buscar jogador primário:', error);
        return null;
      }
      
      return primaryPlayer?.player as Player | null;
    } catch (error) {
      console.error('Erro ao obter jogador primário:', error);
      return null;
    }
  }
};
