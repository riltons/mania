import React from 'react';
import styled from 'styled-components/native';
import { colors } from '@/styles/colors';
import { Feather } from '@expo/vector-icons';
import { View, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

type InternalHeaderProps = {
    title: string;
    onBack?: () => void;
    rightContent?: React.ReactNode;
};

export function InternalHeader({ title, onBack, rightContent }: InternalHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View style={{
            width: '100%',
            backgroundColor: colors.primary,
            marginTop: 0
        }}>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
            <Container>
                <HeaderLeft>
                    <BackButton onPress={handleBack}>
                        <Feather name="arrow-left" size={24} color={colors.white} />
                    </BackButton>
                    <HeaderTitle>{title}</HeaderTitle>
                </HeaderLeft>
                <HeaderRight>
                    {rightContent && <RightContentContainer>{rightContent}</RightContentContainer>}
                    <TouchableOpacity 
                        onPress={() => router.push('/onboarding')}
                        style={{ 
                            padding: 8,
                            marginLeft: 8,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 20
                        }}
                    >
                        <Feather name="info" size={24} color={colors.white} />
                    </TouchableOpacity>
                </HeaderRight>
            </Container>
        </View>
    );
}

const Container = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 12px;
    padding-bottom: 12px;
    background-color: ${colors.primary};
    width: 100%;
    margin: 0;
`;

const HeaderLeft = styled.View`
    flex-direction: row;
    align-items: center;
    flex: 1;
`;

const BackButton = styled.TouchableOpacity`
    padding: 4px;
    margin-right: 16px;
`;

const HeaderTitle = styled.Text`
    color: ${colors.white};
    font-size: 20px;
    font-weight: bold;
`;

const HeaderRight = styled.View`
    flex-direction: row;
    align-items: center;
`;

const RightContentContainer = styled.View`
    margin-right: 16px;
`;
