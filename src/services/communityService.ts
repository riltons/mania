import { supabase } from '@/lib/supabase';
import { activityService } from './activityService';
import { subscriptionService } from './subscriptionService';

export interface Community {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    disabled: boolean;
    members_count: number;
    competitions_count: number;
    is_organizer?: boolean;
}

export interface CreateCommunityDTO {
    name: string;
    description: string;
}

export interface UpdateCommunityDTO {
    name?: string;
    description?: string;
    disabled?: boolean;
}

class CommunityService {
    private communities: Community[] = [];

    async listCommunities() {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao listar comunidades:', error);
                throw error;
            }

            return { data, error: null };
        } catch (error) {
            console.error('Erro ao listar comunidades:', error);
            return { data: null, error };
        }
    }

    async list(includeDisabled: boolean = false) {
        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('Usuário não autenticado');

            console.log('Buscando comunidades para o usuário:', userId);

            // Busca todas as comunidades onde o usuário é criador
            let createdQuery = supabase
                .from('communities')
                .select(`
                    *,
                    members:community_members(count),
                    competitions:competitions(count)
                `)
                .eq('created_by', userId);
            const { data: createdCommunities = [], error: createdError } = await createdQuery;

            if (createdError) {
                console.error('Erro ao listar comunidades criadas:', createdError);
                throw new Error('Erro ao listar comunidades');
            }

            // IDs das comunidades que o usuário criou
            const createdIds = createdCommunities.map(c => c.id);

            // Primeiro busca os IDs das comunidades onde o usuário é organizador
            const { data: organizedIds = [], error: organizedIdsError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', userId)
                .not('community_id', 'in', `(${createdIds.join(',')})`); // Excluir comunidades que já é criador

            if (organizedIdsError) {
                console.error('Erro ao buscar IDs de comunidades organizadas:', organizedIdsError);
                throw new Error('Erro ao listar comunidades');
            }

            // Depois busca os detalhes dessas comunidades
            let organizedQuery = supabase
                .from('communities')
                .select(`
                    *,
                    members:community_members(count),
                    competitions:competitions(count)
                `)
                .in('id', organizedIds.map(org => org.community_id));
            const { data: organizedCommunities = [], error: organizedError } = await organizedQuery;

            if (organizedError) {
                console.error('Erro ao buscar detalhes das comunidades organizadas:', organizedError);
                throw new Error('Erro ao listar comunidades');
            }

            console.log('Comunidades encontradas:', {
                criadas: createdCommunities.length,
                organizadas: organizedCommunities.length
            });

            // Assume que todas as comunidades estão habilitadas se não tiver a coluna disabled
            const processedCreatedCommunities = createdCommunities.map(c => ({
                ...c,
                members_count: c.members?.[0]?.count || 0,
                competitions_count: c.competitions?.[0]?.count || 0,
                disabled: c.disabled || false
            }));
            
            const processedOrganizedCommunities = organizedCommunities.map(c => ({
                ...c,
                members_count: c.members?.[0]?.count || 0,
                competitions_count: c.competitions?.[0]?.count || 0,
                disabled: c.disabled || false
            }));
            
            // Se includeDisabled for false, filtra as comunidades desabilitadas no lado do cliente
            const filteredCreated = includeDisabled 
                ? processedCreatedCommunities 
                : processedCreatedCommunities.filter(c => !c.disabled);
                
            const filteredOrganized = includeDisabled 
                ? processedOrganizedCommunities 
                : processedOrganizedCommunities.filter(c => !c.disabled);

            return {
                created: filteredCreated,
                organized: filteredOrganized
            };
        } catch (error) {
            console.error('Erro ao listar comunidades:', error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            console.log('Buscando comunidade por ID:', id);
            
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erro ao buscar comunidade:', error);
                throw error;
            }
            
            console.log('Comunidade encontrada:', data);
            return data;
        } catch (error) {
            console.error('Erro ao buscar comunidade:', error);
            throw error;
        }
    }

    async createCommunity(community: CreateCommunityDTO) {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Limitar criação de comunidades: free plan só 1
            const subscription = await subscriptionService.getUserSubscription(userData.user.id);
            if (subscription?.plans.slug === 'free') {
                const { count, error: countError } = await supabase
                    .from('communities')
                    .select('id', { count: 'exact', head: true })
                    .eq('created_by', userData.user.id);
                if (countError) throw countError;
                if ((count || 0) >= 1) throw new Error('Plano gratuito permite criar apenas 1 comunidade');
            }

            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('communities')
                .insert({
                    ...community,
                    created_by: userData.user.id,
                    created_at: now,
                    updated_at: now
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar comunidade:', error);
                throw error;
            }

            // Atualiza a lista de comunidades em memória
            await this.list();

            return { data, error: null };
        } catch (error) {
            console.error('Erro ao criar comunidade:', error);
            return { data: null, error };
        }
    }

    async create(data: CreateCommunityDTO) {
        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('Usuário não autenticado');

            // Limitar criação de comunidades: free plan só 1
            const subscription = await subscriptionService.getUserSubscription(userId);
            if (subscription?.plans.slug === 'free') {
                const { count, error: countError } = await supabase
                    .from('communities')
                    .select('id', { count: 'exact', head: true })
                    .eq('created_by', userId);
                if (countError) throw countError;
                if ((count || 0) >= 1) throw new Error('Plano gratuito permite criar apenas 1 comunidade');
            }

            const { data: community, error } = await supabase
                .from('communities')
                .insert([
                    {
                        ...data,
                        created_by: userId
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar comunidade:', error);
                throw error;
            }

            // Adicionar o criador como organizador
            // Primeiro, verificar se já existe como organizador
            const { data: existingOrganizer, error: checkError } = await supabase
                .from('community_organizers')
                .select('id')
                .eq('community_id', community.id)
                .eq('user_id', userId)
                .maybeSingle();

            if (checkError) {
                console.error('Erro ao verificar organizador existente:', checkError);
                // Não vamos lançar o erro aqui para não impedir a criação da comunidade
            }

            // Só adiciona se não existir ainda
            if (!existingOrganizer) {
                const { error: organizerError } = await supabase
                    .from('community_organizers')
                    .insert([
                        {
                            community_id: community.id,
                            user_id: userId,
                            created_by: userId
                        }
                    ]);

                if (organizerError) {
                    console.error('Erro ao adicionar criador como organizador:', organizerError);
                    // Não vamos lançar o erro aqui para não impedir a criação da comunidade
                }
            }

            // Registrar a atividade de criação da comunidade com sistema de retry
            if (community) {
                const maxRetries = 3;
                const baseDelay = 1000; // 1 segundo

                const createActivityWithRetry = async (attempt: number) => {
                    try {
                        console.log(`Tentativa ${attempt} de criar atividade...`);
                        await activityService.createActivity({
                            type: 'community',
                            description: `Nova comunidade "${data.name}" foi criada`,
                            metadata: {
                                community_id: community.id,
                                name: community.name,
                                description: community.description
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

            return community;
        } catch (error: any) {
            // Propaga erro de limite free para UI tratar
            if (error?.message?.includes('Plano gratuito permite criar apenas 1 comunidade')) {
                throw error;
            }
            console.error('Erro ao criar comunidade:', error);
            return { data: null, error };
        }
    }

    async updateCommunity(id: string, updates: UpdateCommunityDTO) {
        try {
            // Se temos a propriedade disabled, vamos tentar atualizar diretamente
            if (updates.disabled !== undefined) {
                try {
                    const { data, error } = await supabase
                        .from('communities')
                        .update(updates)
                        .eq('id', id)
                        .select()
                        .single();
                    
                    if (!error) {
                        // Atualiza a lista de comunidades em memória
                        await this.list();
                        return { data, error: null };
                    }
                    
                    // Se o erro for relacionado à coluna disabled, vamos continuar com as outras atualizações
                    if (error.message?.includes('disabled')) {
                        console.log('Coluna disabled não existe, continuando com outras atualizações');
                        // Removemos a propriedade disabled para tentar atualizar o resto
                        const { disabled, ...otherUpdates } = updates;
                        
                        // Se não temos mais nada para atualizar, retornamos sucesso
                        if (Object.keys(otherUpdates).length === 0) {
                            // Buscamos a comunidade atual para retornar
                            const { data: community } = await supabase
                                .from('communities')
                                .select('*')
                                .eq('id', id)
                                .single();
                                
                            return { data: community, error: null };
                        }
                        
                        // Atualizamos o resto
                        return this.updateCommunity(id, otherUpdates);
                    }
                    
                    // Se for outro tipo de erro, lançamos
                    throw error;
                } catch (error) {
                    console.error('Erro ao atualizar comunidade com disabled:', error);
                    throw error;
                }
            } else {
                // Caso não tenha a propriedade disabled, atualiza normalmente
                const { data, error } = await supabase
                    .from('communities')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    console.error('Erro ao atualizar comunidade:', error);
                    throw error;
                }

                // Atualiza a lista de comunidades em memória
                await this.list();

                return { data, error: null };
            }
        } catch (error) {
            console.error('Erro ao atualizar comunidade:', error);
            return { data: null, error };
        }
    }

    async deleteCommunity(id: string) {
        try {
            const { error } = await supabase
                .from('communities')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao excluir comunidade:', error);
                throw error;
            }

            // Atualiza a lista de comunidades em memória
            await this.list();

            return { error: null };
        } catch (error) {
            console.error('Erro ao excluir comunidade:', error);
            return { error };
        }
    }

    async searchCommunities(query: string) {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .ilike('name', `%${query}%`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao pesquisar comunidades:', error);
                throw error;
            }

            return { data, error: null };
        } catch (error) {
            console.error('Erro ao pesquisar comunidades:', error);
            return { data: null, error };
        }
    }
}

export const communityService = new CommunityService();
