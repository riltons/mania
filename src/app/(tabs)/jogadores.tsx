import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { Header } from '@/core/components/layout/Header';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { playerService } from '@/features/players/services/playerService';
import { PlayerAvatar } from '@/core/components/data-display/PlayerAvatar';
import { FloatingButton } from '@/core/components/ui';

export default function JogadoresScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<{
    myPlayers: any[],
    communityPlayers: any[]
  }>({ myPlayers: [], communityPlayers: [] });

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await playerService.list(true);
      setPlayers(playersData);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os jogadores. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlayers();
    }, [])
  );

  const handlePlayerPress = (player: any) => {
    router.push(`/(pages)/jogador/jogador/${player.id}/jogos`);
  };

  const handleEditPlayer = (player: any) => {
    router.push(`/(pages)/jogador/jogador/${player.id}/editar`);
  };

  const handleDeletePlayer = async (player: any) => {
    Alert.alert(
      'Excluir Jogador',
      `Tem certeza que deseja excluir ${player.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await playerService.delete(player.id);
              loadPlayers();
            } catch (error) {
              console.error('Erro ao excluir jogador:', error);
              Alert.alert('Erro', 'Não foi possível excluir o jogador.');
            }
          }
        }
      ]
    );
  };

  const renderPlayerItem = ({ item, isMyPlayer }: { item: any, isMyPlayer: boolean }) => (
    <TouchableOpacity 
      style={styles.playerCard} 
      onPress={() => handlePlayerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.playerHeader}>
        <PlayerAvatar 
          avatarUrl={item.avatar_url} 
          name={item.name} 
          size={50} 
        />
        <View style={styles.playerInfo}>
          <View style={styles.nameContainer}>
            <Text style={[styles.playerName, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            {item.isLinkedUser && (
              <View style={styles.linkedBadge}>
                <MaterialCommunityIcons name="account-check" size={14} color={colors.success} />
                <Text style={[styles.linkedText, { color: colors.success }]}>Vinculado</Text>
              </View>
            )}
          </View>
          {item.nickname && (
            <Text style={[styles.playerNickname, { color: colors.textSecondary }]}>
              @{item.nickname}
            </Text>
          )}
          {item.phone && (
            <View style={styles.phoneContainer}>
              <MaterialCommunityIcons name="phone" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.playerPhone, { color: colors.textSecondary }]}>
                {item.phone}
              </Text>
            </View>
          )}
        </View>
      </View>

      {item.stats && (
        <View style={[styles.statsContainer, { borderTopColor: `${colors.border}40` }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {item.stats.total_games || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Jogos
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {item.stats.wins || 0}/{item.stats.losses || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              V/D
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {item.stats.buchudas || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Buchudas
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.actionsContainer, { borderTopColor: `${colors.border}40` }]}>
        <Pressable 
          style={[styles.actionButton, { backgroundColor: `${colors.backgroundLight}` }]}
          onPress={() => handleEditPlayer(item)}
        >
          <Feather name="edit-2" size={20} color={colors.primary} />
        </Pressable>
        
        {isMyPlayer && (
          <Pressable 
            style={[styles.actionButton, { backgroundColor: `${colors.backgroundLight}` }]}
            onPress={() => handleDeletePlayer(item)}
          >
            <Feather name="trash-2" size={20} color={colors.error} />
          </Pressable>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
      {title}
    </Text>
  );

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="account-off-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Jogadores" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Jogadores" />
      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={[]}
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {renderSectionHeader('Meus Jogadores')}
            {players.myPlayers.length === 0 ? (
              renderEmptyState('Você ainda não criou nenhum jogador')
            ) : (
              players.myPlayers.map((player) => (
                <View key={player.id}>
                  {renderPlayerItem({ item: player, isMyPlayer: true })}
                </View>
              ))
            )}

            {renderSectionHeader('Jogadores da Comunidade')}
            {players.communityPlayers.length === 0 ? (
              renderEmptyState('Nenhum jogador disponível nas suas comunidades')
            ) : (
              players.communityPlayers.map((player) => (
                <View key={player.id}>
                  {renderPlayerItem({ item: player, isMyPlayer: false })}
                </View>
              ))
            )}
          </>
        )}
      />

      <FloatingButton 
        icon="plus" 
        onPress={() => router.push('/(pages)/jogador/novo')}
        accessibilityLabel="Adicionar novo jogador"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a74520',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginLeft: 4,
  },
  linkedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  playerNickname: {
    fontSize: 14,
    marginTop: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  playerPhone: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});