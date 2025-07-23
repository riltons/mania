import { supabase } from '@/core/lib/supabase';
import { activityService } from '@/services/activityService';

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
    members?: Array<{ count: number }>;
    competitions?: Array<{ count: number }>;
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

            return data as Community[];
        } catch (error) {
            console.error('Erro ao listar comunidades:', error);
            throw error;
        }
    }

    async searchCommunities(query: string): Promise<Community[]> {
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

            return data as Community[];
        } catch (error) {
            console.error('Erro ao pesquisar comunidades:', error);
            throw error;
        }
    }

    async list(includeDisabled: boolean = false): Promise<{ created: Community[]; organized: Community[] }> {
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
                
            // Se não incluir desabilitadas, filtra apenas as ativas
            if (!includeDisabled) {
                createdQuery = createdQuery.eq('disabled', false);
            }
                
            const { data: createdCommunities = [], error: createdError } = await createdQuery;

            if (createdError) {
                console.error('Erro ao listar comunidades criadas:', createdError);
                throw new Error('Erro ao listar comunidades');
            }

            // Processa as comunidades criadas
            const processedCreatedCommunities = (createdCommunities || []).map(c => ({ 
                id: c.id,
                name: c.name,
                description: c.description,
                created_by: c.created_by,
                created_at: c.created_at,
                updated_at: c.updated_at,
                is_organizer: true,
                members_count: c.members?.[0]?.count || 0,
                competitions_count: c.competitions?.[0]?.count || 0,
                disabled: c.disabled || false
            }) as Community);

            // IDs das comunidades que o usuário criou
            const createdIds = processedCreatedCommunities.map(c => c.id);

            // Primeiro busca os IDs das comunidades onde o usuário é organizador
            const { data: organizedIds = [], error: organizedIdsError } = await supabase
                .from('community_organizers')
                .select('community_id')
                .eq('user_id', userId)
                .not('community_id', 'in', createdIds.length > 0 ? `(${createdIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)'); // Excluir comunidades que já é criador

            if (organizedIdsError) {
                console.error('Erro ao buscar IDs de comunidades organizadas:', organizedIdsError);
                throw new Error('Erro ao listar comunidades');
            }

            // Se não há comunidades organizadas, retorna apenas as criadas
            if (!organizedIds.length) {
                // Atualiza a lista em memória
                this.communities = processedCreatedCommunities;
                
                return {
                    created: processedCreatedCommunities,
                    organized: []
                };
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
                
            // Se não incluir desabilitadas, filtra apenas as ativas
            if (!includeDisabled) {
                organizedQuery = organizedQuery.eq('disabled', false);
            }
                
            const { data: organizedCommunities = [], error: organizedError } = await organizedQuery;

            if (organizedError) {
                console.error('Erro ao buscar detalhes das comunidades organizadas:', organizedError);
                throw new Error('Erro ao listar comunidades');
            }

            // Processa as comunidades organizadas
            const processedOrganizedCommunities = (organizedCommunities || []).map(c => ({ 
                id: c.id,
                name: c.name,
                description: c.description,
                created_by: c.created_by,
                created_at: c.created_at,
                updated_at: c.updated_at,
                is_organizer: true,
                members_count: c.members?.[0]?.count || 0,
                competitions_count: c.competitions?.[0]?.count || 0,
                disabled: c.disabled || false
            }) as Community);

            // Combina todas as comunidades para a lista em memória
            const allCommunities = [
                ...processedCreatedCommunities,
                ...processedOrganizedCommunities
            ];

            // Atualiza a lista em memória
            this.communities = allCommunities;
            
            return {
                created: processedCreatedCommunities,
                organized: processedOrganizedCommunities
            };
        } catch (error) {
            console.error('Erro ao listar comunidades:', error);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            console.log('Buscando comunidade por ID:', id);
            
            const { data: community, error } = await supabase
                .from('communities')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Erro ao buscar comunidade:', error);
                throw error;
            }

            return community as Community;
        } catch (error) {
            console.error('Erro ao buscar comunidade:', error);
            throw error;
        }
    }

    async createCommunity(community: CreateCommunityDTO) {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Verificar se o usuário já tem comunidades criadas
            const { count, error: countError } = await supabase
                .from('communities')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', userData.user.id);
            if (countError) throw countError;
            // Permitir até 3 comunidades por usuário
            if ((count || 0) >= 3) throw new Error('Você atingiu o limite máximo de 3 comunidades');

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

            return data as Community;
        } catch (error) {
            console.error('Erro ao criar comunidade:', error);
            throw error;
        }
    }

    async create(data: CreateCommunityDTO): Promise<Community> {
        try {
            console.log('Iniciando criação de comunidade:', data.name);
            
            // Verificar autenticação do usuário
            const { data: userData, error: authError } = await supabase.auth.getUser();
            if (authError || !userData.user?.id) {
                console.error('Erro de autenticação:', authError);
                throw new Error('Usuário não autenticado');
            }
            
            const userId = userData.user.id;
            console.log('Usuário autenticado:', userId);
            
            // Verificar se o usuário já tem comunidades criadas
            console.log('Verificando limite de comunidades...');
            const { count, error: countError } = await supabase
                .from('communities')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', userId);
                
            if (countError) {
                console.error('Erro ao verificar limite de comunidades:', countError);
                throw countError;
            }
            
            // Permitir até 3 comunidades por usuário
            if ((count || 0) >= 3) {
                console.error('Limite de comunidades atingido:', count);
                throw new Error('Você atingiu o limite máximo de 3 comunidades');
            }
            
            console.log('Chamando função create_community_direct...');
            // Usar a função create_community_direct para criar a comunidade
            const { data: community, error } = await supabase
                .rpc('create_community_direct', {
                    p_name: data.name,
                    p_description: data.description
                })
                .single();
            
            if (error) {
                console.error('Erro ao criar comunidade via RPC:', error);
                throw error;
            }
            
            if (!community) {
                console.error('Comunidade não foi criada, mas não houve erro');
                throw new Error('Falha ao criar comunidade');
            }
            
            console.log('Comunidade criada com sucesso:', community.id);
            
            // Registrar a atividade de criação da comunidade com sistema de retry
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
                            name: community.name
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
            
            // Iniciar o processo de criação da atividade em background
            createActivityWithRetry(1).catch(error => {
                console.error('Erro ao criar atividade:', error);
            });
            
            return community as Community;
        } catch (error: any) {
            // Propaga erro de limite free para UI tratar
            if (error?.message?.includes('Plano gratuito permite criar apenas 1 comunidade')) {
                throw error;
            }
            console.error('Erro ao criar comunidade:', error);
            throw error;
        }
    }

    async updateCommunity(id: string, updates: UpdateCommunityDTO): Promise<Community | null> {
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
                        return data as Community;
                    }
                    
                    // Se o erro for relacionado à coluna disabled, vamos continuar com as outras atualizações
                    if (error.message?.includes('disabled')) {
                        console.log('Coluna disabled não existe, continuando com outras atualizações');
                        // Removemos a propriedade disabled para tentar atualizar o resto
                        const { disabled, ...otherUpdates } = updates;
                        
                        // Se não temos mais nada para atualizar, retornamos sucesso
                        if (Object.keys(otherUpdates).length === 0) {
                            // Buscamos a comunidade atual para retornar
                            const { data: community, error } = await supabase
                                .from('communities')
                                .select('*')
                                .eq('id', id)
                                .single();
                                
                            if (error) {
                                throw error;
                            }
                            
                            return community as Community;
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
                const { name, description } = updates;
                const { data: community, error } = await supabase
                    .from('communities')
                    .update({ name, description })
                    .eq('id', id)
                    .select('*')
                    .single();

                if (error) {
                    console.error('Erro ao atualizar comunidade:', error);
                    throw error;
                }

                // Atualiza a lista de comunidades em memória
                await this.list();

                return community as Community;
            }
        } catch (error) {
            console.error('Erro ao atualizar comunidade:', error);
            return null;
        }
    }

    async deleteCommunity(id: string): Promise<void> {
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
        } catch (error) {
            console.error('Erro ao excluir comunidade:', error);
            throw error;
        }
    }
}

export const communityService = new CommunityService();
