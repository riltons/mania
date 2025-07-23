import { supabase } from '@/core/lib/supabase';
import { findAndLinkPlayerByPhone } from './findAndLinkPlayerService';
import { activityService } from '@/services/activityService';
import { normalizePhoneNumber, playerRpcService } from './playerRpcService';

// Definições de tipos
interface UserPlayerRelation {
    is_primary: boolean;
    user_id: string;
    player_id: string;
}

export interface Player {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    created_by: string;
    nickname?: string;
    avatar_url?: string;
    isLinkedUser?: boolean;
    isMine?: boolean;
    isPrimaryUser?: boolean;
    isCreatedByOtherUser?: boolean;
    sharedPlayer?: boolean;
    isPrimary?: boolean;
    stats?: PlayerStats;
    message?: string;
    user_player_relations?: UserPlayerRelation[];
}

interface PlayerStats {
    total_matches: number;
    wins: number;
    losses: number;
    win_rate: number;
}

export interface CreatePlayerDTO {
    name: string;
    phone: string;
    nickname?: string;
    avatar_url?: string;
}

export class PlayerService {
    private myPlayers: Player[] = [];
    private communityPlayers: Player[] = [];
    
    constructor() {}

    private async getCurrentUserId(): Promise<string | null> {
        const { data: authData } = await supabase.auth.getSession();
        return authData?.session?.user?.id || null;
    }

    /**
     * Normaliza um número de telefone para o formato brasileiro padrão
     * - Remove caracteres não numéricos
     * - Se começar com 55 (código do Brasil), remove esse prefixo
     * - Garante que o número tenha exatamente 11 dígitos (DDD + 9 + 8 dígitos)
     * - Valida se o terceiro dígito é '9' conforme padrão brasileiro atual
     * 
     * @param phone O número de telefone a ser normalizado
     * @returns O número de telefone normalizado, no formato brasileiro (11 dígitos)
     * @throws Error Se o número não puder ser normalizado para o formato brasileiro válido
     */
    private normalizePhoneNumber(phone: string): string {
        if (!phone) {
            throw new Error('Telefone não fornecido');
        }
        
        // Remove caracteres não numéricos
        let normalizedPhone = phone.replace(/\D/g, '');
        console.log(`[PlayerService] Telefone após remover caracteres especiais: ${phone} -> ${normalizedPhone}`);
        
        // Se começar com 55 (código do Brasil), remove esse prefixo
        if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
            normalizedPhone = normalizedPhone.substring(2);
            console.log(`[PlayerService] Telefone após remover prefixo 55: ${normalizedPhone}`);
        }
        
        // Se ainda tiver mais de 11 dígitos, mantém os últimos 11
        if (normalizedPhone.length > 11) {
            const original = normalizedPhone;
            normalizedPhone = normalizedPhone.slice(-11);
            console.log(`[PlayerService] Telefone muito longo (${original.length} dígitos), truncado para: ${normalizedPhone}`);
        }
        
        // Validação rigorosa do formato brasileiro
        if (normalizedPhone.length !== 11) {
            throw new Error(`Telefone inválido: deve ter exatamente 11 dígitos, mas tem ${normalizedPhone.length}`);
        }
        
        // Validar se o terceiro dígito é 9 (padrão brasileiro atual para celulares)
        if (normalizedPhone.charAt(2) !== '9') {
            throw new Error('Telefone inválido: o terceiro dígito deve ser 9');
        }
        
        // Validar se o DDD é válido (entre 11 e 99)
        const ddd = parseInt(normalizedPhone.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
            throw new Error(`Telefone inválido: DDD ${ddd} não é válido no Brasil`);
        }
        
