
import { supabase } from '@/core/lib/supabase';
import { activityService } from '@/services/activityService';
import { Database } from '@/types/database.types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

type Tables = Database['public']['Tables'];
type PlayersRow = Tables['players']['Row'];
type PlayersInsert = Tables['players']['Insert'];
type PlayersUpdate = Tables['players']['Update'];
type UserPlayerRelationsInsert = Tables['user_player_relations']['Insert'];

export interface Player {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    nickname?: string;
    created_by: string;
    avatar_url?: string;
    isLinkedUser?: boolean;
    isMine?: boolean;
    isExistingPlayer?: boolean;
    isPrimaryUser?: boolean;
    stats?: PlayerStats;
    user_player_relations?: Array<{
        is_primary: boolean;
        user_id: string;
    }>;
}

export interface PlayerStats {
    total_games: number;
    wins: number;
    losses: number;
    buchudas: number;
}

interface CreatePlayerDTO {
    name: string;
    phone: string;
    nickname?: string;
    avatar_url?: string;
}

class PlayerService {
    private players: Player[] = [];

    async getByPhone(phone: string): Promise<Player | null> {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('phone', phone as any) // Usando type assertion para evitar erro de tipo
                .single() as { data: Player | null, error: any };

            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar jogador por telefone:', error);
                throw new Error('Erro ao buscar jogador por telefone');
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar jogador por telefone:', error);
            throw error;
        }
    }

    async create(data: CreatePlayerDTO): Promise<Player> {
        try {
            const existingPlayer = await this.getByPhone(data.phone);
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            if (!currentUserId) {
                throw new Error('Usuário não autenticado');
            }

            if (existingPlayer) {
                // Verifica se o usuário atual já tem relação com este jogador
                const { data: existingRelation } = await supabase
                    .from('user_player_relations')
                    .select('*')
                    .eq('user_id', currentUserId as any) // Usando type assertion
                    .eq('player_id', existingPlayer.id as any) // Usando type assertion
                    .maybeSingle();

                if (!existingRelation) {
                    // Cria uma nova relação sem marcar como primária
                    const relationData: UserPlayerRelationsInsert = {
                        user_id: currentUserId,
                        player_id: existingPlayer.id,
                        is_primary: false,
                        created_at: new Date().toISOString()
                    };
                    
                    const { error } = await supabase
                        .from('user_player_relations')
                        .upsert([relationData] as any); // Usando type assertion para evitar erro de tipo

                    if (error) {
                        console.error('Erro ao criar relação com jogador existente:', error);
                        throw error;
                    }
                }
                
                // Retorna o jogador existente com informações adicionais
                return {
                    ...existingPlayer,
                    isExistingPlayer: true,
                    isPrimaryUser: existingPlayer.created_by === currentUserId,
                    isLinkedUser: true
                };
            }

            // Cria um novo jogador
            const newPlayerData = {
                name: data.name,
                phone: data.phone,
                nickname: data.nickname,
                created_by: currentUserId,
                avatar_url: data.avatar_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: createdPlayer, error: createError } = await supabase
                .from('players')
                .insert([newPlayerData] as any)
                .select()
                .single() as { data: Player | null, error: any };

            if (createError) {
                if (createError.code === '23505') {
                    throw new Error('Já existe um jogador cadastrado com este telefone');
                }
                console.error('Erro ao criar jogador:', createError);
                throw new Error('Erro ao criar jogador');
            }

            if (!createdPlayer) {
                throw new Error('Falha ao criar jogador: nenhum dado retornado');
            }

            if (!createdPlayer) {
                throw new Error('Falha ao criar jogador: nenhum dado retornado');
            }

            // Criar a relação na tabela user_player_relations
            const relationData = {
                user_id: currentUserId,
                player_id: createdPlayer.id,
                is_primary: true,
                created_at: new Date().toISOString()
            };

            const { error: relationError } = await supabase
                .from('user_player_relations')
                .insert([relationData] as any);

            if (relationError) {
                console.error('Erro ao criar relação com o jogador:', relationError);
                throw new Error('Erro ao criar relação com o jogador');
            }

            // Registrar a atividade de criação do jogador
            try {
                if (createdPlayer) {
                    await activityService.createActivity({
                        type: 'player',
                        description: `Novo jogador "${data.name}" foi criado`,
                        metadata: {
                            player_id: createdPlayer.id,
                            name: createdPlayer.name
                        }
                    });
                }
            } catch (activityError) {
                console.error('Erro ao registrar atividade:', activityError);
                // Não interrompe o fluxo principal em caso de falha no registro de atividade
            }

            // Atualiza a lista de jogadores em memória
            await this.list();

            return createdPlayer;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    }

    async list(fetchStats = false): Promise<{ myPlayers: Player[], communityPlayers: Player[] }> {
        try {
            // Verificar a sessão atual
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log('Sessão atual:', sessionData.session);
            console.log('Erro na sessão:', sessionError);

            const { data: userData, error: userError } = await supabase.auth.getUser();
            console.log('Dados do usuário:', userData);
            console.log('Erro ao obter usuário:', userError);
            
            if (userError || !userData.user) {
                console.error('Erro de autenticação:', userError || 'Usuário não autenticado');
                throw userError || new Error('Usuário não autenticado');
            }

            console.log('Usuário autenticado:', userData.user.id);
            console.log('E-mail do usuário:', userData.user.email);

            // Buscar jogadores criados pelo usuário
            const { data: myPlayers, error: myPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations(
                        user_id,
                        is_primary
                    )
                `)
                .eq('created_by', userData.user.id as any) // Usando type assertion
                .order('name');

            console.log('Jogadores criados pelo usuário:', myPlayers);

            if (myPlayersError) {
                console.error('Erro ao buscar jogadores criados:', myPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Buscar jogadores das comunidades onde sou organizador
            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations(
                        user_id,
                        is_primary
                    ),
                    community_members!inner(
                        community_id,
                        communities!inner(
                            id,
                            community_organizers!inner(
                                user_id
                            )
                        )
                    )
                `)
                .eq('community_members.communities.community_organizers.user_id', userData.user.id as any) // Usando type assertion
                .neq('created_by', userData.user.id as any) // Usando type assertion
                .order('name');

            console.log('Jogadores da comunidade:', communityPlayers);

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores da comunidade:', communityPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Processar jogadores
            let players: Player[] = [];

            // Adiciona os jogadores criados pelo usuário
            if (myPlayers) {
                console.log('Processando jogadores criados pelo usuário:', myPlayers);
                players = (myPlayers as any[])
                    .filter(playerData => {
                        const isValid = playerData && 
                                      typeof playerData === 'object' && 
                                      playerData.id && 
                                      playerData.name;
                        if (!isValid) {
                            console.log('Jogador inválido filtrado:', playerData);
                        }
                        return isValid;
                    })
                    .map(playerData => {
                        const playerObj = playerData as any;
                        const relations = Array.isArray(playerObj.user_player_relations)
                            ? playerObj.user_player_relations 
                            : [];
                        
                        console.log('Processando jogador:', playerObj.id, playerObj.name, 'Relações:', relations);
                        
                        return {
                            id: playerObj.id,
                            name: playerObj.name,
                            phone: playerObj.phone || '',
                            created_at: playerObj.created_at || new Date().toISOString(),
                            created_by: playerObj.created_by || '',
                            isMine: true,
                            isLinkedUser: true,
                            isPrimaryUser: relations.some((rel: any) => rel?.is_primary) || false,
                            user_player_relations: relations,
                            nickname: playerObj.nickname || undefined,
                            avatar_url: playerObj.avatar_url || undefined,
                            stats: playerObj.stats || undefined
                        } as Player;
                    });
                
                console.log('Jogadores processados:', players);
            }

            // Adiciona os jogadores da comunidade
            if (communityPlayers) {
                console.log('Processando jogadores da comunidade:', communityPlayers);
                const communityPlayersMapped = (communityPlayers as any[])
                    .filter(playerData => {
                        const isValid = playerData && 
                                      typeof playerData === 'object' && 
                                      playerData.id && 
                                      playerData.name;
                        if (!isValid) {
                            console.log('Jogador da comunidade inválido filtrado:', playerData);
                        }
                        return isValid;
                    })
                    .map(playerData => {
                        const playerObj = playerData as any;
                        const relations = Array.isArray(playerObj.user_player_relations)
                            ? playerObj.user_player_relations 
                            : [];
                        
                        console.log('Processando jogador da comunidade:', playerObj.id, playerObj.name, 'Relações:', relations);
                        
                        return {
                            id: playerObj.id,
                            name: playerObj.name,
                            phone: playerObj.phone || '',
                            created_at: playerObj.created_at || new Date().toISOString(),
                            created_by: playerObj.created_by || '',
                            isMine: false,
                            isLinkedUser: true,
                            isPrimaryUser: relations.some((rel: any) => rel?.is_primary) || false,
                            nickname: playerObj.nickname || undefined,
                            avatar_url: playerObj.avatar_url || undefined,
                            stats: playerObj.stats || undefined,
                            user_player_relations: relations
                        } as Player;
                    });
                
                console.log('Jogadores da comunidade processados:', communityPlayersMapped);
                players = [...players, ...communityPlayersMapped];
            }

            // Separar jogadores próprios e da comunidade
            const myPlayersList = players.filter(player => player.isMine);
            const communityPlayersList = players.filter(player => !player.isMine);

            // Se necessário, buscar estatísticas para cada jogador
            if (fetchStats) {
                const [myPlayersWithStats, communityPlayersWithStats] = await Promise.all([
                    Promise.all(myPlayersList.map(async player => ({
                        ...player,
                        stats: await this.getPlayerStats(player.id)
                    }))),
                    Promise.all(communityPlayersList.map(async player => ({
                        ...player,
                        stats: await this.getPlayerStats(player.id)
                    })))
                ]);

                return {
                    myPlayers: myPlayersWithStats,
                    communityPlayers: communityPlayersWithStats
                };
            }

            return {
                myPlayers: myPlayersList,
                communityPlayers: communityPlayersList
            };
        } catch (error) {
            console.error('Erro ao listar jogadores:', error);
            throw error;
        }
    }

    async getPlayerStats(playerId: string): Promise<PlayerStats> {
        try {
            // Implementação simplificada - você pode adicionar mais lógica conforme necessário
            return {
                total_games: 0,
                wins: 0,
                losses: 0,
                buchudas: 0
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas do jogador:', error);
            return {
                total_games: 0,
                wins: 0,
                losses: 0,
                buchudas: 0
            };
        }
    }

    async update(id: string, data: Partial<Player>) {
        try {
            const updateData = {
                ...data,
                updated_at: new Date().toISOString()
            } as const;
            
            const { data: updatedPlayer, error } = await supabase
                .from('players')
                .update(updateData as any) // Usando type assertion
                .eq('id', id as any) // Usando type assertion
                .select()
                .single();

            if (error) throw error;
            return updatedPlayer;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', id as any); // Usando type assertion

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
            throw error;
        }
    }
}

export const playerService = new PlayerService();
