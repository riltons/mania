import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/user';

export const userService = {
    async createProfile(
        userId: string,
        fullName: string,
        phoneNumber: string,
        nickname?: string
    ): Promise<{ data: UserProfile | null; error: Error | null }> {
        try {
            // Primeiro verifica se já existe um perfil
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select()
                .eq('user_id', userId)
                .single();

            // Se já existe, atualiza
            if (existingProfile) {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .update({
                        full_name: fullName,
                        phone_number: phoneNumber,
                        nickname
                    })
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return { data, error: null };
            }

            // Se não existe, cria novo perfil
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: userId,
                    full_name: fullName,
                    phone_number: phoneNumber,
                    nickname
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating/updating user profile:', error);
            return { data: null, error: error as Error };
        }
    },

    async getProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { data: null, error: error as Error };
        }
    },

    async updateProfile(
        userId: string,
        updates: Partial<UserProfile>
    ): Promise<{ data: UserProfile | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { data: null, error: error as Error };
        }
    },

    async findByPhoneNumber(phoneNumber: string): Promise<{ data: UserProfile | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('phone_number', phoneNumber)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 é o código para "não encontrado"
            return { data: data || null, error: null };
        } catch (error) {
            console.error('Error finding user by phone:', error);
            return { data: null, error: error as Error };
        }
    }
};
