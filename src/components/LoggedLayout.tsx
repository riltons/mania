import React from 'react';
import styled from 'styled-components/native';
import { BottomNavigation } from './BottomNavigation';
import { useTheme } from '../contexts/ThemeProvider';
import { View } from 'react-native';

type LoggedLayoutProps = {
    children: React.ReactNode;
    hideNavigation?: boolean;
};

export function LoggedLayout({ children, hideNavigation = false }: LoggedLayoutProps) {
    const { colors } = useTheme();

    return (
        <Container>
            <Content>
                {children}
            </Content>
            {!hideNavigation && (
                <NavigationContainer>
                    <BottomNavigation />
                </NavigationContainer>
            )}
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const Content = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const NavigationContainer = styled.View`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
    border-top-width: 1px;
    border-top-color: ${({ theme }) => theme.colors.border};
`;
