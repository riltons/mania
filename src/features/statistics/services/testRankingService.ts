import { supabase } from '@/core/lib/supabase';

// Função de teste para verificar se os dados estão sendo retornados
export const testRankingData = async () => {
    console.log('[TestRanking] Iniciando teste de dados...');
    
    try {
        // Verificar usuário autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.log('[TestRanking] Usuário não autenticado:', userError);
            return;
        }
        
        console.log('[TestRanking] Usuário autenticado:', userData.user.id);
        
        // Verificar comunidades do usuário
        const { data: memberCommunities, error: memberError } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', userData.user.id);
            
        const { data: ownedCommunities, error: ownedError } = await supabase
            .from('communities')
            .select('id')
            .eq('created_by', userData.user.id);
            
        console.log('[TestRanking] Comunidades como membro:', memberCommunities?.length || 0);
        console.log('[TestRanking] Comunidades próprias:', ownedCommunities?.length || 0);
        
        const memberCommunityIds = memberCommunities?.map(m => m.community_id) || [];
        const ownedCommunityIds = ownedCommunities?.map(c => c.id) || [];
        const allCommunityIds = [...new Set([...memberCommunityIds, ...ownedCommunityIds])];
        
        console.log('[TestRanking] Total de comunidades:', allCommunityIds.length);
        console.log('[TestRanking] IDs das comunidades:', allCommunityIds);
        
        if (allCommunityIds.length === 0) {
            console.log('[TestRanking] Nenhuma comunidade encontrada');
            return;
        }
        
        // Verificar jogos
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('id, team1, team2, team1_score, team2_score, status, community_id')
            .in('community_id', allCommunityIds);
            
        console.log('[TestRanking] Total de jogos:', games?.length || 0);
        
        const finishedGames = games?.filter(g => ['finished', 'buchuda', 'buchuda_de_re'].includes(g.status)) || [];
        console.log('[TestRanking] Jogos finalizados:', finishedGames.length);
        
        // Verificar jogadores
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('id, name, avatar_url, is_active')
            .eq('is_active', true);
            
        console.log('[TestRanking] Jogadores ativos:', players?.length || 0);
        
        // Verificar estrutura dos jogos
        if (finishedGames.length > 0) {
            console.log('[TestRanking] Exemplo de jogo:', {
                id: finishedGames[0].id,
                team1: finishedGames[0].team1,
                team2: finishedGames[0].team2,
                team1_score: finishedGames[0].team1_score,
                team2_score: finishedGames[0].team2_score,
                status: finishedGames[0].status
            });
        }
        
    } catch (error) {
        console.error('[TestRanking] Erro no teste:', error);
    }
};
