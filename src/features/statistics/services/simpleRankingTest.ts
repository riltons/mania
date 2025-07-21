// Teste simples para verificar se o problema está no import ou na execução
export const simpleRankingTest = async () => {
    console.log('[SimpleTest] Iniciando teste simples...');
    
    try {
        // Teste básico sem imports complexos
        const testData = {
            players: [
                { id: '1', name: 'Jogador 1', wins: 5, losses: 2, winRate: 71.4 },
                { id: '2', name: 'Jogador 2', wins: 3, losses: 4, winRate: 42.9 }
            ],
            pairs: [
                { 
                    id: '1_2', 
                    player1: { id: '1', name: 'Jogador 1' },
                    player2: { id: '2', name: 'Jogador 2' },
                    wins: 2, 
                    losses: 1, 
                    winRate: 66.7 
                }
            ]
        };
        
        console.log('[SimpleTest] Dados de teste criados:', testData);
        return testData;
        
    } catch (error) {
        console.error('[SimpleTest] Erro no teste simples:', error);
        throw error;
    }
};

// Função que simula o rankingService
export const mockRankingService = {
    async getTopPlayers() {
        console.log('[MockRanking] getTopPlayers chamado');
        return [
            { id: '1', name: 'Jogador 1', wins: 5, losses: 2, winRate: 71.4, totalGames: 7, buchudas: 1, points: 45 },
            { id: '2', name: 'Jogador 2', wins: 3, losses: 4, winRate: 42.9, totalGames: 7, buchudas: 0, points: 32 }
        ];
    },
    
    async getTopPairs() {
        console.log('[MockRanking] getTopPairs chamado');
        return [
            { 
                id: '1_2', 
                player1: { id: '1', name: 'Jogador 1', avatar_url: null },
                player2: { id: '2', name: 'Jogador 2', avatar_url: null },
                wins: 2, 
                losses: 1, 
                totalGames: 3,
                winRate: 66.7,
                buchudas: 0,
                buchudasTaken: 0,
                buchudasDeRe: 0,
                buchudasDeReTaken: 0,
                pointsGained: 18,
                pointsLost: 12
            }
        ];
    }
};
