import { supabase } from '@/lib/supabase';

export interface Activity {
    id: string;
    type: 'game' | 'competition' | 'community' | 'player';
    description: string;
    metadata?: {
        game_id?: string;
        competition_id?: string;
        community_id?: string;
        player_id?: string;
        score?: {
            team1: number;
            team2: number;
        };
        winners?: string[];
        name?: string;
        gamesCount?: number;
        isBuchuda?: boolean;
        isBuchudaDeRe?: boolean;
    };
    created_at?: Date;
    created_by?: string;
}

export const activityService = {
    async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'created_by'>) {
        try {
            console.log('Iniciando criação de atividade:', { type: activity.type, description: activity.description });
            
            // Verifica autenticação
            const { data: userData, error: authError } = await supabase.auth.getUser();
            if (authError) {
                console.error('Erro na autenticação:', authError);
                throw new Error('Erro na autenticação do usuário');
            }
            if (!userData.user) {
                console.error('Usuário não encontrado');
                throw new Error('Usuário não autenticado');
            }

            // Verifica conexão com o banco
            const { error: healthCheckError } = await supabase
                .from('activities')
                .select('id')
                .limit(1);

            if (healthCheckError) {
                console.error('Erro na conexão com o banco:', healthCheckError);
                throw new Error('Erro na conexão com o banco de dados');
            }

            console.log('Inserindo atividade no banco...');
            const { data, error } = await supabase
                .from('activities')
                .insert([
                    {
                        ...activity,
                        created_at: new Date(),
                        created_by: userData.user.id
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Erro ao inserir atividade:', error);
                throw new Error(`Erro ao inserir atividade: ${error.message}`);
            }

            console.log('Atividade criada com sucesso:', data);
            return data;
        } catch (error) {
            console.error('Erro detalhado ao criar atividade:', {
                error,
                message: error instanceof Error ? error.message : 'Erro desconhecido',
                activity
            });
            throw error;
        }
    },

    async getAllActivities(page: number = 1, pageSize: number = 20) {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from('activities')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Erro ao buscar atividades:', error);
                throw error;
            }

            // Remove possíveis duplicatas baseado no id
            const uniqueActivities = data ? Array.from(new Map(data.map(item => [item.id, item])).values()) : [];

            return {
                activities: uniqueActivities as Activity[],
                totalCount: count || 0,
                currentPage: page,
                pageSize,
                totalPages: count ? Math.ceil(count / pageSize) : 0
            };
        } catch (error) {
            console.error('Erro ao buscar atividades:', error);
            throw error;
        }
    },

    async getUserActivities(page: number = 1, pageSize: number = 20) {
        try {
            // Obter o usuário atual
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
                throw new Error('Usuário não autenticado');
            }
            
            const userId = userData.user.id;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            // Obter comunidades onde o usuário é organizador
            const { data: organizerData, error: organizerError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', userId);

            if (organizerError) {
                console.error('Erro ao buscar comunidades do organizador:', organizerError);
                throw organizerError;
            }

            // Obter comunidades onde o usuário é criador
            const { data: creatorData, error: creatorError } = await supabase
                .from('communities')
                .select('id')
                .eq('created_by', userId);

            if (creatorError) {
                console.error('Erro ao buscar comunidades do criador:', creatorError);
                throw creatorError;
            }

            // Combinar IDs de comunidades (organizador + criador)
            const communityIds = [
                ...(organizerData?.map(org => org.community_id) || []),
                ...(creatorData?.map(comm => comm.id) || [])
            ];

            // Buscar atividades onde o usuário é criador ou relacionadas às comunidades onde é organizador
            let query = supabase
                .from('activities')
                .select('*', { count: 'exact' })
                .or(`created_by.eq.${userId}${communityIds.length ? `,metadata->>'community_id'.in.(${communityIds.map(id => `"${id}"`).join(',')})` : ''}`);


            // Executar a query com ordenação e paginação
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Erro ao buscar atividades do usuário:', error);
                throw error;
            }

            // Remove possíveis duplicatas baseado no id
            const uniqueActivities = data ? Array.from(new Map(data.map(item => [item.id, item])).values()) : [];

            return {
                activities: uniqueActivities as Activity[],
                totalCount: count || 0,
                currentPage: page,
                pageSize,
                totalPages: count ? Math.ceil(count / pageSize) : 0
            };
        } catch (error) {
            console.error('Erro ao buscar atividades do usuário:', error);
            throw error;
        }
    },

    async getRecentActivities(page: number = 1, itemsPerPage: number = 5) {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Usuário não autenticado');
            }

            // Busca as comunidades onde o usuário é organizador
            const { data: organizerCommunities, error: organizerError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', user.id);

            if (organizerError) {
                throw organizerError;
            }

            const communityIds = organizerCommunities?.map(org => org.community_id) || [];

            // Calcula o offset baseado na página atual
            const offset = (page - 1) * itemsPerPage;

            // Busca atividades criadas pelo usuário e das comunidades onde é organizador
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .or(`created_by.eq.${user.id}${communityIds.length ? `,metadata->>'community_id'.in.(${communityIds.map(id => `"${id}"`).join(',')})` : ''}`)
                .order('created_at', { ascending: false })
                .range(offset, offset + itemsPerPage - 1);

            if (error) {
                console.error('Erro ao buscar atividades:', error);
                throw error;
            }

            return data.map(activity => ({
                ...activity,
                time: new Date(activity.created_at)
            }));
        } catch (error) {
            console.error('Erro ao carregar atividades recentes:', error);
            throw error;
        }
    },

    async registerGameCompletion(
        gameId: string, 
        winners: string[], 
        team1Score: number, 
        team2Score: number,
        isBuchuda: boolean = false,
        isBuchudaDeRe: boolean = false
    ) {
        let description = `Jogo finalizado com placar ${team1Score} x ${team2Score}`;
        if (isBuchuda) description += ' (Buchuda)';
        if (isBuchudaDeRe) description += ' (Buchuda de Ré)';

        return this.createActivity({
            type: 'game',
            description,
            metadata: {
                game_id: gameId,
                winners,
                score: {
                    team1: team1Score,
                    team2: team2Score
                },
                isBuchuda,
                isBuchudaDeRe
            }
        });
    },

    async registerNewCommunity(communityId: string, name: string) {
        await this.createActivity({
            type: 'community',
            description: `Nova comunidade "${name}" criada!`,
            metadata: {
                community_id: communityId
            }
        });
    },

    async registerNewCompetition(competitionId: string, name: string) {
        await this.createActivity({
            type: 'competition',
            description: `Nova competição "${name}" criada!`,
            metadata: {
                competition_id: competitionId
            }
        });
    },

    async registerPlayerMilestone(playerId: string, name: string, gamesCount: number) {
        await this.createActivity({
            type: 'player',
            description: `${name} completou ${gamesCount} jogos!`,
            metadata: {
                player_id: playerId,
                name,
                gamesCount
            }
        });
    }
};