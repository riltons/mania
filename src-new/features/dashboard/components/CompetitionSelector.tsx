import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { Competition } from '../../../core/types/database.types';

interface CompetitionSelectorProps {
  competitions: Competition[];
  selectedCompetitionId: string | null;
  onSelectCompetition: (competitionId: string | null) => void;
}

const Container = styled.View`
  margin-bottom: 24px;
`;

const Title = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const SelectorContainer = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { paddingHorizontal: 4 }
})``;

const CompetitionChip = styled.TouchableOpacity<{ isSelected: boolean }>`
  background-color: ${({ isSelected, theme }) => 
    isSelected ? theme.colors.primary : theme.colors.backgroundMedium
  };
  border: 2px solid ${({ isSelected, theme }) => 
    isSelected ? theme.colors.primary : theme.colors.border
  };
  border-radius: 25px;
  padding: 12px 20px;
  margin-right: 12px;
  min-width: 100px;
  align-items: center;
`;

const ChipText = styled.Text<{ isSelected: boolean }>`
  color: ${({ isSelected, theme }) => 
    isSelected ? theme.colors.white : theme.colors.textPrimary
  };
  font-size: 14px;
  font-weight: 600;
  text-align: center;
`;

const AllGamesChip = styled.TouchableOpacity<{ isSelected: boolean }>`
  background-color: ${({ isSelected, theme }) => 
    isSelected ? theme.colors.accent : theme.colors.backgroundMedium
  };
  border: 2px solid ${({ isSelected, theme }) => 
    isSelected ? theme.colors.accent : theme.colors.border
  };
  border-radius: 25px;
  padding: 12px 20px;
  margin-right: 12px;
  min-width: 120px;
  align-items: center;
`;

const AllGamesText = styled.Text<{ isSelected: boolean }>`
  color: ${({ isSelected, theme }) => 
    isSelected ? theme.colors.white : theme.colors.textPrimary
  };
  font-size: 14px;
  font-weight: 600;
  text-align: center;
`;

const EmptyMessage = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundMedium};
  border-radius: 12px;
  padding: 16px;
  align-items: center;
`;

const EmptyText = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
`;

export const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({
  competitions,
  selectedCompetitionId,
  onSelectCompetition
}) => {
  if (competitions.length === 0) {
    return (
      <Container>
        <Title>Competições</Title>
        <EmptyMessage>
          <EmptyText>
            Nenhuma competição em andamento encontrada
          </EmptyText>
        </EmptyMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Filtrar por Competição</Title>
      <SelectorContainer>
        <AllGamesChip
          isSelected={selectedCompetitionId === null}
          onPress={() => onSelectCompetition(null)}
        >
          <AllGamesText isSelected={selectedCompetitionId === null}>
            Todas as Competições
          </AllGamesText>
        </AllGamesChip>
        
        {competitions.map((competition) => (
          <CompetitionChip
            key={competition.id}
            isSelected={selectedCompetitionId === competition.id}
            onPress={() => onSelectCompetition(competition.id)}
          >
            <ChipText isSelected={selectedCompetitionId === competition.id}>
              {competition.name}
            </ChipText>
          </CompetitionChip>
        ))}
      </SelectorContainer>
    </Container>
  );
}; 