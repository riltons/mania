import { supabase } from '@/lib/supabase';
import { UserProfile } from '../types/user';

export interface CommunityOrganizer {
    id: string;
    community_id: string;
    user_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    user_profile?: UserProfile;
}

export const communityOrganizerService = {
    async addOrganizer(communityId: string, userEmail: string) {
        try {
            console.log('Buscando usuário com email:', userEmail);
            
            // First, find the user by email
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', userEmail.toLowerCase().trim());

            console.log('Resultado da busca:', { userData, userError });

            if (userError) {
                console.error('Erro ao buscar usuário:', userError);
                throw new Error('Erro ao buscar usuário');
            }

            if (!userData || userData.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const user = userData[0];
            console.log('Usuário encontrado:', user);

            // Check if user is already an organizer
            const { data: existingOrganizer, error: existingError } = await supabase
                .from('community_organizers')
                .select('id')
                .eq('community_id', communityId)
                .eq('user_id', user.id)
                .single();

            console.log('Verificação de organizador existente:', { existingOrganizer, existingError });

            if (existingOrganizer) {
                throw new Error('Usuário já é organizador desta comunidade');
            }

            // Add user as organizer
            const { data, error } = await supabase
                .from('community_organizers')
                .insert({
                    community_id: communityId,
                    user_id: user.id,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao adicionar organizador:', error);
                throw error;
            }

            console.log('Organizador adicionado com sucesso:', data);
            return { data, error: null };
        } catch (error) {
            console.error('Error adding organizer:', error);
            return { data: null, error };
        }
    },

    async removeOrganizer(communityId: string, userId: string) {
        try {
            const { error } = await supabase
                .from('community_organizers')
                .delete()
                .eq('community_id', communityId)
                .eq('user_id', userId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error removing organizer:', error);
            return { error };
        }
    },

    async listOrganizers(communityId: string) {
        try {
            // Buscar diretamente os perfis dos organizadores com uma única consulta
            const { data, error } = await supabase
                .from('community_organizers')
                .select(`
                    id,
                    community_id,
                    user_id,
                    created_at,
                    updated_at,
                    created_by
                `)
                .eq('community_id', communityId);

            if (error) throw error;
            if (!data) return { data: [], error: null };

            // Buscar os perfis básicos dos usuários
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', data.map(org => org.user_id));

            if (profilesError) throw profilesError;

            // Combinar os dados
            const organizersWithProfiles = data.map(org => ({
                ...org,
                user_profile: profiles?.find(profile => profile.id === org.user_id) || null
            }));

            return { data: organizersWithProfiles, error: null };
        } catch (error) {
            console.error('Error listing organizers:', error);
            return { data: null, error };
        }
    },

    async isOrganizer(userId: string, communityId: string) {
        try {
            const { data, error } = await supabase
                .from('community_organizers')
                .select('id')
                .eq('community_id', communityId)
                .eq('user_id', userId)
                .single();

            if (error) return false;
            return !!data;
        } catch (error) {
            console.error('Error checking organizer status:', error);
            return false;
        }
    }
};