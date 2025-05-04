import React from 'react';
import { TextInputProps as RNTextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';

interface TextInputProps extends RNTextInputProps {
    label?: string;
}

export function TextInput({ label, ...rest }: TextInputProps) {
    const { colors } = useTheme();
    
    return (
        <Container>
            {label && <Label>{label}</Label>}
            <Input
                placeholderTextColor={colors.textDisabled}
                {...rest}
            />
        </Container>
    );
}

const Container = styled.View`
    gap: 4px;
`;

const Label = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

const Input = styled.TextInput`
    background-color: ${({ theme }) => theme.colors.tertiary};
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textPrimary};
    border: 1px solid ${({ theme }) => theme.colors.border};
`;
