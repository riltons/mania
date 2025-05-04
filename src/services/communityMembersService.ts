import { supabase } from '@/lib/supabase';

export interface CommunityMember {
    id: string;
    community_id: string;
    player_id: string;
    players: {
        id: string;
        name: string;
    };
}

export const communityMembersService = {
    async listMembers(communityId: string) {
        try {
            const { data, error } = await supabase
                .from('community_members')
                .select(`
                    id,
                    community_id,
                    player_id,
                    players (
                        id,
                        name
                    )
                `)
                .eq('community_id', communityId);

            if (error) throw error;

            // Filtra membros sem dados do jogador
            const validMembers = data?.filter(member => member.players) || [];
            
            if (data?.length !== validMembers.length) {
                console.warn(`Encontrados ${data?.length - validMembers.length} membros sem dados de jogador`);
            }

            return validMembers;
        } catch (error) {
            console.error('Erro ao listar membros:', error);
            throw error;
        }
    },

    async addMember(communityId: string, playerId: string) {
        try {
            // Verifica se o membro já existe
            const { data: existingMember } = await supabase
                .from('community_members')
                .select('id')
                .eq('community_id', communityId)
                .eq('player_id', playerId)
                .single();

            if (existingMember) {
                throw new Error('Jogador já é membro desta comunidade');
            }

            const { data, error } = await supabase
                .from('community_members')
                .insert([
                    { 
                        community_id: communityId, 
                        player_id: playerId 
                    }
                ])
                .select(`
                    *,
                    players (
                        id,
                        name
                    )
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao adicionar membro:', error);
            throw error;
        }
    },

    async addMembers(communityId: string, playerIds: string[]) {
        try {
            console.log('Adicionando membros...', { communityId, playerIds });
            
            // Verificar se é organizador
            const { data: organizers, error: organizersError } = await supabase
                .from('community_organizers')
                .select('id')
                .eq('community_id', communityId)
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

            if (organizersError) {
                console.error('Erro ao verificar organizador:', organizersError);
                throw organizersError;
            }

            console.log('Verificação de organizador:', { organizers });

            if (!organizers || organizers.length === 0) {
                throw new Error('Usuário não é organizador da comunidade');
            }

            const { data, error } = await supabase
                .from('community_members')
                .insert(
                    playerIds.map(playerId => ({
                        community_id: communityId,
                        player_id: playerId
                    }))
                )
                .select(`
                    *,
                    players (
                        id,
                        name
                    )
                `);

            if (error) {
                console.error('Erro ao inserir membros:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Erro ao adicionar membros:', error);
            throw error;
        }
    },

    async removeMember(communityId: string, playerId: string) {
        try {
            const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('community_id', communityId)
                .eq('player_id', playerId);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao remover membro:', error);
            throw error;
        }
    },

    async isMember(communityId: string, playerId: string) {
        try {
            const { data, error } = await supabase
                .from('community_members')
                .select('id')
                .eq('community_id', communityId)
                .eq('player_id', playerId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return !!data;
        } catch (error) {
            console.error('Erro ao verificar membro:', error);
            throw error;
        }
    }
};
