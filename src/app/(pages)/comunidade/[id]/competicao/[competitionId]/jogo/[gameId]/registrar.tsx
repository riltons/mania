import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform,
    Text
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { gameService, VictoryType } from '@/services/gameService';
import { competitionService } from '@/services/competitionService';
import { InternalHeader } from '@/components/InternalHeader';
import CustomModal from '@/components/CustomModal';
import { useTheme } from '@/contexts/ThemeProvider';

interface VictoryOption {
    type: VictoryType;
    label: string;
    points: number;
    description: string;
}

interface Player {
    id: string;
    name: string;
}

const victoryOptions: VictoryOption[] = [
    {
        type: 'simple',
        label: 'Vitória Simples',
        points: 1,
        description: 'Vitória normal (1 ponto)'
    },
    {
        type: 'carroca',
        label: 'Vitória de Carroça',
        points: 2,
        description: 'Vitória com carroça (2 pontos)'
    },
    {
        type: 'la_e_lo',
        label: 'Vitória de Lá-e-lô',
        points: 3,
        description: 'Vitória de lá-e-lô (3 pontos)'
    },
    {
        type: 'cruzada',
        label: 'Vitória de Cruzada',
        points: 4,
        description: 'Vitória de cruzada (4 pontos)'
    },
    {
        type: 'contagem',
        label: 'Vitória por Contagem',
        points: 1,
        description: 'Vitória por contagem de pontos (1 ponto)'
    },
    {
        type: 'empate',
        label: 'Empate',
        points: 0,
        description: 'Empate (0 pontos + 1 ponto bônus na próxima)'
    }
];

