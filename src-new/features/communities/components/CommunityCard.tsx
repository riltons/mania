import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Importando de arquivos barrel no core
import { formatDateBR } from '@/core/utils';
import { Avatar, Card } from '@/core/components/ui';

// Importando usando o estilo de tipagem correto
interface ThemeProps {
  theme: {
    colors: {
      textPrimary: string;
      backgroundMedium: string;
      background: string;
      primary: string;
    }
  }
}

// Definindo a interface do componente
interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    avatar_url?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CommunityCard = ({ community, onEdit, onDelete }: CommunityCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    router.navigate(`/comunidade/${community.id}`);
  };

  return (
    <Card style={styles.container}>
      <TouchableOpacity style={styles.cardContent} onPress={handlePress}>
        <Avatar 
          size={50} 
          source={{ uri: community.avatar_url }} 
          fallbackText={community.name.substring(0, 2)}
        />

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{community.name}</Text>
          
          {community.description && (
            <Text style={styles.description} numberOfLines={2}>
              {community.description}
            </Text>
          )}
          
          <Text style={styles.date}>
            Criada em {formatDateBR(community.created_at)}
          </Text>
        </View>

        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Feather name="edit-2" size={18} color="#8257E5" />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Feather name="trash-2" size={18} color="#FF3333" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
