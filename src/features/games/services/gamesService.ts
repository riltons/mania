import { supabase } from '@/core/lib/supabase';

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

            // 1. Buscar comunidades onde o usuário é membro
            const { data: memberCommunities, error: memberError } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('player_id', user.id);

            if (memberError) {
                console.error('Erro ao buscar comunidades como membro:', memberError);
                throw new Error('Erro ao buscar comunidades do usuário');
            }

            // 2. Buscar comunidades onde o usuário é organizador
            const { data: organizerCommunities, error: organizerError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', user.id);

            if (organizerError) {
                console.error('Erro ao buscar comunidades como organizador:', organizerError);
                throw new Error('Erro ao buscar comunidades do organizador');
            }

            // Combinar IDs de comunidades únicas
            const memberIds = memberCommunities?.map(c => c.community_id) || [];
            const organizerIds = organizerCommunities?.map(c => c.community_id) || [];
            const allCommunityIds = [...new Set([...memberIds, ...organizerIds])];

            if (allCommunityIds.length === 0) {
                console.log('Usuário não está em nenhuma comunidade');
                return [];
            }

            console.log('Comunidades do usuário:', allCommunityIds);

            // 3. Buscar competições das comunidades do usuário
            const { data: competitions, error: competitionsError } = await supabase
                .from('competitions')
                .select('*')
                .in('community_id', allCommunityIds);

            if (competitionsError) {
                console.error('Erro ao buscar competições:', competitionsError);
                throw new Error('Erro ao buscar competições');
            }

            if (!competitions || competitions.length === 0) {
                console.log('Nenhuma competição encontrada nas comunidades do usuário');
                return [];
            }

            const competitionIds = competitions.map(c => c.id);
            console.log('Competições encontradas:', competitionIds);

            // 4. Buscar jogos das competições
            const { data: games, error: gamesError } = await supabase
                .from('games')
                .select(`
                    *,
                    competition:competitions (
                        *,
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

            const gameIds = games.map(g => g.id);
            console.log('Buscando jogadores para os jogos:', gameIds);
            
            // 5. Buscar jogadores dos jogos
            const { data: gamePlayers, error: playersError } = await supabase
                .from('game_players')
                .select(`
                    *,
                    player:players (
                        id,
                        name
                    )
                `)
                .in('game_id', gameIds);

            if (playersError) {
                console.error('Erro ao buscar jogadores:', playersError);
                throw new Error('Erro ao buscar jogadores');
            }
            
            console.log('Jogadores encontrados na tabela game_players:', gamePlayers);
            
            // 6. Se não encontrou jogadores, tentar buscar diretamente da tabela players
            if (!gamePlayers || gamePlayers.length === 0) {
                console.warn('Nenhum jogador encontrado na tabela game_players para os jogos:', gameIds);
                
                const { data: allPlayers, error: allPlayersError } = await supabase
                    .from('players')
                    .select('*')
                    .limit(5);
                    
                if (allPlayersError) {
                    console.error('Erro ao buscar todos os jogadores:', allPlayersError);
                } else {
                    console.log('Amostra de jogadores da tabela players:', allPlayers);
                }
            }
            
            // Garantir que as variáveis estejam definidas
            const safeGamePlayers = gamePlayers || [];
            const safeCompetitions = competitions || [];
            const safeGames = games || [];

            // 7. Mapear os jogos para o formato de saída
            const gamesWithDetails: GameWithDetails[] = safeGames.map((game) => {
                try {
                    // Filtrar jogadores por time
                    const team1Players = safeGamePlayers
                        .filter((gp) => gp.game_id === game.id && gp.team === 1)
                        .map((gp) => ({
                            id: gp.player?.id || '',
                            name: gp.player?.name || `Jogador ${gp.player_id}`
                        }));

                    const team2Players = safeGamePlayers
                        .filter((gp) => gp.game_id === game.id && gp.team === 2)
                        .map((gp) => ({
                            id: gp.player?.id || '',
                            name: gp.player?.name || `Jogador ${gp.player_id}`
                        }));

                    // Encontrar a competição correspondente
                    const competition = safeCompetitions.find((c) => c.id === game.competition_id);
                    
                    return {
                        ...game,
                        competition: {
                            id: competition?.id || '',
                            name: competition?.name || 'Competição desconhecida',
                            community: {
                                id: competition?.community_id || '',
                                name: competition?.community_name || 'Comunidade desconhecida'
                            }
                        },
                        team1_players: team1Players.length > 0 ? team1Players : [
                            { id: '1', name: 'Jogador 1' },
                            { id: '2', name: 'Jogador 2' }
                        ],
                        team2_players: team2Players.length > 0 ? team2Players : [
                            { id: '3', name: 'Jogador 3' },
                            { id: '4', name: 'Jogador 4' }
                        ]
                    };
                } catch (error: unknown) {
                    console.error(`Erro ao processar jogo ${game.id}:`, error);
                    // Retornar um jogo com dados padrão em caso de erro
                    return {
                        ...game,
                        competition: {
                            id: '',
                            name: 'Erro ao carregar competição',
                            community: {
                                id: '',
                                name: 'Erro ao carregar comunidade'
                            }
                        },
                        team1_players: [
                            { id: '1', name: 'Jogador 1' },
                            { id: '2', name: 'Jogador 2' }
                        ],
                        team2_players: [
                            { id: '3', name: 'Jogador 3' },
                            { id: '4', name: 'Jogador 4' }
                        ]
                    };
                }
            });

            return gamesWithDetails;
        } catch (error: unknown) {
            console.error('Erro no serviço de jogos:', error);
            throw error;
        }
    }
};