        console.log(`[PlayerService] Normalização concluída: ${phone} -> ${normalizedPhone}`);
        return normalizedPhone;
    }

    /**
     * Busca um jogador pelo número de telefone
     * @param phone Número do telefone a ser buscado
     * @returns Jogador encontrado ou lança erro se não encontrado
     */
    async findByPhone(phone: string | null): Promise<Player | null> {
        if (!phone) return null;

        try {
            const userId = await this.getCurrentUserId();
            const normalizedPhone = this.normalizePhoneNumber(phone);
            console.log('[PlayerService] Telefone normalizado:', phone, '->', normalizedPhone);
            
            // Usar o playerRpcService que é mais robusto e tem múltiplas estratégias de busca
            const player = await playerRpcService.findPlayerByPhone(phone);
            
            if (!player) {
                console.log('Nenhum jogador encontrado com o telefone:', normalizedPhone);
                return null;
            }

            return {
                ...player,
                isMine: player.created_by === userId,
                isPrimaryUser: player.user_player_relations?.some(
                    (rel: UserPlayerRelation) => rel.user_id === userId && rel.is_primary
                ) || false
            } as Player;
        } catch (error: unknown) {
            console.error('Erro ao buscar jogador por telefone:', error);
            throw new Error(`Erro ao buscar jogador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }

    /**
     * Cria um novo jogador ou retorna um jogador existente
     * @param data Dados do jogador a ser criado
     * @param maxRetries Número máximo de tentativas em caso de concorrência
     * @returns O jogador criado ou existente
     */
    async create(data: CreatePlayerDTO, maxRetries: number = 2): Promise<Player> {
        const log = (message: string, logData?: any) => {
            const timestamp = new Date().toISOString();
            const formattedData = logData ? ` | ${JSON.stringify(logData)}` : '';
            console.log(`[${timestamp}] [CreatePlayer] ${message}${formattedData}`);
        };

        try {
            log('Iniciando processo de criação de jogador', {
                name: data.name,
                phone: data.phone,
                maxRetries
            });

            // Verificar autenticação
            const currentUserId = await this.getCurrentUserId();
            if (!currentUserId) {
                const authError = new Error('Usuário não autenticado');
                log('Erro de autenticação', { error: authError.message });
                throw authError;
            }

            // Normaliza o telefone para busca e armazenamento
            let normalizedPhone: string;
            try {
                normalizedPhone = this.normalizePhoneNumber(data.phone);
                log('Telefone normalizado com sucesso', { 
                    original: data.phone, 
                    normalized: normalizedPhone 
                });
            } catch (error) {
                const validationError = error as Error;
                log('Erro de validação do telefone', { 
                    phone: data.phone, 
                    error: validationError.message 
                });
                throw validationError;
            }
            
            // Validação adicional do telefone
            if (normalizedPhone.length !== 11) {
                const validationError = new Error('Número de telefone deve ter exatamente 11 dígitos');
                log('Erro de validação', { 
                    phone: data.phone, 
                    normalizedPhone,
                    error: validationError.message 
                });
                throw validationError;
            }
            
            // Verifica se o terceiro dígito é 9 (padrão brasileiro atual para celulares)
            if (normalizedPhone.charAt(2) !== '9') {
                const validationError = new Error('Número de telefone inválido: o terceiro dígito deve ser 9');
                log('Erro de validação', { 
                    phone: data.phone, 
                    normalizedPhone,
                    error: validationError.message 
                });
                throw validationError;
            }
            
            // Verifica se o DDD é válido (entre 11 e 99)
            const ddd = parseInt(normalizedPhone.substring(0, 2));
            if (ddd < 11 || ddd > 99) {
                const validationError = new Error(`Número de telefone inválido: DDD ${ddd} não é válido no Brasil`);
                log('Erro de validação', { 
                    phone: data.phone, 
                    normalizedPhone,
                    ddd,
                    error: validationError.message 
                });
                throw validationError;
            }
            
            // Valida se tem exatamente 11 dígitos
            if (normalizedPhone.length !== 11) {
                const validationError = new Error('O número de telefone deve ter exatamente 11 dígitos (DDD + número)');
                log('Erro de validação de tamanho', { 
                    phone: data.phone, 
                    normalizedPhone,
                    tamanho: normalizedPhone.length,
                    error: validationError.message 
                });
                throw validationError;
            }
            
            // Valida se está no formato brasileiro correto (DDD + 9 + 8 dígitos)
            // O terceiro dígito deve ser 9, conforme padrão de celulares brasileiros
            if (normalizedPhone.length === 11 && normalizedPhone.charAt(2) !== '9') {
                const validationError = new Error('Formato inválido para telefone celular brasileiro. Deve seguir o padrão DDD + 9 + 8 dígitos.');
                log('Erro de validação de formato brasileiro', { 
                    phone: data.phone, 
                    normalizedPhone,
                    terceiroDigito: normalizedPhone.charAt(2),
                    error: validationError.message 
                });
                throw validationError;
            }

            // Tenta encontrar um jogador existente e vinculá-lo ao usuário atual
            log('Buscando jogador existente para o telefone', { normalizedPhone });
            
            // Primeiro, tenta encontrar e vincular o jogador com a nova função
            const linkedPlayer = await findAndLinkPlayerByPhone(normalizedPhone, currentUserId, 'CreatePlayer');
            
            if (linkedPlayer) {
                log('Jogador existente encontrado e vinculado', { 
                    id: linkedPlayer.id, 
                    name: linkedPlayer.name, 
                    phone: linkedPlayer.phone,
                    isShared: linkedPlayer.is_shared
                });
                
                // Converter o LinkedPlayer para o formato Player esperado
                const player: Player = {
                    id: linkedPlayer.id,
                    name: linkedPlayer.name,
                    phone: linkedPlayer.phone,
                    nickname: linkedPlayer.nickname || '',
                    avatar_url: linkedPlayer.avatar_url || '',
                    created_at: linkedPlayer.created_at,
                    created_by: linkedPlayer.created_by,
                    isCreatedByOtherUser: linkedPlayer.is_shared,
                    sharedPlayer: linkedPlayer.is_shared,
                    isPrimary: linkedPlayer.is_primary
                };
                
                log('Retornando jogador vinculado', { 
                    playerId: player.id 
                });
                return player;
            }
            
            // Se não encontrou com a nova função, tenta com o método antigo
            const existingPlayer = await this.findByPhone(normalizedPhone);
            
            if (existingPlayer) {
                log('Jogador existente encontrado com método antigo', { 
                    id: existingPlayer.id, 
                    name: existingPlayer.name, 
                    phone: existingPlayer.phone 
                });
                
                log('Retornando jogador existente', { 
                    playerId: existingPlayer.id 
                });
                return existingPlayer;
            }
            
            log('Nenhum jogador existente encontrado com este telefone');

            // Se não encontrou jogador existente, tenta criar um novo
            log('Criando novo jogador', {
                name: data.name,
                phone: normalizedPhone
            });

            const { data: newPlayer, error } = await supabase
                .from('players')
                .insert({
                    name: data.name,
                    phone: normalizedPhone,
                    nickname: data.nickname || '',
                    avatar_url: data.avatar_url || '',
                    created_by: currentUserId
                })
                .select('*')
                .single();

            if (error) {
                log('Erro ao criar jogador', { error: error.message });
                throw error;
            }

            if (!newPlayer) {
                const unexpectedError = new Error('Erro inesperado ao criar jogador');
                log('Erro inesperado', { error: unexpectedError.message });
                throw unexpectedError;
            }

            log('Jogador criado com sucesso', { 
                id: newPlayer.id, 
                name: newPlayer.name, 
                phone: newPlayer.phone 
            });

            // Adicionar relação entre usuário e jogador
            try {
                log('Adicionando relação entre usuário e jogador', {
                    userId: currentUserId,
                    playerId: newPlayer.id,
                    isPrimary: true
                });

                const { error: relationError } = await supabase
                    .from('user_player_relations')
                    .insert({
                        user_id: currentUserId,
                        player_id: newPlayer.id,
                        is_primary: true
                    });

                if (relationError) {
                    log('Erro ao adicionar relação', { error: relationError.message });
                    // Não interrompe o fluxo se falhar ao adicionar relação
                }
            } catch (relationErr) {
                log('Exceção ao adicionar relação', { error: relationErr instanceof Error ? relationErr.message : 'Erro desconhecido' });
                // Não interrompe o fluxo se falhar ao adicionar relação
            }

            // Registrar atividade de criação de jogador
            try {
                log('Registrando atividade de criação de jogador');
                await activityService.createActivity({
                    type: 'player',
                    description: `Novo jogador "${data.name}" foi criado`,
                    metadata: {
                        player_id: newPlayer.id,
                        name: newPlayer.name
                    }
                });
            } catch (activityErr) {
                log('Erro ao registrar atividade', { error: activityErr instanceof Error ? activityErr.message : 'Erro desconhecido' });
                // Não interrompe o fluxo se falhar ao registrar atividade
            }

            return {
                ...newPlayer,
                isMine: true,
                isPrimaryUser: true
            } as Player;
        } catch (error) {
            log('Erro final ao criar jogador', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
            throw error;
        }
    }

    /**
     * Lista os jogadores do usuário e da comunidade
     */
    async list(): Promise<{ myPlayers: Player[]; communityPlayers: Player[]; }> {
        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            const { data: myPlayers, error: myPlayersError } = await supabase
                .from('players')
                .select('*, user_player_relations(*)')
                .eq('created_by', userId);

            if (myPlayersError) {
                console.error('Erro ao buscar jogadores do usuário:', myPlayersError);
                throw new Error('Erro ao buscar jogadores do usuário');
            }

            const { data: communityPlayers, error: communityPlayersError } = await supabase
                .from('players')
                .select('*, user_player_relations(*)')
                .neq('created_by', userId);

            if (communityPlayersError) {
                console.error('Erro ao buscar jogadores da comunidade:', communityPlayersError);
                throw new Error('Erro ao buscar jogadores da comunidade');
            }

            const processedMyPlayers = (myPlayers || []).map((player: Player) => ({
                ...player,
                isMine: true,
                isPrimaryUser: player.user_player_relations?.some(
                    (rel: UserPlayerRelation) => rel.user_id === userId && rel.is_primary
                ) || false
            }));

            const processedCommunityPlayers = (communityPlayers || []).map((player: Player) => ({
                ...player,
                isMine: false,
                isPrimaryUser: player.user_player_relations?.some(
                    (rel: UserPlayerRelation) => rel.user_id === userId && rel.is_primary
                ) || false
            }));

            return {
                myPlayers: processedMyPlayers,
                communityPlayers: processedCommunityPlayers
            };
        } catch (error: unknown) {
            console.error('Erro ao listar jogadores:', error);
            throw new Error('Erro ao listar jogadores');
        }
    }
}

export const playerService = new PlayerService();
