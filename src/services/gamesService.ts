import { supabase } from '@/lib/supabase';

export type GameWithDetails = {
    id: string;
    team1_score: number;
    team2_score: number;
    status: string;
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
    created_at: string;
    competition: {
        id: string;
        name: string;
        community: {
            id: string;
            name: string;
        };
    };
    team1_players: {
        id: string;
        name: string;
    }[];
    team2_players: {
        id: string;
        name: string;
    }[];
};

export const gamesService = {
    async getUserGames(): Promise<GameWithDetails[]> {
        try {
            // Verificar usuário autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Erro de autenticação:', userError);
                throw new Error('Usuário não autenticado');
            }

            console.log('Buscando jogos para o usuário:', user.id);

            // Buscar comunidades onde o usuário é membro
            const { data: memberCommunities, error: memberError } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('player_id', user.id);

            if (memberError) {
                console.error('Erro ao buscar comunidades como membro:', memberError);
                throw new Error('Erro ao buscar comunidades do usuário');
            }

            // Buscar comunidades onde o usuário é organizador
            const { data: organizerCommunities, error: organizerError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', user.id);

            if (organizerError) {
                console.error('Erro ao buscar comunidades como organizador:', organizerError);
                throw new Error('Erro ao buscar comunidades do usuário');
            }

            // Combinar IDs únicos de comunidades
            const memberIds = memberCommunities?.map(c => c.community_id) || [];
            const organizerIds = organizerCommunities?.map(c => c.community_id) || [];
            const communityIds = [...new Set([...memberIds, ...organizerIds])];

            if (communityIds.length === 0) {
                console.log('Nenhuma comunidade encontrada');
                return [];
            }

            console.log('Buscando jogos para as comunidades:', communityIds);

            // Primeiro buscar as competições das comunidades
            const { data: competitions, error: competitionsError } = await supabase
                .from('competitions')
                .select('id, name, community_id')
                .in('community_id', communityIds);

            if (competitionsError) {
                console.error('Erro ao buscar competições:', competitionsError);
                throw new Error('Erro ao buscar competições');
            }

            if (!competitions || competitions.length === 0) {
                console.log('Nenhuma competição encontrada');
                return [];
            }

            const competitionIds = competitions.map(c => c.id);

            // Buscar os jogos com os detalhes
            const { data: games, error: gamesError } = await supabase
                .from('games')
                .select(`
                    *,
                    competition:competitions!inner (
                        id,
                        name,
                        community_id
                    )
                `)
                .in('competition_id', competitionIds)
                .order('created_at', { ascending: false });

            if (gamesError) {
                console.error('Erro ao buscar jogos:', gamesError);
                throw new Error('Erro ao buscar jogos');
            }

            if (!games || games.length === 0) {
                console.log('Nenhum jogo encontrado');
                return [];
            }

            // Buscar os jogadores dos jogos
            const { data: gamePlayers, error: playersError } = await supabase
                .from('game_players')
                .select('*')
                .in('game_id', games.map(g => g.id));

            if (playersError) {
                console.error('Erro ao buscar jogadores:', playersError);
                throw new Error('Erro ao buscar jogadores');
            }

            // Buscar todas as comunidades relacionadas de uma vez
            const uniqueCommunityIds = competitions.map(c => c.community_id);
            const { data: communities, error: communitiesError } = await supabase
                .from('communities')
                .select('id, name')
                .in('id', uniqueCommunityIds);

            if (communitiesError) {
                console.error('Erro ao buscar comunidades:', communitiesError);
                throw new Error('Erro ao buscar comunidades');
            }

            // Mapear os jogos com todos os detalhes
            const gamesWithDetails = games.map(game => {
                const competition = competitions.find(c => c.id === game.competition.id);
                const community = communities?.find(c => c.id === competition?.community_id);
                const gamePlayersList = gamePlayers?.filter(gp => gp.game_id === game.id) || [];
                const team1Players = gamePlayersList
                    .filter(gp => gp.team === 1)
                    .map(gp => ({
                        id: gp.player_id,
                        name: gp.player_name
                    }));
                const team2Players = gamePlayersList
                    .filter(gp => gp.team === 2)
                    .map(gp => ({
                        id: gp.player_id,
                        name: gp.player_name
                    }));

                return {
                    ...game,
                    competition: {
                        ...game.competition,
                        community: {
                            id: competition?.community_id || '',
                            name: community?.name || 'Comunidade'
                        }
                    },
                    team1_players: team1Players,
                    team2_players: team2Players
                };
            });

            console.log('Jogos encontrados:', gamesWithDetails.length);
            return gamesWithDetails;
        } catch (error) {
            console.error('Erro no serviço de jogos:', error);
            throw error;
        }
    }
};
