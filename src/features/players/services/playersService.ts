import { supabase } from '@/core/lib/supabase';
import { activityService } from '@/services/activityService';
import { normalizePhoneNumber } from './playerRpcService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface Player {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    nickname?: string | null;
    created_by: string;
    avatar_url?: string | null;
    isMine?: boolean;
    isPrimary?: boolean;
    isLinkedUser?: boolean;
    isPrimaryUser?: boolean;
    user_player_relations?: Array<{
        user_id: string;
        is_primary: boolean;
    }>;
}

interface RelatedPlayerResponse {
    player: Player;
    is_primary: boolean;
}

interface CommunityOrganizerResponse {
    community_id: string;
}

interface CommunityMemberResponse {
    player_id: string;
}

interface PlayersListResponse {
    myPlayers: Player[];
    communityPlayers: Player[];
}

export const playersService = {
    async list(): Promise<PlayersListResponse> {
        try {
            console.log('Buscando jogadores...');
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user?.id) {
                console.error('Erro ao obter usuário:', userError?.message || 'Usuário não autenticado');
                throw new Error('Erro ao carregar jogadores: usuário não autenticado');
            }
            
            const userId = user.id;
            
            // 1. Busca os jogadores ativos criados pelo usuário
            const { data: createdPlayers, error: createdError } = await supabase
                .from('players')
                .select('*')
                .eq('created_by', userId)
                .eq('is_active', true) // Filtra apenas jogadores ativos
                
            if (createdError) {
                console.error('Erro ao buscar jogadores criados:', createdError);
                throw createdError;
            }
            
            const typedCreatedPlayers = createdPlayers as Player[] | null;
            
            // 2. Busca os jogadores ativos vinculados ao usuário através da tabela user_player_relations
            const { data: relatedPlayers, error: relatedError } = await supabase
                .from('user_player_relations')
                .select('player:players!inner(*), is_primary')
                .eq('user_id', userId)
                .eq('players.is_active', true) // Filtra apenas jogadores ativos
                
            if (relatedError) {
                console.error('Erro ao buscar jogadores relacionados:', relatedError);
                throw relatedError;
            }
            
            const typedRelatedPlayers = relatedPlayers as Array<{ player: Player; is_primary: boolean }> | null;
            
            // 3. Busca as comunidades onde o usuário é organizador
            const { data: organizedCommunities, error: communitiesError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', userId);
                
            if (communitiesError) {
                console.error('Erro ao buscar comunidades organizadas:', communitiesError);
                throw communitiesError;
            }
            
            const typedOrganizedCommunities = organizedCommunities as Array<{ community_id: string }> | null;
            
            // 4. Busca os jogadores das comunidades onde o usuário é organizador
            let communityPlayers: Player[] = [];
            if (typedOrganizedCommunities && typedOrganizedCommunities.length > 0) {
                const communityIds = typedOrganizedCommunities.map(c => c.community_id);
                
                // Busca os membros das comunidades
                const { data: communityMembers, error: membersError } = await supabase
                    .from('community_members')
                    .select('player_id')
                    .in('community_id', communityIds);
                    
                if (membersError) {
                    console.error('Erro ao buscar membros da comunidade:', membersError);
                    throw membersError;
                }
                
                const typedCommunityMembers = communityMembers as Array<{ player_id: string }> | null;
                
                if (typedCommunityMembers && typedCommunityMembers.length > 0) {
                    const playerIds = [...new Set(typedCommunityMembers.map(m => m.player_id))];
                    // Busca os detalhes dos jogadores ativos
                    const { data: players, error: playersError } = await supabase
                        .from('players')
                        .select('*')
                        .in('id', playerIds)
                        .eq('is_active', true); // Filtra apenas jogadores ativos
                        
                    if (playersError) {
                        console.error('Erro ao buscar jogadores da comunidade:', playersError);
                        throw playersError;
                    }
                    
                    communityPlayers = (players as Player[]) || [];
                }
            }
            
            // Combina os jogadores criados e relacionados
            const myPlayerIds = new Set([
                ...(typedCreatedPlayers?.map(p => p.id) || []),
                ...(typedRelatedPlayers?.map(r => r.player?.id).filter((id): id is string => !!id) || [])
            ]);
            
            const myPlayers = [
                ...(typedCreatedPlayers || []).map(p => ({
                    ...p,
                    isMine: true,
                    isPrimary: p.created_by === userId
                })),
                ...(typedRelatedPlayers || [])
                    .filter((r): r is { player: Player; is_primary: boolean } => !!r.player && !myPlayerIds.has(r.player.id))
                    .map(r => ({
                        ...r.player,
                        isMine: true,
                        isPrimary: r.is_primary
                    }))
            ] as Player[];
            
            // Remove os jogadores que já estão em myPlayers da lista de comunidade
            const myPlayerIdSet = new Set(myPlayers.map(p => p.id));
            const filteredCommunityPlayers = communityPlayers
                .filter((p: Player) => !myPlayerIdSet.has(p.id))
                .map((p: Player) => ({
                    ...p,
                    isMine: false,
                    isPrimary: false
                }));

            console.log(`Encontrados ${myPlayers.length} jogadores do usuário e ${filteredCommunityPlayers.length} da comunidade`);
            
            return {
                myPlayers,
                communityPlayers: filteredCommunityPlayers
            };
        } catch (error) {
            console.error('Erro ao listar jogadores:', error);
            throw error;
        }
    },

    async getPlayer(id: string): Promise<Player> {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user?.id) {
                throw new Error('Usuário não autenticado');
            }
            
            const { data, error } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations!left(
                        user_id,
                        is_primary
                    )
                `)
                .eq('id', id)
                .single() as { data: Player | null, error: any };

            if (error || !data) {
                throw error || new Error('Jogador não encontrado');
            }
            
            // Adiciona informações adicionais úteis
            const userPlayerRelations = data.user_player_relations || [];
            const isMine = data.created_by === user.id || 
                         userPlayerRelations.some(rel => rel.user_id === user.id);
            
            const isPrimary = userPlayerRelations.some(rel => 
                rel.is_primary && rel.user_id === user.id
            );
            
            return {
                ...data,
                isMine,
                isPrimary,
                user_player_relations: userPlayerRelations
            };
        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            throw error;
        }
    },

    async createPlayer(data: { name: string; phone: string; nickname?: string; avatar_url?: string }): Promise<Player> {
        try {
            console.log('Iniciando criação de jogador:', data);
            
            // Normaliza o telefone
            const normalizedPhone = normalizePhoneNumber(data.phone);
            
            if (!normalizedPhone || normalizedPhone.length < 10) {
                throw new Error('Número de telefone inválido');
            }
            
            // Verifica se já existe um jogador com este telefone
            const { data: existingPlayer, error: findError } = await supabase
                .from('players')
                .select('*')
                .eq('phone', normalizedPhone)
                .maybeSingle() as { data: Player | null, error: any };
                
            if (findError) {
                console.error('Erro ao verificar jogador existente:', findError);
                throw findError;
            }
            
            if (existingPlayer) {
                console.log('Jogador já existe:', existingPlayer);
                return existingPlayer;
            }

            // Obtém o ID do usuário autenticado
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Cria o novo jogador
            const { data: player, error: playerError } = await supabase
                .from('players')
                .insert([{ 
                    name: data.name,
                    phone: normalizedPhone,
                    nickname: data.nickname || null,
                    avatar_url: data.avatar_url || null,
                    created_by: user.id
                }])
                .select()
                .single() as { data: Player | null, error: any };

            if (playerError) {
                console.error('Erro ao criar jogador:', playerError);
                throw playerError;
            }

            console.log('Jogador criado com sucesso:', player);

            if (!player) {
                throw new Error('Falha ao criar jogador');
            }

            // Registrar a atividade de criação do jogador com sistema de retry
            const maxRetries = 3;
            const baseDelay = 1000; // 1 segundo

            const createActivityWithRetry = async (attempt: number): Promise<boolean> => {
                try {
                    console.log(`Tentativa ${attempt} de criar atividade...`);
                    await activityService.createActivity({
                        type: 'player',
                        description: `Novo jogador "${data.name}" foi criado`,
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
                        await new Promise<void>(resolve => setTimeout(resolve, delay));
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

            return player;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    },

    async updatePlayer(id: string, data: { name?: string; phone?: string; nickname?: string | null; avatar_url?: string | null }): Promise<Player> {
        try {
            // Verifica autenticação
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user?.id) {
                throw new Error('Usuário não autenticado');
            }

            // Normaliza o telefone se fornecido
            const updateData: any = { ...data };
            if (data.phone) {
                updateData.phone = normalizePhoneNumber(data.phone);
                
                // Verifica se já existe outro jogador com este telefone
                const { data: existingPlayer, error: findError } = await supabase
                    .from('players')
                    .select('id')
                    .eq('phone', updateData.phone)
                    .neq('id', id)
                    .maybeSingle() as { data: { id: string } | null, error: any };
                    
                if (findError) {
                    console.error('Erro ao verificar telefone existente:', findError);
                    throw findError;
                }
                
                if (existingPlayer) {
                    throw new Error('Já existe um jogador com este número de telefone');
                }
            }

            // Atualiza o jogador
            const { data: updatedPlayer, error } = await supabase
                .from('players')
                .update(updateData)
                .eq('id', id)
                .select('*')
                .single() as { data: Player | null, error: any };
                
            if (!updatedPlayer) {
                throw new Error('Falha ao atualizar jogador');
            }

            if (error) throw error;

            // Registra a atividade em segundo plano
            activityService.createActivity({
                type: 'player',
                description: `Dados do jogador "${updatedPlayer.name}" foram atualizados`,
                metadata: {
                    player_id: updatedPlayer.id,
                    // Usando o campo name para armazenar os campos atualizados
                    name: `Campos atualizados: ${Object.keys(updateData).join(', ')}`
                }
            }).catch(error => {
                console.error('Erro ao registrar atividade de atualização:', error);
            });

            return updatedPlayer;
        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            throw error;
        }
    },

    async deletePlayer(id: string): Promise<boolean> {
        try {
            console.log(`Iniciando exclusão do jogador ${id}...`);
            
            // 1. Primeiro obtém os dados do jogador para registrar a atividade
            const { data: player, error: fetchError } = await supabase
                .from('players')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !player) {
                console.error('Erro ao buscar jogador para exclusão:', fetchError);
                throw fetchError || new Error('Jogador não encontrado');
            }

            console.log(`Removendo relações do jogador ${player.name} (${id})...`);
            
            // 2. Remove todas as relações do jogador
            const tablesToClean = [
                'user_player_relations',
                'community_members',
                'game_players',
                'competition_players'
            ];

            // Executa todas as operações de limpeza em paralelo
            await Promise.all(tablesToClean.map(async (table) => {
                const { error } = await supabase
                    .from(table)
                    .delete()
                    .or(`player_id.eq.${id},user_id.eq.${id}`);
                
                if (error) {
                    console.warn(`Aviso ao limpar tabela ${table}:`, error.message);
                } else {
                    console.log(`Tabela ${table} limpa com sucesso para o jogador ${id}`);
                }
            }));

            console.log(`Marcando jogador ${player.name} (${id}) como inativo...`);
            
            // 3. Marca o jogador como inativo (soft delete)
            const { error: updateError } = await supabase
                .from('players')
                .update({ is_active: false })
                .eq('id', id);

            if (updateError) {
                console.error('Erro ao marcar jogador como inativo:', updateError);
                throw updateError;
            }

            console.log(`Jogador ${player.name} (${id}) marcado como inativo com sucesso`);
            
            // 4. Registra a atividade em segundo plano
            activityService.createActivity({
                type: 'player',
                description: `Jogador "${player.name}" foi removido`,
                metadata: {
                    player_id: id,
                    name: player.name
                }
            }).catch(error => {
                console.error('Erro ao registrar atividade de remoção:', error);
            });

            return true;
        } catch (error) {
            console.error('Erro ao remover jogador:', error);
            throw error instanceof Error ? error : new Error('Erro ao remover jogador');
        }
    },

    async uploadAvatar(playerId: string, uri: string): Promise<string> {
        try {
            console.log('Iniciando upload do avatar para o jogador:', playerId);
            
            // Verifica se a URI é uma imagem base64 (web) ou um caminho de arquivo (mobile)
            const isWeb = Platform.OS === 'web';
            let base64Data = '';
            
            if (isWeb) {
                // Para web, a imagem já deve vir em base64
                console.log('Processando imagem da web');
                base64Data = uri.split(',')[1];
            } else {
                // Para mobile, lê o arquivo e converte para base64
                console.log('Processando imagem do mobile, URI:', uri);
                const fileInfo = await FileSystem.getInfoAsync(uri);
                console.log('Informações do arquivo:', fileInfo);
                
                if (!fileInfo.exists) {
                    throw new Error('Arquivo de imagem não encontrado');
                }
                
                const base64 = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                base64Data = base64;
                console.log('Imagem convertida para base64 com sucesso');
            }
            
            if (!base64Data) {
                throw new Error('Não foi possível processar a imagem');
            }
            
            // Define o caminho no storage do Supabase
            const fileExt = 'jpg';
            const fileName = `${playerId}-${Date.now()}.${fileExt}`;
            const contentType = 'image/jpeg';
            
            console.log('Convertendo base64 para ArrayBuffer...');
            // Converte base64 para ArrayBuffer
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const arrayBuffer = bytes.buffer;
            
            console.log('Tentando fazer upload para o bucket player-avatars com o arquivo:', fileName);
            
            // Tenta fazer o upload com um caminho diferente
            let uploadResult;
            
            try {
                // Primeira tentativa: usando o nome do arquivo diretamente
                uploadResult = await supabase.storage
                    .from('player-avatars')
                    .upload(fileName, arrayBuffer, {
                        contentType,
                        upsert: true,
                        cacheControl: '3600'
                    });
                    
                console.log('Resultado da primeira tentativa:', uploadResult);
                
                // Se falhou, tenta com um caminho diferente
                if (uploadResult.error && uploadResult.error.toString().includes('Bucket not found')) {
                    console.log('Tentando upload com bucket alternativo...');
                    
                    // Tenta com o bucket padrão 'avatars' se existir
                    uploadResult = await supabase.storage
                        .from('avatars')
                        .upload(`players/${fileName}`, arrayBuffer, {
                            contentType,
                            upsert: true,
                            cacheControl: '3600'
                        });
                        
                    console.log('Resultado da segunda tentativa:', uploadResult);
                }
            } catch (e) {
                console.error('Erro inesperado durante o upload:', e);
                uploadResult = { error: e, data: null };
            }
            
            const { data: uploadData, error: uploadError } = uploadResult;
            
            console.log('Resultado do upload:', uploadData);
            
            if (uploadError) {
                console.error('Erro ao fazer upload para o storage:', uploadError);
                throw new Error('Falha ao enviar a imagem');
            }
            
            // Obtém a URL pública da imagem
            console.log('Obtendo URL pública da imagem...');
            let publicUrl = '';
            
            if (uploadError && uploadError.toString().includes('Bucket not found')) {
                // Se o upload foi para o bucket alternativo
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(`players/${fileName}`);
                publicUrl = data.publicUrl;
            } else {
                // Se o upload foi para o bucket original
                const { data } = supabase.storage
                    .from('player-avatars')
                    .getPublicUrl(fileName);
                publicUrl = data.publicUrl;
            }
            
            console.log('URL pública obtida:', publicUrl);
            
            if (!publicUrl) {
                throw new Error('Não foi possível obter a URL pública da imagem');
            }
            
            // Atualiza o jogador com a nova URL do avatar
            console.log('Atualizando jogador com a nova URL do avatar...');
            const { error: updateError } = await supabase
                .from('players')
                .update({ avatar_url: publicUrl })
                .eq('id', playerId);
            
            if (updateError) {
                console.error('Erro ao atualizar o jogador com o novo avatar:', updateError);
                throw new Error('Falha ao atualizar o perfil do jogador');
            }
            
            console.log('Avatar atualizado com sucesso:', publicUrl);
            return publicUrl;
            
        } catch (error) {
            console.error('Erro ao fazer upload do avatar:', error);
            throw error;
        }
    }
};
