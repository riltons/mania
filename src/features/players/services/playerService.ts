import { supabase, supabaseUrl, supabaseAnonKey } from '@/core/lib/supabase';
import { activityService } from '@/services/activityService';
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
        is_primary_user: boolean;
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

            if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
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
                    .insert([{ user_id: userData.user.id, player_id: existingPlayer.id }]);
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

            const { data: newPlayer, error } = await supabase
                .from('players')
                .insert([{
                    ...data,
                    created_by: userData.user.id
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Código do PostgreSQL para violação de UNIQUE
                    throw new Error('Já existe um jogador cadastrado com este telefone');
                }
                console.error('Erro ao criar jogador:', error);
                throw new Error('Erro ao criar jogador');
            }

            // Registrar a atividade de criação do jogador com sistema de retry
            if (newPlayer) {
                const maxRetries = 3;
                const baseDelay = 1000; // 1 segundo

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'player',
                            description: `Novo jogador "${data.name}" foi criado`,
                            metadata: {
                                player_id: newPlayer.id,
                                name: newPlayer.name
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

            // Atualiza a lista de jogadores em memória
            await this.list();

            return newPlayer;
        } catch (error) {
            console.error('Erro ao criar jogador:', error);
            throw error;
        }
    }

    async getPlayerStats(playerId: string): Promise<PlayerStats> {
        try {
            console.log(`Buscando estatísticas para o jogador ${playerId}`);
            
            // Buscar total de jogos
            const { count: totalGames, error: totalGamesError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact' })
                .eq('player_id', playerId);
            
            if (totalGamesError) {
                console.error('Erro ao buscar total de jogos:', totalGamesError);
                throw totalGamesError;
            }
            
            console.log(`Total de jogos para o jogador ${playerId}: ${totalGames || 0}`);
    
            // Buscar vitórias (quando o jogador está no time vencedor)
            // Verificamos se o time do jogador (1 ou 2) corresponde ao time vencedor do jogo
            const { data: wins, error: winsError } = await supabase
                .from('game_players')
                .select(`
                    id,
                    team,
                    games!inner (id, team1_score, team2_score, status)
                `)
                .eq('player_id', playerId)
                .eq('games.status', 'finished')
                .or('and(team.eq.1,games.team1_score.gte.6),and(team.eq.2,games.team2_score.gte.6)');
            
            if (winsError) {
                console.error('Erro ao buscar vitórias:', winsError);
                throw winsError;
            }
            
            console.log(`Jogador ${playerId}: ${wins?.length || 0} vitórias de ${totalGames || 0} jogos`);
            if (wins && wins.length > 0) {
                console.log('Detalhes das vitórias:', JSON.stringify(wins.slice(0, 2)));
            }
    
            // Buscar buchudas dadas (quando o jogador está no time vencedor e o jogo é uma buchuda)
            const { data: buchudas, error: buchudasError } = await supabase
                .from('game_players')
                .select(`
                    id,
                    team,
                    games!inner (id, is_buchuda, team1_score, team2_score)
                `)
                .eq('player_id', playerId)
                .eq('games.is_buchuda', true)
                .or('and(team.eq.1,games.team1_score.gte.6),and(team.eq.2,games.team2_score.gte.6)');
            
            if (buchudasError) {
                console.error('Erro ao buscar buchudas:', buchudasError);
                throw buchudasError;
            }
            
            console.log(`Jogador ${playerId}: ${buchudas?.length || 0} buchudas`);
    
            return {
                total_games: totalGames || 0,
                wins: wins?.length || 0,
                losses: (totalGames || 0) - (wins?.length || 0),
                buchudas: buchudas?.length || 0
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
            if (userError) throw userError;

            // Buscar jogadores criados pelo usuário
            const { data: myPlayers, error: myPlayersError } = await supabase
                .from('players')
                .select('*, user_player_relations(user_id, is_primary_user)')
                .eq('created_by', userData.user.id)
                .order('name');

            if (myPlayersError) {
                console.error('Erro ao buscar jogadores criados:', myPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Buscar jogadores das comunidades onde sou organizador
            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations(user_id, is_primary_user),
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
                .neq('created_by', userData.user.id) // Excluir jogadores que já estão em myPlayers
                .order('name');

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores da comunidade:', communityPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Processar jogadores com ou sem estatísticas dependendo do parâmetro
            if (fetchStats) {
                // Adicionar estatísticas aos jogadores
                const myPlayersWithStats = await Promise.all((myPlayers || []).map(async (player) => {
                    const stats = await this.getPlayerStats(player.id);
                    return {
                        ...player,
                        stats,
                        isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary_user),
                        isMine: true
                    };
                }));

                const communityPlayersWithStats = await Promise.all((communityPlayers || []).map(async (player) => {
                    const stats = await this.getPlayerStats(player.id);
                    return {
                        ...player,
                        stats,
                        isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary_user),
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
                    isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary_user),
                    isMine: true
                }));

                const communityPlayersWithoutStats = (communityPlayers || []).map(player => ({
                    ...player,
                    isLinkedUser: player.user_player_relations?.some(rel => rel.is_primary_user),
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
            // Verificar se a URI é válida
            if (!uri || typeof uri !== 'string') {
                throw new Error('URI da imagem inválida');
            }

            console.log('Iniciando upload de avatar com URI:', uri);
            
            // Processar a imagem com base na plataforma
            if (Platform.OS !== 'web') {
                try {
                    // Para URIs locais em dispositivos móveis, usamos o FileSystem do Expo
                    const fileInfo = await FileSystem.getInfoAsync(uri);
                    if (!fileInfo.exists) {
                        throw new Error('Arquivo de imagem não encontrado');
                    }
                    
                    console.log('Arquivo encontrado:', fileInfo);
                    
                    // Determinar a extensão do arquivo
                    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
                    const fileName = `${playerId}/${Date.now()}.${fileExt}`;
                    
                    console.log('Nome do arquivo para upload:', fileName);

                    let uploadResult;
                    
                    try {
                        // Abordagem simplificada para mobile e web
                        if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            // Verificar se o arquivo existe
                            console.log('Verificando arquivo em:', uri);
                            const fileInfo = await FileSystem.getInfoAsync(uri);
                            
                            if (!fileInfo.exists) {
                                throw new Error('Arquivo não encontrado');
                            }
                            
                            console.log('Arquivo encontrado, tamanho:', fileInfo.size);
                            
                            // Ler o arquivo como base64
                            const fileContent = await FileSystem.readAsStringAsync(uri, {
                                encoding: FileSystem.EncodingType.Base64
                            });
                            
                            // Criar um objeto FormData para upload
                            const formData = new FormData();
                            formData.append('file', {
                                uri,
                                name: fileName,
                                type: `image/${fileExt}`
                            } as any);
                            
                            // Fazer upload diretamente para o Supabase usando o endpoint REST
                            const supabaseStorageUrl = `${supabaseUrl}/storage/v1/object/player-avatars/${fileName}`;
                            
                            console.log('Iniciando upload para:', supabaseStorageUrl);
                            
                            const uploadResponse = await fetch(supabaseStorageUrl, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${supabaseAnonKey}`,
                                    'x-upsert': 'true'
                                },
                                body: formData
                            });
                            
                            if (!uploadResponse.ok) {
                                const errorText = await uploadResponse.text();
                                throw new Error(`Erro no upload: ${uploadResponse.status} - ${errorText}`);
                            }
                            
                            uploadResult = await uploadResponse.json();
                            console.log('Resposta do upload:', uploadResult);
                        } else {
                            // Abordagem para web
                            const response = await fetch(uri);
                            const blob = await response.blob();
                            
                            const result = await supabase.storage
                                .from('player-avatars')
                                .upload(fileName, blob, {
                                    contentType: `image/${fileExt}`,
                                    upsert: true
                                });
                                
                            if (result.error) {
                                throw result.error;
                            }
                            
                            uploadResult = result.data;
                        }
                        
                        console.log('Upload concluído com sucesso:', uploadResult);
                    } catch (error) {
                        console.error('Erro ao fazer upload do avatar:', error);
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        throw new Error(`Erro ao fazer upload do avatar: ${errorMessage}`);
                    }
                    
                    // Obter URL pública do avatar
                    const { data: publicUrlData } = supabase.storage
                        .from('player-avatars')
                        .getPublicUrl(fileName);
                    
                    // Atualizar o campo avatar_url do jogador
                    const avatarUrl = publicUrlData.publicUrl;
                    console.log('URL pública do avatar:', avatarUrl);
                    
                    // Atualizar diretamente na tabela players
                    const { error: updateError } = await supabase
                        .from('players')
                        .update({ avatar_url: avatarUrl })
                        .eq('id', playerId);
                    
                    if (updateError) {
                        console.error('Erro ao atualizar avatar_url:', updateError);
                        throw new Error(`Erro ao atualizar avatar_url: ${updateError.message}`);
                    }
                    
                    console.log('Campo avatar_url atualizado com sucesso');
                    
                    // Atualiza a lista de jogadores em memória
                    await this.list();
                    
                    return avatarUrl;
                } catch (error) {
                    console.error('Erro ao processar arquivo local:', error);
                    throw new Error('Não foi possível processar a imagem local');
                }
            } else {
                // Implementação para web - usando base64 diretamente
                try {
                    console.log('Processando upload para web com base64');
                    
                    // Verificar se a URI é uma string base64
                    if (uri.startsWith('data:image')) {
                        // Extrair o tipo de mídia e a extensão do arquivo
                        const matches = uri.match(/^data:image\/(\w+);base64,/);
                        if (!matches) {
                            throw new Error('Formato de imagem base64 inválido');
                        }
                        
                        const fileExt = matches[1];
                        // Remover o cabeçalho data:image/xxx;base64, para obter apenas os dados
                        const base64Data = uri.replace(/^data:image\/\w+;base64,/, '');
                        
                        // Nome do arquivo: playerId/timestamp.extensão
                        const fileName = `${playerId}/${Date.now()}.${fileExt}`;
                        console.log('Nome do arquivo para upload (web):', fileName);
                        
                        // Converter base64 para Uint8Array para o Supabase
                        const binaryData = atob(base64Data);
                        const bytes = new Uint8Array(binaryData.length);
                        for (let i = 0; i < binaryData.length; i++) {
                            bytes[i] = binaryData.charCodeAt(i);
                        }
                        
                        // Upload dos dados para o bucket 'player-avatars'
                        const { data, error } = await supabase.storage
                            .from('player-avatars')
                            .upload(fileName, bytes, {
                                contentType: `image/${fileExt}`,
                                upsert: true
                            });
                        
                        if (error) {
                            console.error('Erro ao fazer upload do avatar (web):', error);
                            throw new Error(`Erro ao fazer upload do avatar: ${error.message}`);
                        }
                        
                        console.log('Upload concluído com sucesso (web):', data);
                        
                        // Obter URL pública do avatar
                        const { data: publicUrlData } = supabase.storage
                            .from('player-avatars')
                            .getPublicUrl(fileName);
                        
                        // Atualizar o campo avatar_url do jogador
                        const avatarUrl = publicUrlData.publicUrl;
                        console.log('URL pública do avatar (web):', avatarUrl);
                        
                        // Atualizar diretamente na tabela players
                        const { error: updateError } = await supabase
                            .from('players')
                            .update({ avatar_url: avatarUrl })
                            .eq('id', playerId);
                        
                        if (updateError) {
                            console.error('Erro ao atualizar avatar_url (web):', updateError);
                            throw new Error(`Erro ao atualizar avatar_url: ${updateError.message}`);
                        }
                        
                        console.log('Campo avatar_url atualizado com sucesso (web)');
                        
                        // Atualiza a lista de jogadores em memória
                        await this.list();
                        
                        return avatarUrl;
                    } else {
                        throw new Error('A imagem selecionada não está no formato base64 esperado');
                    }
                } catch (error) {
                    console.error('Erro ao processar imagem para web:', error);
                    throw new Error('Não foi possível processar a imagem para web');
                }
            }
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
        } catch (error) {
            console.error('Erro ao excluir jogador:', error);
            throw error;
        }
    }

    async listCompetitionMembers(competitionId: string) {
        try {
            const { data, error } = await supabase
                .from('competition_members')
                .select(`
                    id,
                    player_id,
                    players (id, name)
                `)
                .eq('competition_id', competitionId);

            if (error) {
                console.error('Error fetching competition members:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in listCompetitionMembers:', error);
            throw error;
        }
    }
}

export const playerService = new PlayerService();

