import { supabase } from '@/core/lib/supabase';
import { activityService } from '@/services/activityService';
import { Database } from '@/types/database.types';
import { playerRpcService, normalizePhoneNumber } from './playerRpcService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Definições de tipos
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
    isExistingPlayer?: boolean;
    isPrimaryUser?: boolean;
    stats?: PlayerStats;
    message?: string;
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

export interface CreatePlayerDTO {
    name: string;
    phone: string;
    nickname?: string;
    avatar_url?: string;
}

class PlayerService {
    private players: Player[] = [];

    /**
     * Cria um novo jogador ou vincula um jogador existente ao usuário atual
     * Utiliza funções RPC para busca avançada e vinculação
     */
    async create(data: CreatePlayerDTO): Promise<Player> {
        try {
            console.log('Iniciando processo de criação/vinculação de jogador:', data.name, data.phone);
            
            // Verificar autenticação
            const { data: { session } } = await supabase.auth.getSession();
            const currentUserId = session?.user?.id;

            if (!currentUserId) {
                throw new Error('Usuário não autenticado');
            }
            
            // Normaliza o telefone para busca e armazenamento
            const normalizedPhone = normalizePhoneNumber(data.phone);
            
            // Busca por jogador existente usando a função RPC (mais robusta)
            const existingPlayer = await playerRpcService.findPlayerByPhone(normalizedPhone);
            
            if (existingPlayer) {
                console.log('Jogador existente encontrado:', existingPlayer.id, existingPlayer.name, existingPlayer.phone);
                
                // Vincula o jogador ao usuário atual
                const linked = await playerRpcService.linkPlayerToUser(
                    existingPlayer.id, 
                    currentUserId, 
                    true
                );
                
                if (linked) {
                    console.log('Jogador vinculado com sucesso ao usuário atual');
                    return existingPlayer;
                } else {
                    console.error('Erro ao vincular jogador ao usuário');
                }
            }
            
            // Se não encontrou jogador existente ou falhou ao vincular, cria um novo
            console.log('Criando novo jogador:', data.name, normalizedPhone);
            
            // Inserir o novo jogador
            const { data: newPlayer, error: createError } = await supabase
                .from('players')
                .insert({
                    name: data.name,
                    phone: normalizedPhone,
                    nickname: data.nickname || null,
                    avatar_url: data.avatar_url || null,
                    created_by: currentUserId
                })
                .select('*')
                .single();
                
            if (createError) {
                console.error('Erro ao criar jogador:', createError);
                throw new Error('Erro ao criar jogador: ' + createError.message);
            }
            
            if (!newPlayer) {
                throw new Error('Falha ao criar jogador: nenhum dado retornado');
            }
            
            console.log('Jogador criado com sucesso:', newPlayer.id, newPlayer.name);
            
            // Registrar atividade
            try {
                await activityService.create({
                    type: 'player_created',
                    player_id: newPlayer.id,
                    data: {
                        player_name: newPlayer.name
                    }
                });
            } catch (activityError) {
                console.error('Erro ao registrar atividade:', activityError);
            }
            
            return newPlayer as Player;
            
        } catch (error) {
            console.error('Erro no processo de criação de jogador:', error);
            throw error;
        }
    }

    // Outros métodos da classe...
    // Implementações simplificadas para manter o arquivo funcionando
    
    async getByPhone(phone: string): Promise<Player | null> {
        return playerRpcService.findPlayerByPhone(phone);
    }
    
    async list(): Promise<{ myPlayers: Player[], communityPlayers: Player[] }> {
        try {
            const { data } = await supabase.from('players').select('*');
            const players = data || [];
            return {
                myPlayers: players as Player[],
                communityPlayers: [] as Player[]
            };
        } catch (error) {
            console.error('Erro ao listar jogadores:', error);
            return { myPlayers: [], communityPlayers: [] };
        }
    }
}

export const playerService = new PlayerService();
