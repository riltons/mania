import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import styled from 'styled-components/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const isDarkTheme = theme === 'dark';

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

    // Cor de fundo baseada no tema
    const backgroundColor = isDarkTheme ? colors.backgroundDark : colors.white;
    const borderColor = isDarkTheme ? colors.borderDark : colors.borderLight;

    return (
        <Container style={{
            backgroundColor,
            borderTopColor: borderColor,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0
        }}>
            {tabs.map((tab) => (
                <TabButton
                    key={tab.name}
                    onPress={() => router.push(tab.path as any)}
                    isActive={activeTab === tab.path}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeTab === tab.path }}
                    accessibilityLabel={tab.label}
                >
                    <TabIcon 
                        name={tab.icon as any}
                        size={24}
                        color={activeTab === tab.path ? colors.primary : colors.textSecondary}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                    />
                    <TabLabel 
                        isActive={activeTab === tab.path}
                        style={{
                            color: activeTab === tab.path ? colors.primary : colors.textSecondary
                        }}
                    >
                        {tab.label}
                    </TabLabel>
                </TabButton>
            ))}
        </Container>
    );
}

const Container = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 4px 0;
    width: 100%;
    min-height: 60px;
    border-top-width: 1px;
`;

const TabButton = styled.TouchableOpacity<{ isActive: boolean }>`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 8px 0 12px;
    background-color: transparent;
    border-radius: 8px;
    margin: 0 2px;
`;

const TabIcon = styled(Feather)`
    margin-bottom: 4px;
`;

interface TabLabelProps {
    isActive: boolean;
}

const TabLabel = styled.Text<TabLabelProps>`
    font-size: 10px;
    font-weight: ${(props: TabLabelProps) => (props.isActive ? '600' : '400')};
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
`;
