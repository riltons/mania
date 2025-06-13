import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import styled from 'styled-components/native';

// Interface para tipagem das props do tema
interface ThemeProps {
  theme: {
    colors: {
      backgroundMedium: string;
      text: string;
      textPrimary: string;
    }
  }
}

// Interface para as props do componente
interface InternalHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  transparent?: boolean;
}

// Componente estilizado para o cabeçalho
const HeaderContainer = styled(View)<{ transparent?: boolean }>`
  background-color: ${(props: ThemeProps & { transparent?: boolean }) => 
    props.transparent ? 'transparent' : props.theme.colors.backgroundMedium};
  padding: 16px;
  padding-top: ${() => StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 16}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled(Text)`
  color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
  font-size: 18px;
  font-weight: bold;
  flex: 1;
  text-align: center;
`;

const BackButtonContainer = styled(TouchableOpacity)`
  position: absolute;
  left: 16px;
  top: ${() => StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 16}px;
  z-index: 10;
`;

const RightComponentContainer = styled(View)`
  position: absolute;
  right: 16px;
  top: ${() => StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 16}px;
  z-index: 10;
`;

/**
 * Componente de cabeçalho interno da aplicação
 * Usado em telas que precisam de navegação de volta
 */
export const InternalHeader = ({ 
  title, 
  showBackButton = true, 
  rightComponent, 
  onBackPress, 
  transparent = false 
}: InternalHeaderProps) => {
  const router = useRouter();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <HeaderContainer transparent={transparent}>
      {showBackButton && (
        <BackButtonContainer onPress={handleBackPress}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </BackButtonContainer>
      )}
      
      <HeaderTitle>{title}</HeaderTitle>
      
      {rightComponent && (
        <RightComponentContainer>
          {rightComponent}
        </RightComponentContainer>
      )}
    </HeaderContainer>
  );
};
