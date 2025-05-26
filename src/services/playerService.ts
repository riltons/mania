import { supabase, supabaseUrl, supabaseAnonKey } from '@/core/lib/supabase';
import { activityService } from './activityService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

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

    async getByPhone(phone: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('phone', phone)
                .single();

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

    async create(data: CreatePlayerDTO) {
        try {
            // Verifica se já existe jogador com este telefone
            const existingPlayer = await this.getByPhone(data.phone);
            if (existingPlayer) {
                // Vincula jogador existente ao usuário atual
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                const { error: relationError } = await supabase
                    .from('user_player_relations')
                    .insert([{ 
                        user_id: userData.user.id, 
                        player_id: existingPlayer.id,
                        is_primary: false
                    }]);
                
                if (relationError && relationError.code !== '23505') {
                    console.error('Erro ao vincular jogador existente:', relationError);
                    throw new Error('Erro ao vincular jogador');
                }
                
                // Atualiza a lista de jogadores em memória
                await this.list();
                return existingPlayer;
            }

            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Cria o novo jogador
            const { data: newPlayer, error } = await supabase
                .from('players')
                .insert([{
                    ...data,
                    created_by: userData.user.id
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Já existe um jogador cadastrado com este telefone');
                }
                console.error('Erro ao criar jogador:', error);
                throw new Error('Erro ao criar jogador');
            }

            // Cria a relação usuário-jogador como primária
            const { error: relationError } = await supabase
                .from('user_player_relations')
                .insert([{ 
                    user_id: userData.user.id, 
                    player_id: newPlayer.id,
                    is_primary: true 
                }]);

            if (relationError) {
                console.error('Erro ao criar relação usuário-jogador:', relationError);
                throw new Error('Erro ao criar relação com o jogador');
            }

            // Atualiza a lista de jogadores em memória
            await this.list();
            return newPlayer;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    }

    async getPlayerStats(playerId: string) {
        try {
            const { count: totalGames, error: gamesError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact' })
                .eq('player_id', playerId);

            if (gamesError) throw gamesError;

            const { count: wins, error: winsError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact', head: true })
                .eq('player_id', playerId)
                .eq('is_winner', true);

            if (winsError) throw winsError;

            const { count: buchudas, error: buchudasError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact', head: true })
                .eq('player_id', playerId)
                .eq('is_buchuda', true);

            if (buchudasError) throw buchudasError;

            return {
                total_games: totalGames || 0,
                wins: wins || 0,
                losses: (totalGames || 0) - (wins || 0),
                buchudas: buchudas || 0
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

    async list(fetchStats = false) {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error('Erro ao obter usuário:', userError);
                throw userError;
            }
            
            console.log('Buscando jogadores para o usuário:', userData.user.id);

            // Buscar jogadores criados pelo usuário
            console.log('Buscando jogadores criados pelo usuário...');
            const { data: myPlayers, error: myPlayersError } = await supabase
                .from('players')
                .select('*, user_player_relations!inner(user_id, is_primary)')
                .eq('created_by', userData.user.id)
                .order('name');

            if (myPlayersError) {
                console.error('Erro ao buscar jogadores criados:', myPlayersError);
                throw new Error('Erro ao listar jogadores');
            }
            
            console.log('Jogadores criados pelo usuário encontrados:', myPlayers?.length || 0);
            if (myPlayers && myPlayers.length > 0) {
                console.log('Exemplo de jogador criado:', {
                    id: myPlayers[0].id,
                    name: myPlayers[0].name,
                    created_by: myPlayers[0].created_by,
                    relations: myPlayers[0].user_player_relations
                });
            }

            // Buscar jogadores das comunidades onde sou organizador
            console.log('Buscando jogadores das comunidades...');
            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations!inner(user_id, is_primary),
                    community_members!inner (
                        community_id,
                        communities!inner (
                            id,
                            community_organizers!inner (
                                user_id
                            )
                        )
                    )
                `)
                .eq('community_members.communities.community_organizers.user_id', userData.user.id)
                .neq('created_by', userData.user.id)
                .order('name');

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores da comunidade:', communityPlayersError);
                throw new Error('Erro ao listar jogadores');
            }
            
            console.log('Jogadores das comunidades encontrados:', communityPlayers?.length || 0);

            // Processar jogadores com ou sem estatísticas
            if (fetchStats) {
                // Adicionar estatísticas aos jogadores
                const myPlayersWithStats = await Promise.all((myPlayers || []).map(async (player) => {
                    const stats = await this.getPlayerStats(player.id);
                    return {
                        ...player,
                        stats,
                        isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary),
                        isMine: true
                    };
                }));

                const communityPlayersWithStats = await Promise.all((communityPlayers || []).map(async (player) => {
                    const stats = await this.getPlayerStats(player.id);
                    return {
                        ...player,
                        stats,
                        isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary),
                        isMine: false
                    };
                }));

                return {
                    myPlayers: myPlayersWithStats,
                    communityPlayers: communityPlayersWithStats
                };
            } else {
                // Retornar jogadores sem estatísticas
                const myPlayersWithoutStats = (myPlayers || []).map(player => ({
                    ...player,
                    isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary),
                    isMine: true
                }));

                const communityPlayersWithoutStats = (communityPlayers || []).map(player => ({
                    ...player,
                    isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary),
                    isMine: false
                }));

                return {
                    myPlayers: myPlayersWithoutStats,
                    communityPlayers: communityPlayersWithoutStats
                };
            }
        } catch (error) {
            console.error('Erro ao listar jogadores:', error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erro ao buscar jogador:', error);
                throw new Error('Erro ao buscar jogador');
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            throw error;
        }
    }

    async update(id: string, data: Partial<Player>) {
        try {
            const { data: updatedPlayer, error } = await supabase
                .from('players')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar jogador:', error);
                throw new Error('Erro ao atualizar jogador');
            }

            // Atualiza a lista de jogadores em memória
            await this.list();
            return updatedPlayer;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    }

    async uploadAvatar(playerId: string, uri: string) {
        try {
            // Implementação do upload de avatar
            // ...
            throw new Error('Método não implementado');
        } catch (error) {
            console.error('Erro ao fazer upload do avatar:', error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao excluir jogador:', error);
                throw new Error('Erro ao excluir jogador');
            }

            // Atualiza a lista de jogadores em memória
            await this.list();
            return true;
        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
            throw error;
        }
    }

    async listCompetitionMembers(competitionId: string) {
        try {
            const { data, error } = await supabase
                .from('competition_players')
                .select('player:players(*, user_player_relations!inner(user_id, is_primary))')
                .eq('competition_id', competitionId);

            if (error) {
                console.error('Erro ao listar membros da competição:', error);
                throw new Error('Erro ao listar membros da competição');
            }

            return data?.map(item => ({
                ...item.player,
                isLinkedUser: item.player.user_player_relations?.some(rel => rel.is_primary)
            })) || [];
        } catch (error) {
            console.error('Erro ao listar membros da competição:', error);
            throw error;
        }
    }

    async getOrCreatePlayerForCurrentUser(): Promise<Player> {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Tenta encontrar um jogador vinculado ao usuário atual
            const { data: relations, error: relationsError } = await supabase
                .from('user_player_relations')
                .select('player:players(*)')
                .eq('user_id', userData.user.id)
                .single();

            if (relationsError && relationsError.code !== 'PGRST116') {
                console.error('Erro ao buscar relação de jogador:', relationsError);
                throw new Error('Erro ao buscar jogador vinculado');
            }

            // Se encontrou um jogador vinculado, retorna
            if (relations?.player) {
                return {
                    ...relations.player,
                    isLinkedUser: true
                };
            }

            // Se não encontrou, tenta buscar o perfil do usuário
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userData.user.id)
                .single();

            if (profileError) {
                console.error('Erro ao buscar perfil do usuário:', profileError);
                throw new Error('Erro ao buscar perfil do usuário');
            }

            // Cria um novo jogador com base no perfil do usuário
            const newPlayer = await this.create({
                name: profile.full_name || userData.user.email?.split('@')[0] || 'Novo Jogador',
                phone: profile.phone || '',
                nickname: profile.nickname || userData.user.email?.split('@')[0]
            });

            // Marca como jogador vinculado
            return {
                ...newPlayer,
                isLinkedUser: true
            };
        } catch (error) {
            console.error('Erro ao obter/criar jogador para o usuário atual:', error);
            throw error;
        }
    }
}

export const playerService = new PlayerService();