export default function RegisterResult() {
    const router = useRouter();
    const { id: communityId, competitionId, gameId } = useLocalSearchParams();
    const { colors } = useTheme();
    const [selectedType, setSelectedType] = useState<VictoryType | null>(null);
    const [winnerTeam, setWinnerTeam] = useState<'team1' | 'team2' | null>(null);
    const [loading, setLoading] = useState(false);
    const [team1Players, setTeam1Players] = useState<Player[]>([]);
    const [team2Players, setTeam2Players] = useState<Player[]>([]);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showUndoButton, setShowUndoButton] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [currentScore, setCurrentScore] = useState({ team1: 0, team2: 0 });

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
        try {
            const game = await gameService.getById(gameId as string);
            if (!game) return;

            const team1 = await Promise.all(
                game.team1.map(playerId => competitionService.getPlayerById(playerId))
            );

            const team2 = await Promise.all(
                game.team2.map(playerId => competitionService.getPlayerById(playerId))
            );

            setTeam1Players(team1.filter(Boolean));
            setTeam2Players(team2.filter(Boolean));
            
            // Inicializar o placar atual
            setCurrentScore({
                team1: game.team1_score || 0,
                team2: game.team2_score || 0
            });
            
            // Mostrar o placar se o jogo já tiver pontos
            if (game.team1_score > 0 || game.team2_score > 0) {
                setShowScoreboard(true);
            }
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
            Alert.alert('Erro', 'Não foi possível carregar os jogadores');
        }
    };

    const handleRegisterResult = async () => {
        if (!selectedType) {
            Alert.alert('Erro', 'Selecione o tipo de vitória');
            return;
        }

        if (selectedType !== 'empate' && !winnerTeam) {
            Alert.alert('Erro', 'Selecione o time vencedor');
            return;
        }

        try {
            setLoading(true);
            const winnerTeamNumber = winnerTeam === 'team1' ? 1 : winnerTeam === 'team2' ? 2 : null;
            const result = await gameService.registerRound(gameId as string, selectedType, winnerTeamNumber);
            setLastResult(result);
            
            if (result.status === 'finished') {
                // Se o jogo foi finalizado, mostrar o modal de confirmação
                let message = 'Jogo finalizado!';
                if (result.team1_score === 6 && result.team2_score === 0) {
                    message = 'BUCHUDA! 🎉\nTime 1 venceu sem que o adversário marcasse pontos!';
                } else if (result.team2_score === 6 && result.team1_score === 0) {
                    message = 'BUCHUDA! 🎉\nTime 2 venceu sem que o adversário marcasse pontos!';
                } else if (result.team1_was_losing_5_0) {
                    message = 'BUCHUDA DE RÉ! 🎉🔄\nIncrível virada do Time 1 após estar perdendo de 5x0!';
                } else if (result.team2_was_losing_5_0) {
                    message = 'BUCHUDA DE RÉ! 🎉🔄\nIncrível virada do Time 2 após estar perdendo de 5x0!';
                }
                
                // Atualizar o placar atual
                setCurrentScore({
                    team1: result.team1_score,
                    team2: result.team2_score
                });
                
                // Mostrar o placar
                setShowScoreboard(true);
                
                // Mostrar o modal de confirmação para o resultado final
                setShowConfirmationModal(true);
            } else {
                // Se o jogo não foi finalizado, mostrar o botão de desfazer e exibir o placar atual
                setShowUndoButton(true);
                // Resetar os campos para permitir o registro do próximo resultado
                setSelectedType(null);
                setWinnerTeam(null);
                
                // Atualizar o placar atual
                setCurrentScore({
                    team1: result.team1_score,
                    team2: result.team2_score
                });
                
                // Mostrar o placar
                setShowScoreboard(true);
            }
        } catch (error) {
            console.error('Erro ao registrar resultado:', error);
            Alert.alert('Erro', 'Não foi possível registrar o resultado');
        } finally {
            setLoading(false);
        }
    };

    const handleUndoLastResult = async () => {
        try {
            setLoading(true);
            const result = await gameService.undoLastRound(gameId as string);
            Alert.alert('Sucesso', 'Último resultado desfeito com sucesso');
            setShowConfirmationModal(false);
            
            // Atualizar o placar após desfazer
            if (result) {
                setCurrentScore({
                    team1: result.team1_score,
                    team2: result.team2_score
                });
                
                // Esconder o placar se não houver mais pontos
                if (result.team1_score === 0 && result.team2_score === 0) {
                    setShowScoreboard(false);
                }
            } else {
                // Se não houver resultado, voltar à tela anterior
                router.back();
            }
        } catch (error) {
            console.error('Erro ao desfazer resultado:', error);
            Alert.alert('Erro', 'Não foi possível desfazer o último resultado');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LoadingContainer colors={colors}>
                <ActivityIndicator size="large" color={colors.primary} />
            </LoadingContainer>
        );
    }

    return (
        <Container colors={colors}>
            <InternalHeader title="Registrar Resultado" onBackPress={() => router.back()} />
            <MainContent 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                {showScoreboard && (
                    <ScoreboardContainer colors={colors}>
                        <ScoreboardTitle colors={colors}>Placar Atual</ScoreboardTitle>
                        <ScoreboardContent>
                            <TeamScoreContainer>
                                <TeamName colors={colors}>
                                    {team1Players.map((player, index) => (
                                        <React.Fragment key={player.id}>
                                            {player.name}
                                            {index < team1Players.length - 1 ? ' e ' : ''}
                                        </React.Fragment>
                                    ))}
                                </TeamName>
                                <TeamScore colors={colors}>{currentScore.team1}</TeamScore>
                            </TeamScoreContainer>
                            
                            <ScoreboardDivider colors={colors}>x</ScoreboardDivider>
                            
                            <TeamScoreContainer>
                                <TeamName colors={colors}>
                                    {team2Players.map((player, index) => (
                                        <React.Fragment key={player.id}>
                                            {player.name}
                                            {index < team2Players.length - 1 ? ' e ' : ''}
                                        </React.Fragment>
                                    ))}
                                </TeamName>
                                <TeamScore colors={colors}>{currentScore.team2}</TeamScore>
                            </TeamScoreContainer>
                        </ScoreboardContent>
                    </ScoreboardContainer>
                )}
                
                <SectionTitle colors={colors}>Tipo de Vitória</SectionTitle>

                <VictoryOptionsGrid>
                    {victoryOptions.map(option => {
                        // Determinar se este card está selecionado
                        const isSelected = selectedType === option.type;
                        return (
                            <VictoryOptionWrapper key={option.type}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        // Limpar seleção anterior se clicar no mesmo card
                                        if (selectedType === option.type) {
                                            setSelectedType(null);
                                        } else {
                                            // Selecionar novo tipo
                                            setSelectedType(option.type);
                                            if (option.type === 'empate') {
                                                setWinnerTeam(null);
                                            }
                                        }
                                    }}
                                    style={{
                                        backgroundColor: isSelected ? colors.primary : colors.card,
                                        borderRadius: 8,
                                        padding: 16,
                                        marginBottom: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderWidth: 1,
                                        borderColor: isSelected ? '#fff' : colors.border
                                    }}
                                >
                                    <View style={{ flex: 1, marginRight: 16 }}>
                                        <Text style={{
                                            color: colors.text,
                                            fontSize: 16,
                                            fontWeight: 'bold'
                                        }}>{option.label}</Text>
                                        <Text style={{
                                            color: colors.textSecondary,
                                            fontSize: 14,
                                            marginTop: 4
                                        }}>{option.description}</Text>
                                    </View>
                                    {isSelected && (
                                        <Feather name="check" size={24} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </VictoryOptionWrapper>
                        );
                    })}
                </VictoryOptionsGrid>

                {selectedType && selectedType !== 'empate' && (
                    <>
                        <SectionTitle colors={colors}>Time Vencedor</SectionTitle>
                        <View style={{ flexDirection: 'row', margin: -4 }}>
                            {[{id: 'team1', players: team1Players}, {id: 'team2', players: team2Players}].map((team) => {
                                const isSelected = winnerTeam === team.id;
                                return (
                                    <TouchableOpacity
                                        key={team.id}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            // Limpar seleção se clicar no mesmo time
                                            if (winnerTeam === team.id) {
                                                setWinnerTeam(null);
                                            } else {
                                                setWinnerTeam(team.id as 'team1' | 'team2');
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            backgroundColor: isSelected ? colors.primary : colors.card,
                                            borderRadius: 8,
                                            padding: 16,
                                            margin: 4,
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: isSelected ? '#fff' : colors.border,
                                            position: 'relative'
                                        }}
                                    >
                                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                            {team.players.map((player, index) => (
                                                <Text 
                                                    key={player.id} 
                                                    style={{
                                                        color: colors.text,
                                                        fontSize: 16,
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {player.name}
                                                    {index < team.players.length - 1 ? ' e ' : ''}
                                                </Text>
                                            ))}
                                        </View>
                                        {isSelected && (
                                            <Feather 
                                                name="check" 
                                                size={24} 
                                                color="#fff" 
                                                style={{position: 'absolute', right: 16, top: 16}} 
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                <RegisterButton onPress={handleRegisterResult} colors={colors}>
                    <RegisterButtonText colors={colors}>Registrar Resultado</RegisterButtonText>
                </RegisterButton>
                
                <UndoButton 
                    onPress={handleUndoLastResult} 
                    colors={colors}
                    style={{ opacity: showUndoButton ? 1 : 0 }}
                    disabled={!showUndoButton}
                >
                    <UndoButtonText colors={colors}>Desfazer Último Resultado</UndoButtonText>
                </UndoButton>
            </MainContent>

            {/* Modal de confirmação para resultado final */}
            <CustomModal
                visible={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                colors={colors}
                title="Jogo Finalizado!"
                subtitle={lastResult ? `Placar Final: ${lastResult.team1_score} x ${lastResult.team2_score}` : "Confirmar o resultado final?"}
            >
                <ModalButtonsContainer>
                    <ModalButton
                        onPress={() => {
                            setShowConfirmationModal(false);
                            router.back();
                        }}
                        colors={colors}
                        variant="primary"
                    >
                        <ModalButtonText colors={colors}>Confirmar</ModalButtonText>
                    </ModalButton>
                    <ModalButton
                        onPress={handleUndoLastResult}
                        colors={colors}
                        variant="secondary"
                    >
                        <ModalButtonText colors={colors}>Desfazer Último Resultado</ModalButtonText>
                    </ModalButton>
                </ModalButtonsContainer>
            </CustomModal>
        </Container>
    );
}

const Container = styled.View<{ colors: any }>`
    flex: 1;
    background-color: ${props => props.colors.background};
`;

const LoadingContainer = styled.View<{ colors: any }>`
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: ${props => props.colors.background};
`;

const MainContent = styled.ScrollView`
    flex: 1;
    padding: 16px;
`;

const SectionTitle = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
    margin-top: 24px;
`;

const VictoryOptionsGrid = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    margin: -4px;
`;

const VictoryOptionWrapper = styled.View`
    width: 50%;
    padding: 4px;
`;

const VictoryOption = styled.TouchableOpacity<{ selected: boolean, colors: any }>`
    background-color: ${props => props.selected ? props.colors.primary : props.colors.card};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${props => props.selected ? '#fff' : props.colors.border};
`;

const VictoryOptionContent = styled.View`
    flex: 1;
    margin-right: 16px;
`;

const VictoryTitle = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 16px;
    font-weight: bold;
`;

const VictoryDescription = styled.Text<{ colors: any }>`
    color: ${props => props.colors.textSecondary};
    font-size: 14px;
    margin-top: 4px;
`;

const TeamOptions = styled.View`
    flex-direction: row;
    margin: -4px;
`;

const TeamOption = styled.TouchableOpacity<{ selected: boolean, colors: any }>`
    flex: 1;
    background-color: ${props => props.selected ? props.colors.primary : props.colors.card};
    border-radius: 8px;
    padding: 16px;
    margin: 4px;
    align-items: center;
    border: 1px solid ${props => props.selected ? '#fff' : props.colors.border};
    position: relative;
`;

const TeamOptionContent = styled.View`
    align-items: center;
    justify-content: center;
`;

const TeamOptionText = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 16px;
    text-align: center;
`;

const RegisterButton = styled.TouchableOpacity<{ colors: any }>`
    background-color: ${props => props.colors.primary};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    margin-top: 24px;
    margin-bottom: 24px;
`;

const RegisterButtonText = styled.Text<{ colors: any }>`
    color: ${props => props.colors.buttonText};
    font-size: 16px;
    font-weight: bold;
`;

const ModalButtonsContainer = styled.View`
    flex-direction: column;
    width: 100%;
    gap: 12px;
`;

const ModalButton = styled.TouchableOpacity<{ colors: any, variant: 'primary' | 'secondary' }>`
    background-color: ${props => props.variant === 'primary' ? props.colors.primary : props.colors.card};
    padding: 16px;
    border-radius: 8px;
    align-items: center;
    border: 1px solid ${props => props.variant === 'primary' ? props.colors.primary : props.colors.border};
`;

const ModalButtonText = styled.Text<{ colors: any }>`
    color: ${props => props.colors.buttonText};
    font-size: 16px;
    font-weight: bold;
`;

const UndoButton = styled.TouchableOpacity<{ colors: any }>`
    background-color: ${props => props.colors.card};
    padding: 12px;
    border-radius: 8px;
    align-items: center;
    margin-top: 8px;
    border: 1px solid ${props => props.colors.border};
`;

const UndoButtonText = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 14px;
    font-weight: bold;
`;

const ScoreboardContainer = styled.View<{ colors: any }>`
    background-color: ${props => props.colors.card};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    border: 1px solid ${props => props.colors.border};
`;

const ScoreboardTitle = styled.Text<{ colors: any }>`
    color: ${props => props.colors.text};
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 12px;
`;

const ScoreboardContent = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`;

const TeamScoreContainer = styled.View`
    flex: 1;
    align-items: center;
`;

const TeamName = styled.Text<{ colors: any }>`
    color: ${props => props.colors.textSecondary};
    font-size: 14px;
    text-align: center;
    margin-bottom: 8px;
`;

const TeamScore = styled.Text<{ colors: any }>`
    color: ${props => props.colors.primary};
    font-size: 32px;
    font-weight: bold;
`;

const ScoreboardDivider = styled.Text<{ colors: any }>`
    color: ${props => props.colors.textSecondary};
    font-size: 24px;
    font-weight: bold;
    margin: 0 16px;
`;
