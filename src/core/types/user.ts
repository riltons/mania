export type UserRole = 'admin' | 'organizer' | 'player';

export interface UserProfile {
    id: string;
    created_at: string;
    user_id: string;
    full_name: string;
    phone_number: string;
    roles: UserRole[];
    nickname?: string;
}

export interface CommunityMember {
    id: string;
    community_id: string;
    user_id: string;
    roles: UserRole[];
    created_at: string;
}
