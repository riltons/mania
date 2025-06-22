import React from 'react';
import styled from 'styled-components/native';
import { Button } from '../ui/Button';

const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

const ErrorText = styled.Text`
    color: ${({ theme }: { theme: any }) => theme.colors.error};
    font-size: 16px;
    text-align: center;
    margin-bottom: 16px;
`;

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
    message, 
    onRetry, 
    retryText = 'Tentar Novamente' 
}) => {
    return (
        <Container>
            <ErrorText>{message}</ErrorText>
            {onRetry && (
                <Button title={retryText} onPress={onRetry} variant="secondary" />
            )}
        </Container>
    );
}; 