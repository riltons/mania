import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/core/contexts/ThemeProvider';

const tabs = [
    {
        name: 'dashboard',
        path: '/(tabs)/dashboard',
        icon: 'grid',
        label: 'Dashboard',
    },
    {
        name: 'comunidades',
        path: '/(tabs)/comunidades',
        icon: 'users',
        label: 'Comunidade',
    },
    {
        name: 'competicoes',
        path: '/(tabs)/competicoes',
        icon: 'award',
        label: 'Competição',
    },
    {
        name: 'jogadores',
        path: '/(tabs)/jogadores',
        icon: 'user',
        label: 'Jogadores',
    },
];

export function BottomNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { colors } = useTheme();

    const getActiveTab = () => {
        if (pathname.includes('/comunidade/')) {
            return '/(tabs)/comunidades';
        } else if (pathname.includes('/competicao/')) {
            return '/(tabs)/competicoes';
        } else if (pathname.includes('/jogador/')) {
            return '/(tabs)/jogadores';
        } else if (pathname === '/' || pathname.includes('/dashboard')) {
            return '/(tabs)/dashboard';
        }
        
        // Fallback para correspondência parcial
        for (const tab of tabs) {
            const cleanPath = tab.path.replace('/(tabs)', '');
            if (pathname.includes(cleanPath)) {
                return tab.path;
            }
        }
        
        return null;
    };

    const activeTab = getActiveTab();

    return (
        <Container>
            {tabs.map((tab) => (
                <TabButton
                    key={tab.name}
                    onPress={() => router.push(tab.path as any)}
                    isActive={activeTab === tab.path}
                >
                    <TabIcon
                        name={tab.icon as any}
                        size={24}
                        color={activeTab === tab.path ? colors.white : colors.textSecondary}
                    />
                    <TabLabel isActive={activeTab === tab.path}>{tab.label}</TabLabel>
                </TabButton>
            ))}
        </Container>
    );
}

const Container = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 4px;
    width: 100%;
    height: 60px;
`;

const TabButton = styled.TouchableOpacity<{ isActive: boolean }>`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
    background-color: ${({ isActive, theme }: { isActive: boolean; theme: any }) => isActive ? theme.colors.tertiary : 'transparent'};
    border-radius: 8px;
    margin: 0 5px;
`;

const TabIcon = styled(Feather)<{ isActive: boolean }>`
    color: ${({ isActive, theme }: { isActive: boolean; theme: any }) => isActive ? theme.colors.gray900 : theme.colors.gray400};
`;

const TabLabel = styled.Text<{ isActive: boolean }>`
    margin-top: 2px;
    font-size: 10px;
    color: ${({ isActive, theme }: { isActive: boolean; theme: any }) => isActive ? theme.colors.primary : theme.colors.textSecondary};
    font-weight: ${({ isActive }: { isActive: boolean }) => (isActive ? 'bold' : 'normal')};
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
`;
