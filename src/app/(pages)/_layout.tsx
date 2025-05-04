import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import styled from 'styled-components/native';
import { usePathname } from 'expo-router';

export default function PagesLayout() {
    const { colors } = useTheme();
    const pathname = usePathname();
    // Oculta bottom nav em /subscription e /pricing
    const hideNav = Boolean(pathname?.startsWith('/subscription') || pathname?.startsWith('/pricing'));
    
    return (
        <Container>
            <Content>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: {
                            backgroundColor: colors.backgroundDark,
                        }
                    }}
                >
                    <Stack.Screen 
                        name="profile" 
                        options={{
                            headerShown: false,
                            presentation: 'modal'
                        }} 
                    />
                    <Stack.Screen 
                        name="jogos/index" 
                        options={{
                            headerShown: false
                        }} 
                    />
                    <Stack.Screen 
                        name="comunidade/[id]" 
                        options={{
                            headerShown: false
                        }} 
                    />
                    <Stack.Screen 
                        name="comunidade/[id]/competicao/[competitionId]/jogo" 
                        options={{
                            headerShown: false
                        }} 
                    />
                    <Stack.Screen 
                        name="jogador/jogador/[id]" 
                        options={{
                            headerShown: false
                        }} 
                    />
                    <Stack.Screen 
                        name="top-jogadores" 
                        options={{
                            headerShown: false
                        }} 
                    />
                    <Stack.Screen name="pricing" options={{ headerShown: false }} />
                    <Stack.Screen name="subscription" options={{ headerShown: false }} />
                    <Stack.Screen name="trial-offer" options={{ headerShown: false }} />
                    <Stack.Screen name="feature-locked" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                </Stack>
            </Content>
            {!hideNav && (
                <NavigationContainer>
                    <BottomNavigation />
                </NavigationContainer>
            )}
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    position: relative;
`;

const Content = styled.View`
    flex: 1;
    padding-bottom: 60px;
`;

const NavigationContainer = styled.View`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${({ theme }) => theme.colors.backgroundMedium};
    border-top-width: 1px;
    border-top-color: ${({ theme }) => theme.colors.border};
    height: 60px;
`;

