import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DashboardSectionProps {
  title: string;
  icon: string;
  count?: number;
  children: React.ReactNode;
  backgroundColor?: string;
}

const Container = styled.View`
  margin-bottom: 32px;
`;

const SectionHeader = styled.View<{ bgColor?: string }>`
  background-color: ${({ bgColor, theme }) => bgColor || theme.colors.backgroundMedium};
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 3px;
  border-bottom-color: ${({ theme }) => theme.colors.primary};
`;

const HeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SectionTitle = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 24px;
  font-weight: bold;
  margin-left: 12px;
`;

const CountBadge = styled.View`
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 20px;
  padding: 8px 16px;
  min-width: 40px;
  align-items: center;
`;

const CountText = styled.Text`
  color: ${({ theme }) => theme.colors.white};
  font-size: 16px;
  font-weight: bold;
`;

const Content = styled.View`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: 0 0 16px 16px;
  padding: 24px;
  min-height: 200px;
`;

const EmptyState = styled.View`
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const EmptyIcon = styled.View`
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
`;

const EmptyDescription = styled.Text`
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 14px;
  text-align: center;
  line-height: 20px;
`;

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon,
  count,
  children,
  backgroundColor
}) => {
  const hasContent = React.Children.count(children) > 0;

  const getEmptyMessage = () => {
    switch (title) {
      case 'Jogos em Andamento':
        return {
          title: 'Nenhum jogo em andamento',
          description: 'Quando houver jogos sendo realizados, eles aparecerão aqui'
        };
      case 'Jogos Finalizados (Última Hora)':
        return {
          title: 'Nenhum jogo finalizado recentemente',
          description: 'Jogos finalizados na última hora aparecerão aqui'
        };
      case 'Próximos Jogos':
        return {
          title: 'Nenhum jogo agendado',
          description: 'Jogos pendentes aparecerão aqui quando forem criados'
        };
      default:
        return {
          title: 'Nenhum dado disponível',
          description: 'Os dados aparecerão aqui quando estiverem disponíveis'
        };
    }
  };

  const emptyMessage = getEmptyMessage();

  return (
    <Container>
      <SectionHeader bgColor={backgroundColor}>
        <HeaderLeft>
          <MaterialCommunityIcons 
            name={icon as any} 
            size={32} 
            color="#8257E5" 
          />
          <SectionTitle>{title}</SectionTitle>
        </HeaderLeft>
        {count !== undefined && (
          <CountBadge>
            <CountText>{count}</CountText>
          </CountBadge>
        )}
      </SectionHeader>
      
      <Content>
        {hasContent ? (
          children
        ) : (
          <EmptyState>
            <EmptyIcon>
              <MaterialCommunityIcons 
                name={icon as any} 
                size={64} 
                color="#7C7C8A" 
              />
            </EmptyIcon>
            <EmptyTitle>{emptyMessage.title}</EmptyTitle>
            <EmptyDescription>{emptyMessage.description}</EmptyDescription>
          </EmptyState>
        )}
      </Content>
    </Container>
  );
}; 