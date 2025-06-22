import React from 'react';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeProvider';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const EmptyIcon = styled.View`
    margin-bottom: 16px;
`;

const EmptyText = styled.Text`
    color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
    font-size: 16px;
    text-align: center;
`;

interface EmptyStateProps {
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    message, 
    icon = 'document-outline',
    iconSize = 48 
}) => {
    const { colors } = useTheme();
    
    return (
        <Container>
            <EmptyIcon>
                <Ionicons name={icon} size={iconSize} color={colors.textSecondary} />
            </EmptyIcon>
            <EmptyText>{message}</EmptyText>
        </Container>
    );
}; 