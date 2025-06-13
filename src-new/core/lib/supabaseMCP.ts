import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/types';

// Credenciais do Supabase obtidas do arquivo de anotações
// Pega do extra do Expo ou das variáveis de ambiente
const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string,string>;
const supabaseUrl = expoExtra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = expoExtra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Verificação de ambiente
console.log('Inicializando cliente Supabase MCP...');

// Adapters de armazenamento para diferentes plataformas
const webAdapter = {
    getItem: (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return Promise.resolve(item);
        } catch {
            return Promise.resolve(null);
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
};

const mobileAdapter = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

// Escolher o adapter apropriado baseado na plataforma
const storageAdapter = Platform.OS === 'web' ? webAdapter : mobileAdapter;

// Configuração do cliente Supabase com MCP
export const supabaseMCP = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
    },
    global: {
        headers: {
            'X-MCP-Version': '1.0.0',
        },
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Classe para gerenciar o contexto do modelo
export class ModelContextProtocol {
    private static instance: ModelContextProtocol;
    private context: Record<string, any> = {};

    private constructor() {}

    public static getInstance(): ModelContextProtocol {
        if (!ModelContextProtocol.instance) {
            ModelContextProtocol.instance = new ModelContextProtocol();
        }
        return ModelContextProtocol.instance;
    }

    // Definir contexto para uma entidade específica
    public setContext(entityName: string, data: any): void {
        this.context[entityName] = data;
        console.log(`Contexto atualizado para ${entityName}`);
    }

    // Obter contexto para uma entidade específica
    public getContext(entityName: string): any {
        return this.context[entityName];
    }

    // Limpar contexto para uma entidade específica
    public clearContext(entityName: string): void {
        delete this.context[entityName];
        console.log(`Contexto removido para ${entityName}`);
    }

    // Limpar todo o contexto
    public clearAllContext(): void {
        this.context = {};
        console.log('Todo o contexto foi limpo');
    }
}

// Funções de utilidade para operações comuns do MCP
export const MCPUtils = {
    // Inicializar o MCP com dados iniciais
    initialize: async (initialData?: Record<string, any>) => {
        const mcp = ModelContextProtocol.getInstance();
        if (initialData) {
            Object.entries(initialData).forEach(([key, value]) => {
                mcp.setContext(key, value);
            });
        }
        console.log('MCP inicializado com sucesso');
        return mcp;
    },

    // Buscar dados do Supabase e atualizar o contexto
    fetchAndUpdateContext: async (tableName: string, query: any) => {
        try {
            const { data, error } = await supabaseMCP
                .from(tableName)
                .select();

            if (error) throw error;

            const mcp = ModelContextProtocol.getInstance();
            mcp.setContext(tableName, data);
            return { data, error: null };
        } catch (error) {
            console.error(`Erro ao buscar dados da tabela ${tableName}:`, error);
            return { data: null, error };
        }
    },

    // Enviar dados para o Supabase e atualizar o contexto
    sendAndUpdateContext: async (tableName: string, payload: any) => {
        try {
            const { data, error } = await supabaseMCP
                .from(tableName)
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            // Atualizar o contexto com os novos dados
            const mcp = ModelContextProtocol.getInstance();
            const currentData = mcp.getContext(tableName) || [];
            mcp.setContext(tableName, [...currentData, data]);

            return { data, error: null };
        } catch (error) {
            console.error(`Erro ao inserir dados na tabela ${tableName}:`, error);
            return { data: null, error };
        }
    },

    // Atualizar dados no Supabase e no contexto
    updateAndSyncContext: async (tableName: string, id: string, updates: any) => {
        try {
            const { data, error } = await supabaseMCP
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Atualizar o contexto com os dados atualizados
            const mcp = ModelContextProtocol.getInstance();
            const currentData = mcp.getContext(tableName) || [];
            const updatedData = currentData.map((item: any) => 
                item.id === id ? { ...item, ...updates } : item
            );
            mcp.setContext(tableName, updatedData);

            return { data, error: null };
        } catch (error) {
            console.error(`Erro ao atualizar dados na tabela ${tableName}:`, error);
            return { data: null, error };
        }
    },

    // Excluir dados no Supabase e atualizar o contexto
    deleteAndUpdateContext: async (tableName: string, id: string) => {
        try {
            const { error } = await supabaseMCP
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Atualizar o contexto removendo o item excluído
            const mcp = ModelContextProtocol.getInstance();
            const currentData = mcp.getContext(tableName) || [];
            const filteredData = currentData.filter((item: any) => item.id !== id);
            mcp.setContext(tableName, filteredData);

            return { success: true, error: null };
        } catch (error) {
            console.error(`Erro ao excluir dados da tabela ${tableName}:`, error);
            return { success: false, error };
        }
    },

    // Configurar listeners para atualizações em tempo real
    setupRealtimeListeners: (tableName: string, callback: (payload: any) => void) => {
        const subscription = supabaseMCP
            .channel(`public:${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
                // Atualizar o contexto com base no evento
                const mcp = ModelContextProtocol.getInstance();
                const currentData = mcp.getContext(tableName) || [];
                
                if (payload.eventType === 'INSERT') {
                    mcp.setContext(tableName, [...currentData, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedData = currentData.map((item: any) => 
                        item.id === payload.new.id ? payload.new : item
                    );
                    mcp.setContext(tableName, updatedData);
                } else if (payload.eventType === 'DELETE') {
                    const filteredData = currentData.filter((item: any) => item.id !== payload.old.id);
                    mcp.setContext(tableName, filteredData);
                }
                
                // Executar callback personalizado
                callback(payload);
            })
            .subscribe();
        
        return subscription;
    },
};

// Exportar uma instância padrão do MCP
export const MCP = ModelContextProtocol.getInstance();
