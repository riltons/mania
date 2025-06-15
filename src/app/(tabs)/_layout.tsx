import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { Feather } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabRoutesLayout() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const BOTTOM_NAV_HEIGHT = 60; // Altura fixa da navegação inferior

    useEffect(() => {
        async function configureNavigationBar() {
            if (Platform.OS === 'android') {
                await NavigationBar.setBackgroundColorAsync(colors.primary);
                await NavigationBar.setButtonStyleAsync('light');
                await NavigationBar.setBorderColorAsync(colors.primary);
            }
        }

        configureNavigationBar();
    }, [colors]);

    return (
        <Container>
            <Content style={{
                paddingBottom: BOTTOM_NAV_HEIGHT + (insets.bottom || 0)
            }}>
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
            <NavigationContainer style={{
                height: BOTTOM_NAV_HEIGHT + (insets.bottom || 0),
                paddingBottom: insets.bottom || 0
            }}>
                <BottomNavigation />
            </NavigationContainer>
        </Container>
    );
}

const Container = styled.View`
    flex: 1;
    position: relative;
    padding-top: ${Platform.OS === 'android' ? StatusBar.currentHeight : 0}px;
`;

interface ContentProps {
    theme: {
        colors: {
            backgroundDark: string;
        };
    };
}

const Content = styled.View<ContentProps>`
    flex: 1;
    background-color: ${(props: ContentProps) => props.theme.colors.backgroundDark};
    padding-top: ${Platform.OS === 'ios' ? 44 : 0}px; /* Altura aproximada do Header */
`;

interface ThemeProps {
    theme: {
        colors: {
            backgroundMedium: string;
            border: string;
        };
    };
}

interface ThemeType {
    colors: {
        backgroundMedium: string;
        border: string;
    };
}

interface NavigationContainerProps {
    theme: ThemeType;
    style?: any;
}

const NavigationContainer = styled.View<NavigationContainerProps>`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${(props: NavigationContainerProps) => props.theme.colors.backgroundMedium};
    border-top-width: 1px;
    border-top-color: ${(props: NavigationContainerProps) => props.theme.colors.border};
`;
