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

export interface CreatePlayerDTO {
    name: string;
    phone: string;
    nickname?: string;
    avatar_url?: string;
}
