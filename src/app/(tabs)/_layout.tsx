import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { colors } from '@/styles/colors';
import { useTheme } from '@/contexts/ThemeProvider';
import { Feather } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import styled from 'styled-components/native';

export default function TabRoutesLayout() {
    const { colors } = useTheme();

    useEffect(() => {
        async function configureNavigationBar() {
            if (Platform.OS === 'android') {
                await NavigationBar.setBackgroundColorAsync(colors.primary);
                await NavigationBar.setButtonStyleAsync('light');
                await NavigationBar.setBorderColorAsync(colors.primary);
            }
        }

        configureNavigationBar();
    }, []);

    return (
        <Container>
            <Content>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: {
                            display: 'none'
                        }
                    }}
                >
                    <Tabs.Screen
                        name="dashboard"
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <Feather
                                    name="grid"
                                    size={24}
                                    color={focused ? colors.primary : colors.textSecondary}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="comunidades"
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <Feather
                                    name="users"
                                    size={24}
                                    color={focused ? colors.primary : colors.textSecondary}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="competicoes"
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <Feather
                                    name="award"
                                    size={24}
                                    color={focused ? colors.primary : colors.textSecondary}
                                />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="jogadores"
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <Feather
                                    name="user"
                                    size={24}
                                    color={focused ? colors.primary : colors.textSecondary}
                                />
                            ),
                        }}
                    />
                </Tabs>
            </Content>
            <NavigationContainer>
                <BottomNavigation />
            </NavigationContainer>
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