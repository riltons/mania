import { supabase } from '@/lib/supabase';
import { activityService } from './activityService';

export const playersService = {
    async list() {
        try {
            console.log('Buscando jogadores...');
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('Usuário não autenticado');
            
            // Buscar jogadores criados pelo usuário
            console.log('Buscando jogadores criados pelo usuário...');
            const { data: createdPlayers, error: createdError } = await supabase
                .from('players')
                .select('*')
                .eq('created_by', userId)
                .order('name');

            if (createdError) {
                console.error('Erro ao buscar jogadores criados:', createdError);
                throw createdError;
            }

            // Buscar jogadores vinculados ao usuário
            console.log('Buscando jogadores vinculados ao usuário...');
            const { data: linkedPlayers, error: linkedError } = await supabase
                .from('user_player_relations')
                .select('player:player_id(*)')
                .eq('user_id', userId);

            if (linkedError) {
                console.error('Erro ao buscar jogadores vinculados:', linkedError);
                throw linkedError;
            }

            // Combinar jogadores criados e vinculados
            const userPlayers = [
                ...(createdPlayers || []),
                ...(linkedPlayers?.map(lp => lp.player) || [])
            ];

            // Lista de IDs de jogadores do usuário
            const userPlayerIds = userPlayers.map(p => p.id);

            // Buscar jogadores das comunidades onde sou organizador
            console.log('Buscando jogadores das comunidades...');
            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
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
                .eq('community_members.communities.community_organizers.user_id', userId)
                .order('name');

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores das comunidades:', communityPlayersError);
                throw communityPlayersError;
            }

            // Remover duplicatas dos jogadores das comunidades e filtrar os que já são do usuário
            const uniqueCommunityPlayers = communityPlayers 
                ? Array.from(new Set(communityPlayers.map(p => p.id)))
                    .map(id => communityPlayers.find(p => p.id === id))
                    .filter(p => p !== undefined && !userPlayerIds.includes(p.id))
                : [];

            // Remover duplicatas e ordenar por nome
            const uniqueUserPlayers = Array.from(new Set(userPlayers.map(p => p.id)))
                .map(id => userPlayers.find(p => p.id === id))
                .filter(p => p !== undefined)
                .sort((a, b) => a.name.localeCompare(b.name));

            return {
                myPlayers: uniqueUserPlayers,
                communityPlayers: uniqueCommunityPlayers
            };
        } catch (error) {
            console.error('Erro ao listar jogadores:', error);
            throw error;
        }
    },

    async getPlayer(id: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('id, name')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            throw error;
        }
    },

    async createPlayer(name: string) {
        try {
            console.log('Iniciando criação de jogador:', name);

            // Criar jogador
            const { data: player, error: playerError } = await supabase
                .from('players')
                .insert([{ name }])
                .select()
                .single();

            if (playerError) {
                console.error('Erro ao criar jogador:', playerError);
                throw playerError;
            }

            console.log('Jogador criado com sucesso:', player);

            // Registrar a atividade de criação do jogador com sistema de retry
            if (player) {
                const maxRetries = 3;
                const baseDelay = 1000; // 1 segundo

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'player',
                            description: `Novo jogador "${name}" foi criado`,
                            metadata: {
                                player_id: player.id,
                                name: player.name
                            }
                        });
                        console.log('Atividade criada com sucesso!');
                        return true;
                    } catch (activityError) {
                        console.error(`Erro na tentativa ${attempt}:`, activityError);
                        
                        if (attempt < maxRetries) {
                            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                            console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return createActivityWithRetry(attempt + 1);
                        }
                        
                        console.error('Todas as tentativas de criar atividade falharam');
                        return false;
                    }
                };

                // Inicia o processo de retry em background
                createActivityWithRetry(1).catch(error => {
                    console.error('Erro no processo de retry:', error);
                });
            }

            return player;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    },

    async updatePlayer(id: string, name: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .update({ name })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    },

    async deletePlayer(id: string) {
        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao deletar jogador:', error);
            throw error;
        }
    }
};
