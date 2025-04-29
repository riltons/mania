import styled from "styled-components/native"
import { colors } from "@/styles/colors"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, StatusBar, Platform, View, Image } from 'react-native';
import { ThemeToggle } from './ThemeToggle';

// Importando a logo completa
import dominoLogo from '../../assets/images/dominomania-logo.png';

const SafeAreaView = styled.View`
    background-color: ${colors.primary};
`;

const Container = styled.View<{ statusBarHeight: number }>`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: ${colors.primary};
    padding-top: ${({ statusBarHeight }) => Platform.OS === 'ios' ? 44 : 16}px;
    width: 100%;
`;

const LeftContainer = styled.View`
    flex-direction: row;
    align-items: center;
    max-width: 50%;
`;

const LogoContainer = styled.View`
    width: 160px;
    height: 50px;
    align-items: flex-start;
    justify-content: center;
`;

const Title = styled.Text`
    color: ${colors.white};
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    flex-shrink: 1;
`;

const ActionContainer = styled.View`
    flex-direction: row;
    align-items: center;
    gap: 8px;
`;

const IconButton = styled.TouchableOpacity`
    padding: 4px;
`;

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    isDashboard?: boolean;
}

export function Header({ title, showBackButton, isDashboard }: HeaderProps) {
    const router = useRouter();
    const { signOut } = useAuth();
    const statusBarHeight = StatusBar.currentHeight || 0;

    React.useEffect(() => {
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('transparent');
        }
        StatusBar.setBarStyle('light-content');
    }, []);

    const handleLogout = async () => {
        try {
            const response = await signOut();
            if (response.success) {
                // Redirecionar para a página de login após logout bem-sucedido
                router.replace('/login');
            } else {
                console.error('Erro ao fazer logout:', response.error);
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    return (
        <SafeAreaView>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
            <Container statusBarHeight={statusBarHeight}>
                <LeftContainer>
                    {isDashboard ? (
                        <LogoContainer>
                            <Image source={dominoLogo} style={{ width: 160, height: 50, resizeMode: 'contain' }} />
                        </LogoContainer>
                    ) : showBackButton ? (
                        <IconButton onPress={() => router.back()}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
                        </IconButton>
                    ) : (
                        <Title>{title}</Title>
                    )}
                </LeftContainer>
                
                <ActionContainer>
                    <IconButton onPress={() => router.push('/notifications')}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.white} />
                    </IconButton>
                    <IconButton onPress={() => router.push('/profile')}>
                        <MaterialCommunityIcons name="account-circle-outline" size={24} color={colors.white} />
                    </IconButton>
                    <ThemeToggle />
                    <IconButton onPress={() => router.push('/onboarding')}>
                        <MaterialCommunityIcons name="information-outline" size={24} color={colors.white} />
                    </IconButton>
                    <IconButton onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={24} color={colors.white} />
                    </IconButton>
                </ActionContainer>
            </Container>
        </SafeAreaView>
    );
}
