import { supabase } from '@/core/lib/supabase';

export interface SharedPlayer {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    nickname?: string | null;
    created_by: string;
    avatar_url?: string | null;
    isCreatedByOtherUser?: boolean;
    sharedPlayer?: boolean;
    shared_by_email?: string | null;
    shared_at?: string | null;
}

export const sharedPlayersService = {
    /**
     * Busca jogadores compartilhados com o usuário atual
     * @returns Lista de jogadores compartilhados com informações adicionais
     */
    async getSharedPlayers(): Promise<SharedPlayer[]> {
        try {
            // Obter o usuário atual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('Erro ao obter usuário:', userError);
                throw new Error('Você precisa estar logado para ver jogadores compartilhados');
            }
            
            // Usar a função RPC para buscar jogadores compartilhados com informações adicionais
            const { data: sharedPlayers, error: fetchError } = await supabase
                .rpc('get_shared_players_with_details', { p_user_id: user.id });
            
            if (fetchError) {
                console.error('Erro ao buscar jogadores compartilhados:', fetchError);
                throw new Error('Não foi possível carregar os jogadores compartilhados');
            }
            
            // Processar os jogadores compartilhados
            const processedPlayers = (sharedPlayers || []).map((player: any) => ({
                ...player,
                isCreatedByOtherUser: true,
                sharedPlayer: true
            }));
            
            return processedPlayers;
        } catch (error) {
            console.error('Erro ao carregar jogadores compartilhados:', error);
            throw error instanceof Error ? error : new Error('Ocorreu um erro ao carregar os jogadores compartilhados');
        }
    },
    
    /**
     * Compartilha um jogador com outro usuário
     * @param playerId ID do jogador a ser compartilhado
     * @param targetUserId ID do usuário com quem o jogador será compartilhado
     * @param isPrimary Define se o jogador será definido como primário para o usuário
     */
    async sharePlayer(playerId: string, targetUserId: string, isPrimary: boolean = false): Promise<void> {
        try {
            // Validar parâmetros
            if (!playerId || !targetUserId) {
                throw new Error('ID do jogador e do usuário de destino são obrigatórios');
            }
            
            // Obter o usuário atual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('Erro ao obter usuário:', userError);
                throw new Error('Você precisa estar logado para compartilhar um jogador');
            }
            
            // Verificar se o jogador pertence ao usuário atual
            const { data: player, error: playerError } = await supabase
                .from('players')
                .select('created_by')
                .eq('id', playerId)
                .single();
                
            if (playerError || !player) {
                console.error('Jogador não encontrado:', playerError);
                throw new Error('Jogador não encontrado');
            }
            
            if (player.created_by !== user.id) {
                throw new Error('Você só pode compartilhar jogadores que você criou');
            }
            
            // Verificar se o usuário de destino existe
            const { data: targetUser, error: targetUserError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', targetUserId)
                .single();
                
            if (targetUserError || !targetUser) {
                console.error('Usuário de destino não encontrado:', targetUserError);
                throw new Error('Usuário de destino não encontrado');
            }
            
            // Verificar se o jogador já está compartilhado com o usuário
            const { data: existingRelation, error: relationCheckError } = await supabase
                .from('user_player_relations')
                .select('*')
                .eq('user_id', targetUserId)
                .eq('player_id', playerId);
                
            if (relationCheckError) {
                console.error('Erro ao verificar relação existente:', relationCheckError);
                throw new Error('Não foi possível verificar se o jogador já está compartilhado');
            }
            
            if (existingRelation && existingRelation.length > 0) {
                throw new Error('Este jogador já está compartilhado com o usuário');
            }
            
            // Compartilhar o jogador usando uma função RPC para garantir a consistência
            const { error: shareError } = await supabase.rpc('share_player_with_user', {
                p_player_id: playerId,
                p_target_user_id: targetUserId,
                p_is_primary: isPrimary,
                p_shared_by: user.id
            });
            
            if (shareError) {
                console.error('Erro ao compartilhar jogador:', shareError);
                throw new Error(shareError.message || 'Não foi possível compartilhar o jogador');
            }
            
        } catch (error) {
            console.error('Erro ao compartilhar jogador:', error);
            throw error instanceof Error ? error : new Error('Ocorreu um erro ao compartilhar o jogador');
        }
    },
    
    /**
     * Remove o compartilhamento de um jogador com um usuário
     * @param playerId ID do jogador
     * @param targetUserId ID do usuário com quem o compartilhamento será removido
     */
    async unsharePlayer(playerId: string, targetUserId: string): Promise<void> {
        try {
            // Validar parâmetros
            if (!playerId || !targetUserId) {
                throw new Error('ID do jogador e do usuário são obrigatórios');
            }
            
            // Obter o usuário atual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('Erro ao obter usuário:', userError);
                throw new Error('Você precisa estar logado para gerenciar compartilhamentos');
            }
            
            // Verificar se o jogador pertence ao usuário atual
            const { data: player, error: playerError } = await supabase
                .from('players')
                .select('created_by')
                .eq('id', playerId)
                .single();
                
            if (playerError || !player) {
                console.error('Jogador não encontrado:', playerError);
                throw new Error('Jogador não encontrado');
            }
            
            if (player.created_by !== user.id) {
                throw new Error('Você só pode remover o compartilhamento de jogadores que você criou');
            }
            
            // Remover o compartilhamento
            const { error: deleteError } = await supabase
                .from('user_player_relations')
                .delete()
                .eq('user_id', targetUserId)
                .eq('player_id', playerId);
                
            if (deleteError) {
                console.error('Erro ao remover compartilhamento:', deleteError);
                throw new Error('Não foi possível remover o compartilhamento');
            }
            
            // Se o jogador era o principal do usuário, definir outro jogador como principal
            const { data: userPlayers, error: playersError } = await supabase
                .from('user_player_relations')
                .select('player_id')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: true })
                .limit(1);
                
            if (playersError) {
                console.error('Erro ao verificar jogadores do usuário:', playersError);
                // Não interromper o fluxo, apenas registrar o erro
                return;
            }
            
            // Se o usuário tiver outros jogadores, definir o mais antigo como principal
            if (userPlayers && userPlayers.length > 0) {
                const { error: updateError } = await supabase
                    .from('user_player_relations')
                    .update({ is_primary: true })
                    .eq('user_id', targetUserId)
                    .eq('player_id', userPlayers[0].player_id);
                    
                if (updateError) {
                    console.error('Erro ao definir novo jogador principal:', updateError);
                    // Não interromper o fluxo, apenas registrar o erro
                }
            }
            
        } catch (error) {
            console.error('Erro ao remover compartilhamento:', error);
            throw error instanceof Error ? error : new Error('Ocorreu um erro ao remover o compartilhamento');
        }
    },
    
    /**
     * Lista os usuários com quem um jogador está compartilhado
     * @param playerId ID do jogador
     * @returns Lista de usuários com quem o jogador está compartilhado
     */
    async listSharedWith(playerId: string): Promise<Array<{ id: string; email: string; shared_at: string }>> {
        try {
            // Validar parâmetros
            if (!playerId) {
                throw new Error('ID do jogador é obrigatório');
            }
            
            // Obter o usuário atual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('Erro ao obter usuário:', userError);
                throw new Error('Você precisa estar logado para ver com quem o jogador está compartilhado');
            }
            
            // Verificar se o jogador pertence ao usuário atual
            const { data: player, error: playerError } = await supabase
                .from('players')
                .select('created_by')
                .eq('id', playerId)
                .single();
                
            if (playerError || !player) {
                console.error('Jogador não encontrado:', playerError);
                throw new Error('Jogador não encontrado');
            }
            
            if (player.created_by !== user.id) {
                throw new Error('Você só pode ver os compartilhamentos de jogadores que você criou');
            }
            
            // Buscar usuários com quem o jogador está compartilhado
            const { data: sharedWith, error: sharedError } = await supabase
                .from('user_player_relations')
                .select('user_id, created_at, profiles!inner(email)')
                .eq('player_id', playerId)
                .neq('user_id', user.id);
                
            if (sharedError) {
                console.error('Erro ao buscar compartilhamentos:', sharedError);
                throw new Error('Não foi possível carregar os compartilhamentos');
            }
            
            // Processar os resultados
            return (sharedWith || []).map(item => ({
                id: item.user_id,
                email: item.profiles?.email || 'E-mail não disponível',
                shared_at: item.created_at
            }));
            
        } catch (error) {
            console.error('Erro ao listar compartilhamentos:', error);
            throw error instanceof Error ? error : new Error('Ocorreu um erro ao listar os compartilhamentos');
        }
    }
};
