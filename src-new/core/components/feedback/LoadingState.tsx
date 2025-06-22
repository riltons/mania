import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../../contexts/ThemeProvider';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const LoadingText = styled.Text`
    color: ${({ theme }: { theme: any }) => theme.colors.textSecondary};
    font-size: 16px;
    margin-top: 12px;
    text-align: center;
`;

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
    message = 'Carregando...', 
    size = 'large' 
}) => {
    const { colors } = useTheme();
    
    return (
        <Container>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && <LoadingText>{message}</LoadingText>}
        </Container>
    );
}; 