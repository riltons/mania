import { supabase, supabaseUrl, supabaseAnonKey } from '@/core/lib/supabase';
import { activityService } from './activityService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
    isPrimaryUser?: boolean;
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

    async getPlayerStats(playerId: string): Promise<PlayerStats> {
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

            const { count: buchudas, error: buchudasError } = await supabase
                .from('game_players')
                .select('*', { count: 'exact', head: true })
                .eq('player_id', playerId)
                .eq('is_buchuda', true);

            if (winsError || buchudasError) {
                throw winsError || buchudasError;
            }

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

    // Função auxiliar para converter base64 em ArrayBuffer
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async list(fetchStats = false) {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            console.log('Buscando jogadores...');
            console.log('Dados do usuário:', userData);
            console.log('Erro ao obter usuário:', userError);
            
            if (userError || !userData.user) {
                console.error('Erro de autenticação:', userError || 'Usuário não autenticado');
                throw userError || new Error('Usuário não autenticado');
            }

            console.log('Usuário autenticado:', userData.user.id);
            console.log('E-mail do usuário:', userData.user.email);

            // Buscar jogadores criados pelo usuário
            const { data: myPlayers, error: myPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations!left(
                        is_primary,
                        user_id
                    )
                `)
                .eq('created_by', userData.user.id)
                .order('name');

            console.log('Jogadores criados pelo usuário:', myPlayers);

            if (myPlayersError) {
                console.error('Erro ao buscar jogadores criados:', myPlayersError);
                throw new Error('Erro ao listar jogadores');
            }

            // Buscar jogadores das comunidades onde sou organizador
            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select(`
                    *,
                    user_player_relations!left(
                        user_id,
                        is_primary
                    ),
                    community_members!inner(
                        community_id,
                        communities!inner(
                            id,
                            community_organizers!inner(
                                user_id
                            )
                        )
                    )
                `)
                .eq('community_members.communities.community_organizers.user_id', userData.user.id)
                .neq('created_by', userData.user.id)
                .order('name');

            console.log('Jogadores da comunidade:', communityPlayers);

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores da comunidade:', communityPlayersError);
                throw new Error('Erro ao listar jogadores');
            }
            
            // Buscar jogadores compartilhados (criados por outros usuários, mas vinculados ao usuário atual)
            const { data: sharedPlayers, error: sharedPlayersError } = await supabase
                .from('user_player_relations')
                .select(`
                    player:player_id(
                        *,
                        user_player_relations!left(
                            is_primary,
                            user_id
                        )
                    )
                `)
                .eq('user_id', userData.user.id);

            console.log('=== DEBUG JOGADORES COMPARTILHADOS ===');
            console.log('User ID atual:', userData.user.id);
            console.log('Relações encontradas:', sharedPlayers?.length || 0);
            console.log('Dados das relações:', sharedPlayers);
            console.log('Erro na busca:', sharedPlayersError);

            // Busca alternativa: pegar as relações e depois buscar os jogadores individualmente
            const { data: alternativeRelations, error: altError } = await supabase
              .from('user_player_relations')
              .select('player_id, is_primary')
              .eq('user_id', userData.user.id);

            console.log('=== BUSCA ALTERNATIVA DE RELAÇÕES ===');
            console.log('Relações encontradas:', alternativeRelations?.length || 0);
            console.log('Dados das relações:', alternativeRelations?.map(r => ({ 
              is_primary: r.is_primary, 
              player_id: r.player_id 
            })));

            if (alternativeRelations) {
              const additionalPlayers = [];
              const processedPlayerIds = new Set();
              for (const relation of alternativeRelations) {
                // Só busca jogadores compartilhados (is_primary = false) que não foram encontrados na busca original
                if (!relation.is_primary && !processedPlayerIds.has(relation.player_id)) {
                  console.log(`Buscando jogador individual: ${relation.player_id}`);
                  
                  const { data: individualPlayer, error: individualError } = await supabase
                    .from('players')
                    .select(`
                      *,
                      user_player_relations!inner(
                        user_id,
                        is_primary
                      )
                    `)
                    .eq('id', relation.player_id)
                    .eq('is_active', true)
                    .maybeSingle(); // Usa maybeSingle para não dar erro se não encontrar

                  if (individualError) {
                    console.log(`Erro ao buscar jogador ${relation.player_id}:`, individualError);
                    // Se der erro PGRST116, significa que o jogador não existe mais
                    if (individualError.code === 'PGRST116') {
                      console.log(`⚠️ RELAÇÃO ÓRFÃ DETECTADA: Jogador ${relation.player_id} não existe mais, mas relação ainda persiste`);
                    }
                    continue;
                  }

                  if (individualPlayer && !processedPlayerIds.has(individualPlayer.id)) {
                    console.log(`Adicionando jogador compartilhado adicional: ${individualPlayer.name}`);
                    
                    // Verifica se é um jogador compartilhado de verdade (criado por outro usuário)
                    const isSharedPlayer = individualPlayer.created_by !== userData.user.id;
                    
                    const playerWithFlags = {
                      ...individualPlayer,
                      isMine: !isSharedPlayer,
                      isLinkedUser: true,
                      isPrimaryUser: relation.is_primary
                    };

                    if (isSharedPlayer) {
                      additionalPlayers.push(playerWithFlags);
                    }
                    
                    processedPlayerIds.add(individualPlayer.id);
                  }
                }
              }

              console.log('Jogadores adicionais encontrados:', additionalPlayers.length);
              communityPlayers.push(...additionalPlayers);
            }

            // Processar jogadores
            const players: Player[] = [];

            // Adicionar jogadores criados pelo usuário
            if (myPlayers) {
                myPlayers.forEach((player: any) => {
                    const relations = Array.isArray(player.user_player_relations) ? player.user_player_relations : [];
                    const isPrimary = relations.some((rel: any) => rel?.is_primary);
                    
                    players.push({
                        ...player,
                        isMine: true,
                        isLinkedUser: true,
                        isPrimaryUser: isPrimary,
                        user_player_relations: relations
                    });
                });
            }

            // Adicionar jogadores da comunidade
            if (communityPlayers) {
                communityPlayers.forEach((player: any) => {
                    const relations = Array.isArray(player.user_player_relations) ? player.user_player_relations : [];
                    const isPrimary = relations.some((rel: { is_primary: boolean }) => rel?.is_primary);
                    
                    players.push({
                        ...player,
                        isMine: false,
                        isLinkedUser: true,
                        isPrimaryUser: isPrimary,
                        user_player_relations: relations
                    });
                });
            }
            
            // Adicionar jogadores compartilhados (criados por outros usuários mas vinculados ao usuário atual)
            if (sharedPlayers) {
                console.log('=== PROCESSANDO JOGADORES COMPARTILHADOS ===');
                console.log('Quantidade de relações a processar:', sharedPlayers.length);
                
                const processedIds = new Set(players.map(p => p.id)); // Para evitar duplicatas
                
                sharedPlayers.forEach((relation: any, index: number) => {
                    console.log(`Processando relação ${index + 1}:`, relation);
                    
                    if (!relation.player) {
                        console.log('  - Pulando: relation.player é null/undefined');
                        return;
                    }
                    
                    if (processedIds.has(relation.player.id)) {
                        console.log(`  - Pulando: jogador ${relation.player.id} já foi processado`);
                        return;
                    }
                    
                    console.log(`  - Adicionando jogador compartilhado: ${relation.player.name} (ID: ${relation.player.id})`);
                    
                    const relations = Array.isArray(relation.player.user_player_relations) ? relation.player.user_player_relations : [];
                    const isPrimary = relations.some((rel: any) => 
                        rel?.is_primary && rel?.user_id === userData.user.id
                    );
                    
                    players.push({
                        ...relation.player,
                        isMine: false,
                        isLinkedUser: true,
                        isPrimaryUser: isPrimary,
                        user_player_relations: relations
                    });
                    
                    processedIds.add(relation.player.id);
                });
                
                console.log('=== FIM DO PROCESSAMENTO ===');
            } else {
                console.log('Nenhum jogador compartilhado encontrado (sharedPlayers é null/undefined)');
            }

            // Separar jogadores
            const myPlayersList = players.filter(player => player.isMine);
            const communityPlayersList = players.filter(player => !player.isMine);

            // Se necessário, buscar estatísticas para cada jogador
            if (fetchStats) {
                const [myPlayersWithStats, communityPlayersWithStats] = await Promise.all([
                    Promise.all(myPlayersList.map(async player => ({
                        ...player,
                        stats: await this.getPlayerStats(player.id)
                    }))),
                    Promise.all(communityPlayersList.map(async player => ({
                        ...player,
                        stats: await this.getPlayerStats(player.id)
                    })))
                ]);

                return {
                    myPlayers: myPlayersWithStats,
                    communityPlayers: communityPlayersWithStats
                };
            }

            return {
                myPlayers: myPlayersList,
                communityPlayers: communityPlayersList
            };
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
            const arrayBuffer = this.base64ToArrayBuffer(base64Data);
            
            console.log('Tentando fazer upload para o bucket player-avatars com o arquivo:', fileName);
            console.log('URL do Supabase:', supabaseUrl);
            
            // Verifica se o bucket existe
            try {
                const { data: buckets, error: bucketsError } = await supabase
                    .storage
                    .listBuckets();
                    
                if (bucketsError) {
                    console.error('Erro ao listar buckets:', bucketsError);
                } else {
                    console.log('Buckets disponíveis:', buckets.map(b => b.name));
                    
                    // Verifica se o bucket player-avatars existe
                    const playerAvatarsBucket = buckets.find(b => b.name === 'player-avatars');
                    if (!playerAvatarsBucket) {
                        console.error('Bucket player-avatars não encontrado! Tentando criar...');
                    }
                }
            } catch (bucketError) {
                console.error('Erro ao verificar buckets:', bucketError);
            }
            
            // Faz o upload para o storage do Supabase
            console.log('Iniciando upload do arquivo...');
            
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
                isLinkedUser: item.player.user_player_relations?.some((rel: { is_primary: boolean }) => rel.is_primary)
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
                const playerData = relations.player as Player;
                return {
                    ...playerData,
                    isLinkedUser: true,
                    isMine: true,
                    isPrimaryUser: true
                };
            }

            // Se não encontrou, tenta buscar o perfil do usuário
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userData.user.id)
                .single();

            if (profileError) {
                console.error('Erro ao buscar perfil do usuário:', profileError);
                
                // Tentar criar um perfil para o usuário
                try {
                    const { error: insertError } = await supabase
                        .from('user_profiles')
                        .insert({
                            id: crypto.randomUUID(),
                            user_id: userData.user.id,
                            full_name: userData.user.email?.split('@')[0] || 'Novo Usuário',
                            phone_number: '',
                            nickname: '',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                    
                    if (insertError) {
                        console.error('Erro ao criar perfil de usuário:', insertError);
                        throw new Error('Erro ao criar perfil de usuário');
                    }
                    
                    // Buscar o perfil recém-criado
                    const { data: newProfile, error: fetchError } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('user_id', userData.user.id)
                        .single();
                    
                    if (fetchError || !newProfile) {
                        console.error('Erro ao buscar perfil recém-criado:', fetchError);
                        throw new Error('Erro ao buscar perfil recém-criado');
                    }
                    
                    // Usar o perfil recém-criado
                    return this.create({
                        name: newProfile.full_name || userData.user.email?.split('@')[0] || 'Novo Jogador',
                        phone: newProfile.phone_number || '',
                        nickname: newProfile.nickname || userData.user.email?.split('@')[0]
                    });
                } catch (error) {
                    console.error('Erro ao tentar criar perfil alternativo:', error);
                    throw new Error('Não foi possível criar seu perfil de usuário');
                }
            }

            // Cria um novo jogador com base no perfil do usuário
            const newPlayer = await this.create({
                name: profile.full_name || userData.user.email?.split('@')[0] || 'Novo Jogador',
                phone: profile.phone_number || '',
                nickname: profile.nickname || userData.user.email?.split('@')[0]
            });
            
            // Verifica se a relação entre usuário e jogador foi criada
            const { data: relation, error: checkRelationError } = await supabase
                .from('user_player_relations')
                .select('*')
                .eq('user_id', userData.user.id)
                .eq('player_id', newPlayer.id)
                .single();
                
            // Se não existe relação, cria uma
            if (checkRelationError || !relation) {
                try {
                    const { error: relationError } = await supabase
                        .from('user_player_relations')
                        .insert({
                            id: crypto.randomUUID(),
                            user_id: userData.user.id,
                            player_id: newPlayer.id,
                            created_at: new Date().toISOString(),
                            is_primary: true
                        });
                        
                    if (relationError) {
                        console.error('Erro ao criar relação usuário-jogador:', relationError);
                    } else {
                        console.log('Relação usuário-jogador criada com sucesso');
                    }
                } catch (relationError) {
                    console.error('Exceção ao criar relação usuário-jogador:', relationError);
                }
            }

            // Marca como jogador vinculado
            return {
                ...newPlayer,
                isLinkedUser: true,
                isPrimaryUser: true
            };
        } catch (error) {
            console.error('Erro ao obter/criar jogador para o usuário atual:', error);
            throw error;
        }
    }
}

export const playerService = new PlayerService();
